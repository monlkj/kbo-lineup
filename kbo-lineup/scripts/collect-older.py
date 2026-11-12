# Generated-data maintenance: see scripts/README.md.
from pathlib import Path
import os
PROJECT=Path(__file__).resolve().parents[1]
WORK=Path(os.environ.get('KBO_WORK_DIR',str(PROJECT/'.data-work')))
WORK.mkdir(parents=True,exist_ok=True)
import runpy,concurrent.futures
m=runpy.run_path(str(PROJECT/'scripts/collect-kbo.py'))
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:list(ex.map(lambda y:m['collect']('hit',y),range(1982,2001)))
