import json
import sys
from pathlib import Path

from services.local_registry_service import get_pandas, load_registry_files, normalize_text


columns_to_keep = {"denumire", "denumire furnizor", "cui cif", "cui furnizor"}
registries = {}
for source, frame in load_registry_files().items():
    columns = [column for column in frame.columns if normalize_text(column) in columns_to_keep]
    compact = frame[columns].astype(object)
    compact = compact.where(get_pandas().notna(compact), None)
    registries[source] = compact.to_dict(orient="records")

Path(sys.argv[1]).write_text(json.dumps(registries, ensure_ascii=False), encoding="utf-8")
print(f"Prepared {sum(len(rows) for rows in registries.values())} registry entries.")
