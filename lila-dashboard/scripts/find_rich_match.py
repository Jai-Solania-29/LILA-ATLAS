import json

with open('public/data/matches_meta.json') as f:
    matches = json.load(f)

for m in matches:
    if m['humans'] > 0 and m['bots'] > 0:
        # check events
        with open(f"public/data/matches/{m['id']}.json") as mf:
            data = json.load(mf)
            
            event_types = set()
            for evt in data['events']:
                event_types.add(evt[2])
                
            # we want Kill, Death/Killed, Loot, etc.
            has_kill = 'Kill' in event_types or 'BotKill' in event_types
            has_death = 'Killed' in event_types or 'BotKilled' in event_types
            has_loot = 'Loot' in event_types
            has_storm = 'KilledByStorm' in event_types
            
            if has_kill and has_death and has_loot:
                print(f"Rich match found! ID: {m['id']} Map: {m['map']} Events: {event_types}")
                if has_storm:
                    print(f"WOW! Has storm death too! ID: {m['id']}")
                    break
