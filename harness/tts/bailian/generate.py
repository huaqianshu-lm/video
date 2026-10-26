#!/usr/bin/env python3
"""Generate Bailian audio plus verified source-text timing for the Harness.

This worker deliberately keeps the frozen text as the subtitle source. ASR only
supplies timing evidence; a segment stops when its word timing cannot map back
to the frozen text without guessing character boundaries.
"""

import argparse
import base64
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path

TTS_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
TRANSIENT_HTTP = {429, 500, 502, 503, 504}
ASR_ATTEMPTS = 3
HOTWORD_WEIGHT = 50


class WorkerError(RuntimeError):
    pass


def fail(message):
    raise WorkerError(message)


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def spoken_code_punctuation_indexes(text):
    """Treat a spoken dot between ASCII tokens as code punctuation, not prose."""
    indexes = set()
    for match in re.finditer(r"(?i)[a-z0-9]\s*(点|dot)\s*[a-z0-9]", text):
        marker = match.group(1)
        marker_start = match.start(1)
        indexes.update(range(marker_start, marker_start + len(marker)))
    return indexes


def non_punctuation_characters(text):
    ignored = spoken_code_punctuation_indexes(text)
    return [
        (char.casefold(), index)
        for index, char in enumerate(text)
        if index not in ignored and not char.isspace() and not re.match(r"[\W_]", char, re.UNICODE)
    ]


def normalized(text):
    return "".join(char for char, _ in non_punctuation_characters(text))


def milliseconds(value):
    number = float(value)
    return number / 1000 if number > 100 else number


def request_bytes(url, data=None, headers=None):
    request = urllib.request.Request(url, data=data, headers=headers or {}, method="POST" if data is not None else "GET")
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read(), response.headers.get_content_type()


def synthesize(text, provider):
    api_key = os.environ.get("DASHSCOPE_API_KEY")
    if not api_key:
        fail("百炼 TTS 缺少 DASHSCOPE_API_KEY")
    body = json.dumps({
        "model": provider["model"],
        "input": {
            "text": text,
            "voice": provider["voice"],
            "language_type": provider["languageType"],
        },
    }).encode("utf-8")
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    last_error = None
    for attempt in range(3):
        try:
            raw, _ = request_bytes(TTS_URL, body, headers)
            response = json.loads(raw)
            audio = response.get("output", {}).get("audio", {})
            if audio.get("data"):
                return base64.b64decode(audio["data"]), "wav", response.get("request_id")
            if audio.get("url"):
                media, content_type = request_bytes(audio["url"])
                extension = "wav" if "wav" in content_type else "mp3" if "mpeg" in content_type else "bin"
                return media, extension, response.get("request_id")
            fail(f"百炼 TTS 未返回音频，request_id={response.get('request_id', 'unknown')}")
        except urllib.error.HTTPError as error:
            last_error = error
            if error.code not in TRANSIENT_HTTP:
                detail = error.read().decode("utf-8", errors="replace").strip()
                fail(f"百炼 TTS HTTP {error.code}: {detail[:1000]}")
        except (urllib.error.URLError, TimeoutError) as error:
            last_error = error
        if attempt < 2:
            time.sleep(1 + attempt)
    fail(f"百炼 TTS 临时失败，已重试两次：{last_error}")


def duration_seconds(audio_path):
    result = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nokey=1:noprint_wrappers=1", str(audio_path)], capture_output=True, text=True, check=False)
    if result.returncode == 0:
        value = float(result.stdout.strip())
        if value > 0:
            return value
    try:
        with wave.open(str(audio_path), "rb") as handle:
            return handle.getnframes() / handle.getframerate()
    except wave.Error:
        fail(f"无法读取百炼音频时长：{result.stderr.strip()}")


def asr_request_id(result):
    if isinstance(result, dict):
        return result.get("request_id")
    value = getattr(result, "request_id", None)
    if value:
        return value
    getter = getattr(result, "get_request_id", None)
    return getter() if callable(getter) else None


def recognize(audio_path, provider, vocabulary):
    api_key = os.environ.get("DASHSCOPE_API_KEY")
    if not api_key:
        fail("百炼 ASR 缺少 DASHSCOPE_API_KEY")
    messages = []
    if vocabulary:
        messages.append({"role": "user", "content": [{"type": "input_text", "text": f"术语表：{'，'.join(vocabulary)}"}]})
    data = base64.b64encode(audio_path.read_bytes()).decode("ascii")
    messages.append({"role": "user", "content": [{"type": "input_audio", "input_audio": {"data": f"data:audio/wav;base64,{data}"}}]})
    body = json.dumps({
        "model": provider["timingProvider"],
        "input": {"messages": messages},
        "parameters": {
            "format": "wav",
            "sample_rate": 16000,
            "vocabulary": {term: HOTWORD_WEIGHT for term in vocabulary},
        },
    }).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "X-DashScope-SSE": "disable",
    }
    try:
        raw, _ = request_bytes(TTS_URL, body, headers)
        result = json.loads(raw)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace").strip()
        fail(f"百炼 Qwen ASR HTTP {error.code}: {detail[:1000]}")
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        fail(f"百炼 Qwen ASR 调用失败：{error}")
    output = result.get("output") or {}
    nested = output.get("output") or {}
    sentence = nested.get("sentence") or output.get("sentence")
    sentences = [sentence] if isinstance(sentence, dict) else nested.get("sentences") or output.get("sentences")
    if not isinstance(sentences, list) or not sentences:
        fail("百炼 ASR 未返回句子与词级时间戳")
    return {"requestId": result.get("request_id") or asr_request_id(result), "sentences": sentences}


def hotwords_from_text(text):
    terms, seen = [], set()
    matches = list(re.finditer(r"[A-Za-z][A-Za-z0-9._-]*", text))
    # Keep spoken command options intact instead of hinting only their ASCII name.
    matches += list(re.finditer(r"[A-Za-z][A-Za-z0-9._-]*\s+(?:减|加)\s*(?:[0-9零〇一二两三四五六七八九十百千万]+|[A-Za-z][A-Za-z0-9._-]*)", text))
    for match in matches:
        term = match.group(0)
        key = term.casefold()
        if key not in seen:
            seen.add(key)
            terms.append(term)
    return terms[:50]


def hotwords(tts):
    terms, seen = [], set()
    for scene in tts["scenes"]:
        for segment in scene["segments"]:
            for term in hotwords_from_text(segment["text"]):
                if term.casefold() not in seen:
                    seen.add(term.casefold())
                    terms.append(term)
    return terms[:50]


def asr_copy(audio_path, timing_dir, segment_id):
    """Create a 16 kHz mono WAV for ASR without changing temporal speed."""
    timing_dir.mkdir(parents=True, exist_ok=True)
    target = timing_dir / f"{segment_id}.asr.wav"
    source_duration = duration_seconds(audio_path)
    result = subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(audio_path), "-ar", "16000", "-ac", "1", str(target)], capture_output=True, text=True, check=False)
    if result.returncode != 0:
        fail(f"无法创建百炼 ASR 音频副本：{result.stderr.strip()}")
    target_duration = duration_seconds(target)
    if abs(source_duration - target_duration) > 0.02:
        fail("百炼 ASR 音频副本时长发生偏移")
    return target


def word_entries(asr):
    words = []
    for sentence in asr["sentences"]:
        for word in sentence.get("words") or []:
            text = word.get("text") or word.get("word")
            begin = word.get("begin_time", word.get("beginTime"))
            end = word.get("end_time", word.get("endTime"))
            if not isinstance(text, str) or begin is None or end is None:
                fail("百炼 ASR 词条缺少文字或时间戳")
            start = milliseconds(begin)
            finish = milliseconds(end)
            if finish <= start:
                fail("百炼 ASR 返回了非正词时长")
            if normalized(text):
                words.append({"text": text, "start": start, "end": finish})
    if not words:
        fail("百炼 ASR 未返回可映射的词级时间戳")
    return words


INTEGER_CHARS = "0123456789零〇一二两三四五六七八九十百千万亿"
CHINESE_DIGITS = {char: value for value, char in enumerate("零一二三四五六七八九")}
CHINESE_DIGITS.update({"〇": 0, "两": 2})


def chinese_integer_text(value):
    if value >= 10000:
        head, tail = divmod(value, 10000)
        return chinese_integer_text(head) + "万" + ("零" if 0 < tail < 1000 else "") + (chinese_integer_text(tail) if tail else "")
    if not value:
        return "零"
    result, gap = "", False
    for unit, label in [(1000, "千"), (100, "百"), (10, "十"), (1, "")]:
        digit, value = divmod(value, unit)
        if digit:
            if gap:
                result += "零"
            result += ("" if unit == 10 and digit == 1 and not result else "零一二三四五六七八九"[digit]) + label
            gap = False
        elif result and value:
            gap = True
    return result


def integer_value(text):
    if re.fullmatch(r"[0-9]+", text):
        return int(text)
    if all(char in CHINESE_DIGITS for char in text):
        return int("".join(str(CHINESE_DIGITS[char]) for char in text))
    canonical = text.replace("〇", "零").replace("两", "二")
    if canonical.count("万") > 1 or "亿" in canonical:
        return None
    total, number = 0, None
    for index, char in enumerate(canonical):
        if char in CHINESE_DIGITS:
            number = CHINESE_DIGITS[char]
        elif char in "十百千":
            if number is None and not (char == "十" and index == 0):
                return None
            total += (1 if number is None else number) * {"十": 10, "百": 100, "千": 1000}[char]
            number = None
        elif char == "万":
            total = (total + (number or 0)) * 10000
            number = None
        else:
            return None
    value = total + (number or 0)
    # Reject colloquial shorthand such as 三千五 rather than guessing its value.
    if value >= 100000000 or chinese_integer_text(value) != canonical:
        return None
    return value


def integer_tokens(text):
    chars = non_punctuation_characters(text)
    tokens, cursor = [], 0
    while cursor < len(chars):
        char, start = chars[cursor]
        finish = cursor + 1
        if char in INTEGER_CHARS:
            while finish < len(chars) and chars[finish][0] in INTEGER_CHARS:
                finish += 1
        end = chars[finish - 1][1] + 1
        raw = text[start:end]
        value = integer_value(raw) if char in INTEGER_CHARS else None
        key = ("integer", value) if value is not None else ("literal", "他" if char in "他她它" else normalized(raw))
        tokens.append({"key": key, "start": start, "end": end, "text": raw})
        cursor = finish
    return tokens


def integer_word_mapping(source, words):
    asr_text = "".join(word["text"] for word in words)
    # Do not erase signs, decimal points, fractions or date separators and then
    # mistake the remaining digits for an equal integer.
    digits = re.escape(INTEGER_CHARS)
    special = rf"(?:[+\-−.．/%:：]\s*[{digits}])|(?:[{digits}]\s*[.．/%:：年月日])|(?:[{digits}][,，][{digits}])"
    if any(re.search(special, text) for text in (source, asr_text)):
        fail("整数写法映射不支持符号、小数或日期格式转换")
    left, right = integer_tokens(source), integer_tokens(asr_text)
    if len(left) != len(right) or any(a["key"] != b["key"] for a, b in zip(left, right)):
        fail("百炼 ASR 文字或整数值无法与冻结原文匹配；已阻断字幕时间生成")
    owner, starts = [], []
    for index, word in enumerate(words):
        if index and words[index - 1]["end"] > word["start"]:
            fail("整数写法映射需要有序且不重叠的真实词区间")
        starts.append(len(owner))
        owner.extend([index] * len(word["text"]))
    pairs = [(a, b, owner[b["start"]], owner[b["end"] - 1]) for a, b in zip(left, right)]
    mapped, first = [], 0
    while first < len(words):
        last = first
        for _, _, begin, end in pairs:
            if begin <= last and end >= first:
                last = max(last, end)
        covered = [(a, b) for a, b, begin, end in pairs if first <= begin <= end <= last]
        if not covered:
            fail("整数写法映射缺少可定位的原始词")
        changes = []
        for a, b in covered:
            if a["key"][0] == "integer" and a["text"] != b["text"]:
                changes.append({"sourceStart": a["start"], "sourceEnd": a["end"],
                                "sourceText": a["text"], "asrText": b["text"],
                                "integerValue": a["key"][1], "reason": "integer-writing"})
            elif a["text"] in "他她它" and b["text"] in "他她它" and a["text"] != b["text"]:
                changes.append({"sourceStart": a["start"], "sourceEnd": a["end"],
                                "sourceText": a["text"], "asrText": b["text"],
                                "asrOffset": b["start"] - starts[first], "reason": "homophone-pronoun"})
        mapped.append({"text": "".join(word["text"] for word in words[first:last + 1]),
                       "start": words[first]["start"], "end": words[last]["end"],
                       "sourceStart": covered[0][0]["start"], "sourceEnd": covered[-1][0]["end"],
                       "asrWordIndexes": list(range(first, last + 1)),
                       **({"substitutions": changes} if changes else {})})
        first = last + 1
    return cues_from_mapping(source, mapped), mapped


def map_words_to_source(source, words):
    source_chars = non_punctuation_characters(source)
    asr_chars = "".join(normalized(word["text"]) for word in words)
    source_flat = "".join(char for char, _ in source_chars)
    pronouns = frozenset("他她它")
    if len(source_flat) != len(asr_chars) or any(
        expected != recognized and not (expected in pronouns and recognized in pronouns)
        for expected, recognized in zip(source_flat, asr_chars)
    ):
        return integer_word_mapping(source, words)
    cursor = 0
    mapped = []
    for word in words:
        recognized_chars = non_punctuation_characters(word["text"])
        count = len(recognized_chars)
        indexes = [source_chars[item][1] for item in range(cursor, cursor + count)]
        substitutions = [
            {"sourceStart": indexes[index], "sourceEnd": indexes[index] + 1,
             "asrOffset": asr_offset, "asrText": recognized,
             "sourceText": source[indexes[index]], "reason": "homophone-pronoun"}
            for index, (recognized, asr_offset) in enumerate(recognized_chars)
            if source_chars[cursor + index][0] != recognized
        ]
        mapped.append({**word, "sourceStart": indexes[0], "sourceEnd": indexes[-1] + 1,
                       **({"substitutions": substitutions} if substitutions else {})})
        cursor += count
    return cues_from_mapping(source, mapped), mapped


def cues_from_mapping(source, mapped):
    cues = []
    for index, item in enumerate(mapped):
        next_start = mapped[index + 1]["sourceStart"] if index + 1 < len(mapped) else len(source)
        text = source[item["sourceStart"]:next_start]
        if not text:
            fail("冻结原文映射得到空字幕 Cue")
        cues.append({
            "id": f"word-{index + 1:03d}", "text": text,
            "start": item["start"], "end": item["end"],
            "sourceStart": item["sourceStart"], "sourceEnd": next_start,
        })
    return cues


def canonicalization_evidence(source):
    entries = []
    for match in re.finditer(r"(?i)[a-z0-9]\s*(点|dot)\s*[a-z0-9]", source):
        marker = match.group(1)
        entries.append({
            "sourceStart": match.start(1),
            "sourceEnd": match.start(1) + len(marker),
            "text": marker,
            "reason": "spoken-code-punctuation",
        })
    return entries


def aligned_timing(audio_path, timing_dir, segment_id, source, provider, vocabulary, tts_request_id):
    asr_path = asr_copy(audio_path, timing_dir, segment_id)
    attempt_summaries, last_error = [], None
    for attempt in range(1, ASR_ATTEMPTS + 1):
        attempt_path = timing_dir / f"{segment_id}.asr-attempt-{attempt}.json"
        summary = {
            "attempt": attempt,
            "file": str(attempt_path.relative_to(timing_dir.parent.parent)).replace(os.sep, "/"),
        }
        try:
            asr = recognize(asr_path, provider, vocabulary)
            summary["requestId"] = asr.get("requestId")
            summary["asr"] = asr
            cues, mapping = map_words_to_source(source, word_entries(asr))
            summary["status"] = "mapped"
            atomic_json(attempt_path, summary)
            attempt_summaries.append({key: summary.get(key) for key in ("attempt", "file", "requestId", "status")})
            return {
                "schemaVersion": 2,
                "segmentId": segment_id,
                "sourceText": source,
                "requestId": tts_request_id,
                "asrAudioFile": str(asr_path.relative_to(timing_dir.parent.parent)).replace(os.sep, "/"),
                "asr": asr,
                "asrAttempts": attempt_summaries,
                "selectedAsrAttempt": attempt,
                "canonicalization": canonicalization_evidence(source),
                "wordMapping": mapping,
                "cues": cues,
            }
        except WorkerError as error:
            last_error = str(error)
            summary["status"] = "rejected"
            summary["reason"] = last_error
            atomic_json(attempt_path, summary)
            attempt_summaries.append({key: summary.get(key) for key in ("attempt", "file", "requestId", "status", "reason")})
            if attempt < ASR_ATTEMPTS:
                time.sleep(attempt)
    fail(f"百炼 ASR 在 {ASR_ATTEMPTS} 次对齐后仍无法映射冻结原文：{last_error}")


def timestamp(seconds, srt=False):
    milliseconds_value = max(0, round(seconds * 1000))
    hours, remainder = divmod(milliseconds_value, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    seconds_value, ms = divmod(remainder, 1_000)
    separator = "," if srt else "."
    return f"{hours:02d}:{minutes:02d}:{seconds_value:02d}{separator}{ms:03d}"


def visible_text(text):
    return text.rstrip("。！？!?；;，,、：:")


def build_assets(tts, assets_root, provider):
    audio_scenes, subtitle_scenes, timeline_scenes = [], [], []
    all_captions = []
    offset = 0.0
    for scene in tts["scenes"]:
        scene_id = scene["sceneId"]
        audio_segments, subtitle_segments, timeline_segments = [], [], []
        scene_duration = 0.0
        for segment in scene["segments"]:
            segment_id, text = segment["id"], segment["text"]
            audio_dir = assets_root / "audio" / f"scene-{scene_id}"
            timing_dir = assets_root / "timing" / f"scene-{scene_id}"
            audio_dir.mkdir(parents=True, exist_ok=True)
            timing_dir.mkdir(parents=True, exist_ok=True)
            existing = sorted(audio_dir.glob(f"{segment_id}.*"))
            timing_path = timing_dir / f"{segment_id}.json"
            request_id = None
            if existing:
                audio_path = existing[0]
            else:
                media, extension, request_id = synthesize(text, provider)
                audio_path = audio_dir / f"{segment_id}.{extension}"
                audio_path.write_bytes(media)
                if audio_path.stat().st_size == 0:
                    fail(f"百炼返回空音频：{segment_id}")
            if timing_path.exists():
                timing = json.loads(timing_path.read_text(encoding="utf-8"))
                cues = timing.get("cues")
                if not isinstance(cues, list) or not cues:
                    fail(f"缓存时间戳无效：{segment_id}")
            else:
                vocabulary = hotwords_from_text(text)
                timing = aligned_timing(audio_path, timing_dir, segment_id, text, provider, vocabulary, request_id)
                timing["asrVocabulary"] = {
                    "mode": "inline",
                    "entries": vocabulary,
                    "weight": HOTWORD_WEIGHT,
                }
                atomic_json(timing_path, timing)
                cues = timing["cues"]
            duration = duration_seconds(audio_path)
            if cues[-1]["end"] > duration + 0.1:
                fail(f"百炼 ASR 时间超出音频时长：{segment_id}")
            relative_audio = str(audio_path.relative_to(assets_root)).replace(os.sep, "/")
            for cue in cues:
                all_captions.append({"text": visible_text(cue["text"]), "start": offset + scene_duration + cue["start"], "end": offset + scene_duration + cue["end"]})
            audio_segments.append({"id": segment_id, "file": relative_audio, "text": text, "duration": duration})
            subtitle_segments.append({"segmentId": segment_id, "audioFile": relative_audio, "cues": cues})
            timeline_segments.append({"segmentId": segment_id, "offset": scene_duration, "duration": duration, "end": scene_duration + duration, "audioFile": relative_audio, "subtitleFile": f"subtitles/scene-{scene_id}.json"})
            scene_duration += duration
        subtitle_path = assets_root / "subtitles" / f"scene-{scene_id}.json"
        atomic_json(subtitle_path, {"schemaVersion": "1.0", "videoId": tts["videoId"], "sceneId": scene_id, "segments": subtitle_segments})
        audio_scenes.append({"sceneId": scene_id, "segments": audio_segments, "narrationDuration": scene_duration})
        subtitle_scenes.append({"sceneId": scene_id, "file": str(subtitle_path.relative_to(assets_root)).replace(os.sep, "/"), "segments": subtitle_segments})
        timeline_scenes.append({"sceneId": scene_id, "offset": offset, "narrationDuration": scene_duration, "buffer": 0, "duration": scene_duration, "end": offset + scene_duration, "segments": timeline_segments})
        offset += scene_duration
    atomic_json(assets_root / "audio-manifest.json", {"schemaVersion": "1.0", "videoId": tts["videoId"], "scenes": audio_scenes})
    atomic_json(assets_root / "subtitle-manifest.json", {"schemaVersion": "1.0", "videoId": tts["videoId"], "scenes": subtitle_scenes})
    atomic_json(assets_root / "timeline-manifest.json", {"schemaVersion": "1.0", "videoId": tts["videoId"], "sceneBuffer": 0, "duration": offset, "scenes": timeline_scenes})
    subtitles = assets_root / "subtitles"
    subtitles.mkdir(parents=True, exist_ok=True)
    srt, vtt = [], ["WEBVTT", ""]
    for number, cue in enumerate(all_captions, 1):
        if not cue["text"]:
            continue
        srt.extend([str(number), f"{timestamp(cue['start'], True)} --> {timestamp(cue['end'], True)}", cue["text"], ""])
        vtt.extend([f"{timestamp(cue['start'])} --> {timestamp(cue['end'])}", cue["text"], ""])
    (subtitles / "captions.srt").write_text("\n".join(srt), encoding="utf-8")
    (subtitles / "captions.vtt").write_text("\n".join(vtt), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--tts-script", required=True)
    parser.add_argument("--assets-root", required=True)
    parser.add_argument("--provider-json", required=True)
    args = parser.parse_args()
    tts = json.loads(Path(args.tts_script).read_text(encoding="utf-8"))
    provider = json.loads(args.provider_json)
    if provider.get("provider") != "bailian" or provider.get("audioSpeed") != 1:
        fail("百炼 worker 只接受原始语速的 bailian 配置")
    if not tts.get("videoId") or not isinstance(tts.get("scenes"), list):
        fail("冻结 tts-script.json 无效")
    build_assets(tts, Path(args.assets_root), provider)


if __name__ == "__main__":
    try:
        main()
    except WorkerError as error:
        print(f"BAILIAN_TTS_FAILED: {error}", file=sys.stderr)
        sys.exit(1)
