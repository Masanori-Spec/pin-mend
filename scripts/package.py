"""Positive publication allowlist: own source/docs/factual data only."""
from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parents[1]
out=root.parent/'pin-mend-output';out.mkdir(exist_ok=True)
FILES='''
.gitignore
.github/workflows/verify.yml
README.md
package.json
package-lock.json
dist/index.html
src/profile.mjs
src/solver.mjs
src/export.mjs
src/zip.mjs
web/index.html
web/styles.css
web/app.mjs
web/i18n.mjs
scripts/build.mjs
scripts/serve.mjs
scripts/solve-json.mjs
scripts/export-example.mjs
scripts/native-verify.mjs
scripts/setup-arduino.sh
scripts/read-bundle.py
scripts/package.py
tests/solver.test.mjs
tests/browser-test.mjs
oracle/test_independent.py
docs/dependencies.md
docs/sources.md
docs/verification.md
docs/product-scope.md
evidence/independent-oracle.json
evidence/native-verification.json
evidence/browser-verification.json
evidence/hosted-verification.json
generated/PinMendDemo/pins.h
generated/PinMendDemo/PinMendDemo.ino
generated/PinMendDemo/wiring-changes.json
generated/PinMendDemo/pinmend-project.json
'''.strip().splitlines()
allowed={'.mjs','.json','.md','.html','.css','.py','.sh','.yml','.h','.ino'}
manifest=[]
for rel in sorted(FILES):
    p=root/rel
    assert p.is_file() and not p.is_symlink(),f'Missing or symlink: {rel}'
    assert p.suffix in allowed or rel=='.gitignore',f'Forbidden type: {rel}'
    raw=p.read_bytes();raw.decode('utf-8')
    assert len(raw)<2_000_000 and b'\0' not in raw,f'Unexpected binary/size: {rel}'
    assert not any(x in p.parts for x in ['node_modules','.toolchain','test-results','__pycache__']),rel
    manifest.append(dict(path=rel,bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest()))
archive=out/'pin-mend-source.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
    for item in manifest:
        info=zipfile.ZipInfo(item['path'],date_time=(2026,10,5,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
        z.writestr(info,(root/item['path']).read_bytes())
report=dict(project='PinMend',version='0.1.0',fileCount=len(manifest),distribution='Positive allowlist: original source, factual profile, original generated demo, docs and numerical summaries only. No third-party implementations, SDKs, firmware, raw traces, caches or response bodies.',files=manifest,archive=dict(name=archive.name,bytes=archive.stat().st_size,sha256=hashlib.sha256(archive.read_bytes()).hexdigest()))
(out/'pin-mend-source-manifest.json').write_text(json.dumps(report,indent=2)+'\n')
(out/'pin-mend.html').write_bytes((root/'dist/index.html').read_bytes())
print(json.dumps(dict(fileCount=len(manifest),archive=str(archive),sha256=report['archive']['sha256']),indent=2))
