# KBO data maintenance

Run from this app directory. Python 3.10+ and the dependencies in `requirements.txt` are required. All network requests use public KBO pages and public KBO/NAVER Sports portrait URLs. No credentials are required.

```sh
python -m venv .data-work/venv
.data-work/venv/bin/pip install -r scripts/requirements.txt
.data-work/venv/bin/python scripts/collect-kbo.py
.data-work/venv/bin/python scripts/collect-older.py
.data-work/venv/bin/python scripts/collect-running.py
.data-work/venv/bin/python scripts/collect-portraits.py
.data-work/venv/bin/python scripts/recover-photos.py
.data-work/venv/bin/python scripts/recover-more.py
.data-work/venv/bin/python scripts/naver-portraits.py
.data-work/venv/bin/python scripts/build-catalog.py
```

Default cache: `.data-work/kbo-source`. Set `KBO_WORK_DIR` to choose another workspace. Source responses are cached so collection can resume without restarting. Run portrait phases sequentially to keep their metadata consistent. The builder fails if fewer than 2,000 distinct KBO player IDs have distinct verified portraits.

Identity is keyed by KBO player ID, not name. Exact positions come from each season's defense rows. Pre-2001 cards are included only when their exact position can be established by the official Golden Glove table (outfield awards alone do not establish LF/CF/RF). Pitchers are verified from pitching records. Primary fielding position is the one with the most innings in that season; listed secondary positions also have recorded defensive appearances.

Golden Glove and MVP awards are matched by name and season only when that combination identifies exactly one player ID. All-Star coverage currently uses the official Best selections for 2018, 2019 and 2022–2025, not vote candidates. A missing award tag means the collected sources have not established that award; it does not assert the player never won it.

Portrait lookup checks the KBO profile URL, archived KBO image-year directories, then NAVER Sports' KBO-ID portrait archive. Missing files and repeated placeholder hashes are excluded. Photos can depict a different season or uniform. `data/portrait-provenance.json` records original URLs and SHA-256 hashes.

`data/catalog-meta.json` records the actual counts and scope. Season cards are deduplicated by player ID and year. The catalog retains award seasons and up to two representative non-award seasons; it does not duplicate cards to inflate the unique-person count.

`data/scout-materials.json` keeps the verified 2023 Hangzhou final national roster and sourced 2023 coach affiliations. The builder retains the usual award/best-season catalog in `catalog.json` and writes the additional national-roster season records to `national-cards.json`; the app and catalog validation combine both. `catalog-meta.json.cards` counts the combined catalog. National-card acquisition uses a separate card-type flag and does not invent award tags. Coach materials are inventory items and are not counted toward the 2,000-player requirement.
