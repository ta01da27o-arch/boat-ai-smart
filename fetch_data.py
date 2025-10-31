import json, datetime, random

VENUES = [
    "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
    "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
    "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
]

today = datetime.date.today().strftime("%Y/%m/%d")

data = {"venues": []}
for v in VENUES:
    if random.random() < 0.3:
        status = "active"
        accuracy = random.randint(60, 90)
    else:
        status = "closed"
        accuracy = 0
    venue_data = {"name": v, "status": status, "accuracy": accuracy, "races": []}
    if status == "active":
        for i in range(1, 13):
            race = {
                "no": i,
                "entries": [
                    {
                        "boat": b,
                        "class": random.choice(["A1", "A2", "B1"]),
                        "name": f"選手{b}",
                        "st": f"0.{random.randint(10,19)}",
                        "f": 0,
                        "national": f"{random.uniform(6.0,7.0):.2f}",
                        "local": f"{random.uniform(6.0,7.0):.2f}",
                        "mt": f"3連率{random.randint(60,85)}%",
                        "course": str(b),
                        "eval": random.choice(["◎","○","▲","△","×"])
                    } for b in range(1,7)
                ],
                "ai_main": [{"buy": "1-2-3", "prob": 40}, {"buy": "1-3-2", "prob": 25}],
                "ai_sub": [{"buy": "2-1-3", "prob": 15}],
                "comments": [{"course": b, "text": f"{b}コース 普通"} for b in range(1,7)],
                "ranking": [{"rank": b, "boat": b, "name": f"選手{b}", "score": round(random.uniform(5.0,9.5),1)} for b in range(1,7)]
            }
            venue_data["races"].append(race)
    data["venues"].append(venue_data)

with open("data/data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# ダミーhistory.json生成
history = {"results": []}
for v in VENUES:
    history["results"].append({
        "venue": v,
        "no": 1,
        "entries": [
            {"rank": 1, "boat": 1, "name": "選手1", "st": "0.14"},
            {"rank": 2, "boat": 2, "name": "選手2", "st": "0.16"},
            {"rank": 3, "boat": 3, "name": "選手3", "st": "0.17"},
        ]
    })
with open("data/history.json", "w", encoding="utf-8") as f:
    json.dump(history, f, ensure_ascii=False, indent=2)