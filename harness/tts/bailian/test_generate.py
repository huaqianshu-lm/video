import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path


WORKER_PATH = Path(__file__).with_name("generate.py")
SPEC = importlib.util.spec_from_file_location("bailian_generate", WORKER_PATH)
WORKER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(WORKER)


def words(*values):
    start = 0
    result = []
    for value in values:
        result.append({"text": value, "start": start, "end": start + 0.2})
        start += 0.2
    return result


def asr(request_id, *values):
    return {"requestId": request_id, "sentences": [{"words": [
        {"text": value, "begin_time": index * 200, "end_time": (index + 1) * 200}
        for index, value in enumerate(values)
    ]}]}


class BailianAlignmentTest(unittest.TestCase):
    def test_inline_command_hint_is_a_verbatim_source_phrase(self):
        source = "Windows 可用屏幕上的 py 减三写法，再按 Control 加 C。"
        terms = WORKER.hotwords_from_text(source)
        self.assertIn("py 减三", terms)
        self.assertIn("Control 加 C", terms)
        self.assertTrue(all(term in source for term in terms))

    def test_equal_integer_writing_preserves_source_and_word_times(self):
        for source, recognized in [
            ("安装 Python 三", ["安装", "Python", "3"]),
            ("三千端口", ["3000", "端口"]),
            ("3000端口", ["三千", "端口"]),
            ("一万零三十个", ["10030", "个"]),
        ]:
            with self.subTest(source=source):
                original = words(*recognized)
                cues, mapping = WORKER.map_words_to_source(source, original)
                self.assertEqual("".join(c["text"] for c in cues), source)
                self.assertEqual([(c["start"], c["end"]) for c in cues], [(w["start"], w["end"]) for w in original])
                changes = [s for w in mapping for s in w.get("substitutions", [])]
                self.assertEqual(changes[0]["reason"], "integer-writing")
                self.assertEqual(changes[0]["sourceText"], source[changes[0]["sourceStart"]:changes[0]["sourceEnd"]])

    def test_split_integer_words_use_only_the_full_original_word_interval(self):
        original = words("端口", "3", "000", "监听")
        cues, mapping = WORKER.map_words_to_source("端口三千监听", original)
        self.assertEqual([c["text"] for c in cues], ["端口", "三千", "监听"])
        self.assertEqual((cues[1]["start"], cues[1]["end"]), (original[1]["start"], original[2]["end"]))
        self.assertEqual(mapping[1]["asrWordIndexes"], [1, 2])
        self.assertEqual(mapping[1]["substitutions"][0]["integerValue"], 3000)

    def test_integer_and_pronoun_changes_can_share_a_word_without_guessing_times(self):
        original = words("让他用3", "端口")
        cues, mapping = WORKER.map_words_to_source("让它用三端口", original)
        self.assertEqual(cues[0]["text"], "让它用三")
        self.assertEqual(cues[0]["end"], original[0]["end"])
        self.assertEqual({s["reason"] for s in mapping[0]["substitutions"]}, {"homophone-pronoun", "integer-writing"})

    def test_rejects_unequal_ambiguous_and_noninteger_representations(self):
        for source, recognized in [
            ("三端口", "4端口"), ("三千端口", "3001端口"),
            ("三千五端口", "3005端口"), ("三十五", "3.5"),
            ("三", "-3"), ("三", "3%"), ("三千端口", "3000错误端口"),
        ]:
            with self.subTest(source=source, recognized=recognized):
                with self.assertRaises(WORKER.WorkerError):
                    WORKER.map_words_to_source(source, words(recognized))

    def test_rejects_overlapping_word_intervals_for_integer_conversion(self):
        original = words("3", "000", "端口")
        original[1]["start"] = 0.1
        with self.assertRaises(WORKER.WorkerError):
            WORKER.map_words_to_source("三千端口", original)

    def test_maps_only_homophone_pronouns_with_original_timing_and_evidence(self):
        for source_char in "他她它":
            for asr_char in "他她它":
                with self.subTest(source=source_char, asr=asr_char):
                    source = f"让{source_char}看见。"
                    source_words = words(f"让{asr_char}", "看见")
                    cues, mapping = WORKER.map_words_to_source(source, source_words)
                    self.assertEqual("".join(item["text"] for item in cues), source)
                    self.assertEqual(cues[0]["start"], source_words[0]["start"])
                    self.assertEqual(cues[0]["end"], source_words[0]["end"])
                    self.assertEqual(mapping[0]["text"], f"让{asr_char}")
                    expected = [] if source_char == asr_char else [{
                        "sourceStart": 1, "sourceEnd": 2, "asrOffset": 1,
                        "asrText": asr_char, "sourceText": source_char,
                        "reason": "homophone-pronoun",
                    }]
                    self.assertEqual(mapping[0].get("substitutions", []), expected)

    def test_rejects_other_homophones_numbers_and_insertions_or_deletions(self):
        for source, recognized in [
            ("让它看见", "让他看键"), ("它有三个", "他有四个"),
            ("让它看见", "让他看"), ("让它看见", "让他都看见"),
        ]:
            with self.subTest(source=source, recognized=recognized):
                with self.assertRaises(WORKER.WorkerError):
                    WORKER.map_words_to_source(source, words(recognized))

    def test_maps_spoken_code_dot_to_frozen_text(self):
        source = "把 config 点 toml 写入项目。"
        cues, mapping = WORKER.map_words_to_source(source, words("把", "config", "toml", "写入", "项目"))
        self.assertEqual("".join(item["text"] for item in cues), source)
        self.assertEqual(mapping[1]["text"], "config")
        self.assertEqual(WORKER.canonicalization_evidence(source)[0]["text"], "点")

    def test_rejects_unregistered_natural_language_change(self):
        with self.assertRaises(WORKER.WorkerError):
            WORKER.map_words_to_source("允许电脑操作", words("允许", "手机", "操作"))

    def test_retries_asr_without_resynthesizing_audio(self):
        original_copy, original_recognize = WORKER.asr_copy, WORKER.recognize
        try:
            with tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                timing_dir = root / "timing" / "scene-01"
                timing_dir.mkdir(parents=True)
                asr_audio = root / "audio.wav"
                asr_audio.write_bytes(b"placeholder")
                results = iter([
                    asr("first", "允许", "手机", "操作"),
                    asr("second", "允许", "电脑", "操作"),
                ])
                WORKER.asr_copy = lambda *_: asr_audio
                WORKER.recognize = lambda *_: next(results)
                timing = WORKER.aligned_timing(
                    root / "source.wav", timing_dir, "01-01", "允许电脑操作",
                    {"timingProvider": "qwen-audio-3.1-asr-flash"}, [], "tts-request",
                )
                self.assertEqual(timing["selectedAsrAttempt"], 2)
                self.assertEqual(timing["asrAttempts"][0]["status"], "rejected")
                self.assertEqual(timing["asrAttempts"][1]["status"], "mapped")
                self.assertTrue((timing_dir / "01-01.asr-attempt-1.json").is_file())
                self.assertTrue((timing_dir / "01-01.asr-attempt-2.json").is_file())
        finally:
            WORKER.asr_copy, WORKER.recognize = original_copy, original_recognize

    def test_extracts_unique_ascii_terms_as_inline_vocabulary(self):
        tts = {"scenes": [{"segments": [{"text": "Codex 使用 config 点 toml，再打开 Browser。"}]}]}
        self.assertEqual(
            WORKER.hotwords(tts),
            ["Codex", "config", "toml", "Browser"],
        )

    def test_qwen_audio_asr_sends_inline_terms_and_word_timestamps_request(self):
        original_request_bytes = WORKER.request_bytes
        original_api_key = os.environ.get("DASHSCOPE_API_KEY")
        captured = {}
        try:
            with tempfile.TemporaryDirectory() as temporary:
                audio = Path(temporary) / "sample.wav"
                audio.write_bytes(b"wav")

                def request_bytes(url, data=None, headers=None):
                    captured["url"] = url
                    captured["body"] = json.loads(data)
                    captured["headers"] = headers
                    response = {
                        "request_id": "asr-request",
                        "output": {"output": {"sentence": {"words": [{
                            "text": "config", "begin_time": 0, "end_time": 200,
                        }]}}},
                    }
                    return json.dumps(response).encode("utf-8"), "application/json"

                os.environ["DASHSCOPE_API_KEY"] = "test-key"
                WORKER.request_bytes = request_bytes
                result = WORKER.recognize(audio, {"timingProvider": "qwen-audio-3.1-asr-flash"}, ["config", "toml"])
                self.assertEqual(result["requestId"], "asr-request")
                self.assertEqual(captured["body"]["model"], "qwen-audio-3.1-asr-flash")
                self.assertEqual(captured["body"]["parameters"]["vocabulary"], {"config": 50, "toml": 50})
                self.assertEqual(captured["body"]["input"]["messages"][0]["content"][0]["text"], "术语表：config，toml")
                self.assertEqual(captured["headers"]["X-DashScope-SSE"], "disable")
        finally:
            WORKER.request_bytes = original_request_bytes
            if original_api_key is None:
                os.environ.pop("DASHSCOPE_API_KEY", None)
            else:
                os.environ["DASHSCOPE_API_KEY"] = original_api_key


if __name__ == "__main__":
    unittest.main()
