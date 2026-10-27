"""Build a deterministic release asset from the reviewed mod sources."""
from pathlib import Path
import base64
import hashlib
import json
import re
import zipfile

root = Path(__file__).resolve().parents[1]
mod = root / 'mod'
manifest = json.loads((mod / 'mod.json').read_text(encoding='utf-8'))
version = manifest['version']
assert re.fullmatch(r'\d+\.\d+\.\d+', version), 'Use a stable numeric version'
assert manifest['name'] == 'item-repair-hub'
assert manifest['requires']['era'] == 'renewal'
seed = json.loads((mod / f'client/seed-config-v{version}.json').read_text())
assert seed['entries'] == [] and seed['removedIds'] == [] and seed['revision'] == 0
assert seed['worldSyncCompat'] is False
bundle = json.loads((mod / f'client/package-files-v{version}.json').read_text())
for name, encoded in bundle['static'].items():
    assert (mod / name).read_bytes() == base64.b64decode(encoded), f'Stale export template: {name}'
files = sorted(p for p in mod.rglob('*') if p.is_file())
assert len(files) <= 2000 and sum(p.stat().st_size for p in files) <= 96 * 1024 * 1024
assert not any(p.is_symlink() for p in mod.rglob('*'))
assert not any(p.name in {'.source.json', 'disabled.txt'} for p in files)
out = root / 'dist'
out.mkdir(exist_ok=True)
archive = out / f'ItemRepairHub-v{version}.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for p in files:
        info = zipfile.ZipInfo('item-repair-hub/' + p.relative_to(mod).as_posix(), (2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        z.writestr(info, p.read_bytes())
assert archive.stat().st_size <= 50 * 1024 * 1024
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(out / f'SHA256-v{version}.txt').write_text(f'{digest}  {archive.name}\n', encoding='utf-8')
print(f'{archive.name}: {len(files)} files, {archive.stat().st_size} bytes, SHA256 {digest}')
