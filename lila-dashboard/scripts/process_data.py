import os
import json
import pandas as pd
import pyarrow.parquet as pq
import uuid

DATA_DIR = "../player_data"
OUTPUT_DIR = "public/data"

def is_human(user_id):
    try:
        uuid.UUID(str(user_id))
        return True
    except ValueError:
        return False

def process_data():
    os.makedirs(f"{OUTPUT_DIR}/matches", exist_ok=True)
    os.makedirs(f"{OUTPUT_DIR}/heatmaps", exist_ok=True)

    matches_meta = []
    
    # Map map_id to list of events for heatmaps
    # event_type -> list of [x, z]
    heatmaps = {
        "AmbroseValley": {"Kill": [], "Death": [], "Loot": [], "Traffic": [], "StormDeath": []},
        "GrandRift": {"Kill": [], "Death": [], "Loot": [], "Traffic": [], "StormDeath": []},
        "Lockdown": {"Kill": [], "Death": [], "Loot": [], "Traffic": [], "StormDeath": []}
    }

    # Iterate through days
    for day_folder in sorted(os.listdir(DATA_DIR)):
        if not day_folder.startswith("February_"): continue
        day_path = os.path.join(DATA_DIR, day_folder)
        date_str = day_folder.replace("_", " ")

        print(f"Processing {day_folder}...")
        
        # We need to group files by match_id
        # A match is formed by files sharing the same match_id
        match_files = {} # match_id -> list of file paths
        
        for f in os.listdir(day_path):
            if ".nakama-0" not in f: continue
            filepath = os.path.join(day_path, f)
            try:
                table = pq.read_table(filepath)
                df = table.to_pandas()
                if len(df) == 0: continue
                
                # Assume all rows in a file have the same match_id and map_id
                match_id = df['match_id'].iloc[0]
                
                if match_id not in match_files:
                    match_files[match_id] = []
                match_files[match_id].append(df)
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
                continue
                
        for match_id, dfs in match_files.items():
            match_df = pd.concat(dfs, ignore_index=True)
            
            # Decode events
            match_df['event'] = match_df['event'].apply(lambda x: x.decode('utf-8') if isinstance(x, bytes) else x)
            
            # Sort by ts
            match_df = match_df.sort_values(by='ts')
            
            map_id = match_df['map_id'].iloc[0]
            
            players = {} # map user_id to short_id
            player_info = {} # short_id -> {id, isBot}
            
            events = []
            
            humans_count = 0
            bots_count = 0
            
            for _, row in match_df.iterrows():
                uid = str(row['user_id'])
                if uid not in players:
                    short_id = len(players)
                    players[uid] = short_id
                    human = is_human(uid)
                    player_info[short_id] = {"id": uid, "isBot": not human}
                    if human: humans_count += 1
                    else: bots_count += 1
                    
                short_id = players[uid]
                evt = row['event']
                # Store relative ms, short_id, event, x, z
                # We can drop y for 2d minimap visualization
                # We round x and z to 1 decimal place to save space
                x = round(row['x'], 1)
                z = round(row['z'], 1)
                
                events.append([
                    int(row['ts'].timestamp() * 1000) if isinstance(row['ts'], pd.Timestamp) else int(row['ts']), 
                    short_id, 
                    evt, 
                    x, 
                    z
                ])
                
                # Add to heatmaps
                if map_id in heatmaps:
                    # Map events to heatmap categories
                    if evt in ['Position', 'BotPosition']:
                        # Subsample traffic to reduce size? Actually 89k is fine.
                        heatmaps[map_id]["Traffic"].append([x, z])
                    elif evt in ['Kill', 'BotKill']:
                        heatmaps[map_id]["Kill"].append([x, z])
                    elif evt in ['Killed', 'BotKilled']:
                        heatmaps[map_id]["Death"].append([x, z])
                    elif evt == 'Loot':
                        heatmaps[map_id]["Loot"].append([x, z])
                    elif evt == 'KilledByStorm':
                        heatmaps[map_id]["StormDeath"].append([x, z])

            if len(events) > 0:
                # Normalize timestamps to start at 0
                start_time = events[0][0]
                for i in range(len(events)):
                    events[i][0] -= start_time
                    
                duration = events[-1][0]
                
                # Write match file
                match_data = {
                    "match_id": match_id,
                    "map_id": map_id,
                    "date": date_str,
                    "players": player_info,
                    "events": events
                }
                
                with open(f"{OUTPUT_DIR}/matches/{match_id}.json", "w") as out_f:
                    json.dump(match_data, out_f, separators=(',', ':'))
                    
                matches_meta.append({
                    "id": match_id,
                    "map": map_id,
                    "date": date_str,
                    "duration": duration,
                    "humans": humans_count,
                    "bots": bots_count,
                    "events_count": len(events)
                })

    # Write matches meta
    with open(f"{OUTPUT_DIR}/matches_meta.json", "w") as out_f:
        json.dump(matches_meta, out_f, indent=2)
        
    # Write heatmaps
    for m_id, hdata in heatmaps.items():
        with open(f"{OUTPUT_DIR}/heatmaps/{m_id}.json", "w") as out_f:
            json.dump(hdata, out_f, separators=(',', ':'))
            
    print("Data processing complete!")

if __name__ == "__main__":
    process_data()
