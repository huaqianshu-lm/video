"""Inspect or extract a ZIP without symlinks, duplicate paths or traversal."""
import hashlib, json, pathlib, stat, sys, zipfile

archive = pathlib.Path(sys.argv[2])
with zipfile.ZipFile(archive) as z:
    names = set()
    for entry in z.infolist():
        name = entry.filename.rstrip('/')
        if (not name or name.startswith('/') or '\\' in name or ':' in name or
                any(p in ('', '.', '..') for p in name.split('/')) or
                stat.S_ISLNK(entry.external_attr >> 16) or name in names):
            raise ValueError('Unsafe or duplicate ZIP entry: ' + entry.filename)
        names.add(name)
    bad = z.testzip()
    if bad: raise ValueError('Corrupt ZIP entry: ' + bad)
    if sys.argv[1] == 'verify':
        source = pathlib.Path(sys.argv[3])
        expected = {p.relative_to(source).as_posix() for p in source.rglob('*') if p.is_file()}
        archived = {e.filename for e in z.infolist() if not e.is_dir()}
        if archived != expected: raise ValueError('ZIP contents differ from input directory')
        for name in expected:
            if hashlib.sha256(z.read(name)).digest() != hashlib.sha256((source / name).read_bytes()).digest():
                raise ValueError('ZIP file differs from input: ' + name)
    elif sys.argv[1] == 'extract':
        target = pathlib.Path(sys.argv[3]).resolve()
        for entry in z.infolist():
            destination = target / entry.filename
            for parent in [destination, *destination.parents]:
                if parent == target: break
                if parent.is_symlink(): raise ValueError('Symlink extraction destination')
        z.extractall(target)
    elif sys.argv[1] != 'inspect':
        raise ValueError('Expected inspect or extract')
    print(json.dumps(sorted(names)))
