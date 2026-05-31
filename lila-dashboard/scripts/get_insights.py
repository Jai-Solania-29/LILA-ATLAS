import json
import math

with open('public/data/matches_meta.json') as f:
    matches = json.load(f)

# Maps popularity
maps = {}
for m in matches:
    maps[m['map']] = maps.get(m['map'], 0) + 1
print("Map Popularity:", maps)

# Avg match duration
durations = {m: [] for m in maps}
humans = {m: [] for m in maps}
bots = {m: [] for m in maps}
for m in matches:
    durations[m['map']].append(m['duration'])
    humans[m['map']].append(m['humans'])
    bots[m['map']].append(m['bots'])
    
for m, d in durations.items():
    print(f"{m} avg duration: {sum(d)/len(d)/60000:.2f} mins, humans: {sum(humans[m])/len(humans[m]):.1f}, bots: {sum(bots[m])/len(bots[m]):.1f}")

# Let's check heatmaps
for m in maps:
    with open(f'public/data/heatmaps/{m}.json') as f:
        hm = json.load(f)
        print(f"\n{m} Stats:")
        print("  Kills:", len(hm['Kill']))
        print("  Storm Deaths:", len(hm['StormDeath']))
        print("  Loot:", len(hm['Loot']))
