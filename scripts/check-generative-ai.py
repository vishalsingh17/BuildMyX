"""Validate the ordered course, published links and executable teaching material."""
from pathlib import Path
from html.parser import HTMLParser
from tempfile import TemporaryDirectory
from zipfile import ZipFile
import argparse
import importlib.util
import json
import os
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "learning/content/generative-ai"
FENCES = re.compile(r'^```python[^\n]*\n(.*?)^```[ \t]*$', re.M | re.S)

class Document(HTMLParser):
    def __init__(self, value):
        super().__init__(); self.ids=set(); self.feed(value)
    def handle_starttag(self, tag, attrs):
        identifier=dict(attrs).get("id")
        if identifier:self.ids.add(identifier)

def bundle_files():
    spec=importlib.util.spec_from_file_location("package_genai",ROOT/"scripts/package-generative-ai.py")
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    expected=module.project_files()
    with ZipFile(CONTENT/"assets/generative-ai-labs.zip") as archive:
        if sorted(archive.namelist()) != sorted(expected):raise ValueError("Generative AI lab bundle file list is stale.")
        for name,contents in expected.items():
            if archive.read(name).decode()!=contents:raise ValueError(f"Stale lab download: {name}; run scripts/package-generative-ai.py")
    return expected

def check(rendered=False):
    if sys.version_info<(3,12):raise ValueError("Generative AI checks require Python 3.12+.")
    manifest=json.loads((ROOT/"learning/generative-ai-curriculum.json").read_text())
    chapters=manifest["chapters"];sources=manifest["sources"]
    if len(chapters)!=32 or [c["order"] for c in chapters]!=list(range(1,33)):raise ValueError("Expected a contiguous 32-chapter sequence.")
    if len({c["slug"] for c in chapters})!=32:raise ValueError("Duplicate course chapter.")
    if len(sources)!=16 or len({s["url"] for s in sources})!=16:raise ValueError("Every unique supplied primer must appear exactly once.")
    source_ids={s["id"] for s in sources}
    if {s for c in chapters for s in c["sources"]}!=source_ids:raise ValueError("The chapter sequence omits a source subject.")
    for i,chapter in enumerate(chapters):
        if chapter["prerequisites"] != ([] if i==0 else [chapters[i-1]["slug"]]):raise ValueError("The prerequisite chain must stay sequential.")
    for source in sources:
        if not re.fullmatch(r'[a-f0-9]{64}',source["html_sha256"]):raise ValueError("Missing source snapshot fingerprint.")
    for source in sources:
        if source["url"] not in (CONTENT/"sources.md").read_text():raise ValueError("A supplied source is absent from the public guide.")
    bundle=bundle_files()
    if not rendered:
        import markdown
    glossary_count=len(re.findall(r"^## ", (CONTENT/"glossary.md").read_text(), re.M))
    if glossary_count<60:raise ValueError("The beginner glossary lost its core coverage.")
    blocks=0
    for chapter in chapters:
        filename=CONTENT/f'{chapter["slug"]}.md';text=filename.read_text()
        if f'lesson: CHAPTER {chapter["order"]:02d} OF 32' not in text:raise ValueError(f"Incorrect chapter label: {filename.name}")
        for required in ('**After this chapter:**','**Before you start:**','??? question "Check your reasoning"','{#practice}','{#continue}'):
            if required not in text:raise ValueError(f"Missing teaching component in {filename.name}: {required}")
        for source_id in chapter["sources"]:
            if f'https://aman.ai/primers/{source_id}/' not in text:raise ValueError(f"Missing attribution in {filename.name}")
        continued=text.split("## Continue in order",1)[-1]
        expected_next=(chapters[chapter["order"]]["slug"]+".md") if chapter["order"]<32 else "sources.md"
        if expected_next not in continued:raise ValueError(f"Broken next-chapter sequence in {filename.name}")
        code=FENCES.findall(text)
        if not code:raise ValueError(f"Missing worked code in {filename.name}")
        blocks+=len(code)
        for number,block in enumerate(code,1):compile(block,f'{filename.name}:block-{number}','exec')
        if rendered:
            document=Document((ROOT/'public/learn/generative-ai'/chapter['slug']/'index.html').read_text())
        else:
            document=Document(markdown.markdown(text,extensions=['toc','attr_list','pymdownx.superfences']))
        for anchor in ('practice','self-check','continue'):
            if anchor not in document.ids:raise ValueError(f"Missing {'rendered' if rendered else 'source'} anchor: {chapter['slug']}#{anchor}")
        if not rendered:
            with TemporaryDirectory(prefix='buildmyx-genai-') as directory:
                path=Path(directory)/'practice.py';path.write_text('\n\n'.join(code))
                result=subprocess.run([sys.executable,'-I',str(path)],cwd=directory,env={'PATH':os.defpath,'LANG':'C.UTF-8','LC_ALL':'C.UTF-8','PYTHONHASHSEED':'0'},capture_output=True,text=True,timeout=15)
                if result.returncode:raise ValueError(f"Generative AI lab failed in {filename.name}:\n{result.stderr[-4000:]}")
    for source in CONTENT.glob('*.md'):
        if rendered:
            path=ROOT/'public/learn/generative-ai'/('index.html' if source.stem=='index' else f'{source.stem}/index.html')
            document=Document(path.read_text())
        else:document=Document(markdown.markdown(source.read_text(),extensions=['toc','attr_list','pymdownx.superfences']))
        for target in re.findall(r'\]\(([^)\s]+\.md(?:#[^)\s]+)?)\)',source.read_text()):
            filename,_,anchor=target.partition('#')
            destination=(source.parent/filename).resolve()
            if not destination.is_relative_to(ROOT/'learning/content') or not destination.exists():raise ValueError(f"Broken lesson link: {source.name}: {target}")
            if anchor:
                if rendered:
                    relative=destination.relative_to(ROOT/'learning/content')
                    html_path=ROOT/'public/learn'/relative.parent/('index.html' if relative.stem=='index' else f'{relative.stem}/index.html')
                    target_doc=Document(html_path.read_text())
                else:target_doc=Document(markdown.markdown(destination.read_text(),extensions=['toc','attr_list','pymdownx.superfences']))
                if anchor not in target_doc.ids:raise ValueError(f"Broken lesson anchor: {source.name}: {target}")
    for asset in ('generative-ai-labs.zip','learning-route.svg','attention-weights.svg'):
        file=CONTENT/'assets'/asset
        if not file.exists():raise ValueError(f"Missing course asset: {asset}")
        if rendered and (ROOT/'public/learn/generative-ai/assets'/asset).read_bytes()!=file.read_bytes():raise ValueError(f"Published asset differs from validated source: {asset}")
    if not rendered:
        with TemporaryDirectory(prefix='buildmyx-genai-capstone-') as directory:
            for name in ('capstone_assistant.py','test_capstone.py'):(Path(directory)/name).write_text(bundle[name])
            command='import sys;sys.path.insert(0,".");import unittest;result=unittest.TextTestRunner().run(unittest.defaultTestLoader.discover(".",pattern="test_capstone.py"));sys.exit(not result.wasSuccessful())'
            result=subprocess.run([sys.executable,'-I','-c',command],cwd=directory,env={'PATH':os.defpath,'LANG':'C.UTF-8','LC_ALL':'C.UTF-8'},capture_output=True,text=True,timeout=15)
            if result.returncode:raise ValueError(f"Capstone tests failed:\n{result.stderr[-4000:]}")
    print(f"Generative AI {'HTML' if rendered else 'content'}: 32 sequential chapters, 16 unique sources, {blocks} Python blocks, {glossary_count} glossary terms and matching lab assets; {'anchors and links passed' if rendered else 'all chapter programs and 7 capstone tests passed'}.")

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--html',action='store_true');args=parser.parse_args()
    try:check(args.html)
    except (ValueError,OSError,SyntaxError,subprocess.TimeoutExpired) as error:
        print(f"Generative AI validation failed: {error}",file=sys.stderr);sys.exit(1)
