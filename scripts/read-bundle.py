"""Validate and read own four-file ZIP, without extraction or third-party material."""
import sys,zipfile,json
wanted={'PinMendDemo/'+x for x in ['pins.h','PinMendDemo.ino','wiring-changes.json','pinmend-project.json']}
with zipfile.ZipFile(sys.argv[1]) as z:
    assert len(z.infolist())==4 and set(z.namelist())==wanted,'Unexpected bundle entries'
    assert all(f.file_size<65536 and not f.flag_bits&1 for f in z.infolist()),'Invalid file size/flags'
    result={n.split('/')[1]:z.read(n).decode('utf-8') for n in sorted(z.namelist())}
print(json.dumps(result,ensure_ascii=False))
