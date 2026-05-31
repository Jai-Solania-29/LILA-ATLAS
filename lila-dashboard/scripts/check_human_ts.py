import pyarrow.parquet as pq
import os
import pandas as pd

day_path = "../player_data/February_10"
dfs = []
for f in os.listdir(day_path):
    if "d7e50fad-fb7a-4ed4-932f-e4ca9ff0c97b" in f:
        dfs.append(pq.read_table(os.path.join(day_path, f)).to_pandas())

df = pd.concat(dfs)
df = df.sort_values(by='ts')

human_df = df[df['event'] == b'Position']
print("Human events:", len(human_df))
print("First human TS:", human_df['ts'].iloc[0].timestamp())
print("Last human TS:", human_df['ts'].iloc[-1].timestamp())
print("Human duration ms:", (human_df['ts'].iloc[-1].timestamp() - human_df['ts'].iloc[0].timestamp()) * 1000)
