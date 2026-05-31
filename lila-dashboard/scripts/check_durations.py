import json

with open('public/data/matches_meta.json') as f:
    matches = json.load(f)

for m in sorted(matches, key=lambda x: x['duration'], reverse=True)[:10]:
    print(f"Match: {m['id']} Duration: {m['duration']/1000} seconds, Events: {m['events_count']}, Humans: {m['humans']}, Bots: {m['bots']}")
