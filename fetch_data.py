import json
import requests
from datetime import datetime

# デモ用データ（将来は公式APIスクレイピングに変更）
venues = [
    {"name": "戸田", "status": "open", "status_label": "開催中", "accuracy": 38},
    {"name": "平和島", "status": "open", "status_label": "開催中", "accuracy": 30},
    {"name": "浜名湖", "status": "close", "status_label": "終了", "accuracy": 42},
]

# ダミーレースデータ
for v in venues:
    v["races"] = {
        "1": {
            "entries": [
                {"no": 1, "class": "A1", "name": "田中太郎", "st": ".14", "f": "", "z": "6.67", "t": "1.48", "mt": "3.23", "course": "1", "eval": "◎"},
                {"no": 2, "class": "A2", "name": "鈴木一郎", "st": ".18", "f": "", "z": "6.43", "t": "1.50", "mt": "3.26", "course": "2", "eval": "◯"}
            ],
            "prediction": {
                "main": [{"buy": "1-2-3", "rate": 42}, {"buy": "1-3-2", "rate": 35}],
                "sub": [{"buy": "2-1-3", "rate": 20}]
            },
            "comments": ["1号艇の逃げが本命", "風の影響がやや強い"],
            "ranking": [{"no": 1, "name": "田中太郎", "score": 90}, {"no": 2, "name": "鈴木一郎", "score": 85}],
            "results": [{"rank": 1, "no": 1, "name": "田中太郎", "st": ".14"}]
        }
    }

data = {"venues": venues}

with open("data/data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"✅ データ更新完了 {datetime.now()}")
