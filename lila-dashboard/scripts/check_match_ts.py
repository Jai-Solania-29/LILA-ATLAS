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

print("Num events:", len(df))
print("First TS:", df['ts'].iloc[0])
print("Last TS:", df['ts'].iloc[-1])
print("First ts.timestamp():", df['ts'].iloc[0].timestamp())
print("Last ts.timestamp():", df['ts'].iloc[-1].timestamp())
print("Difference in ms:", (df['ts'].iloc[-1].timestamp() - df['ts'].iloc[0].timestamp()) * 1000)

for i in range(min(5, len(df))):
    print("Top 5 events:", df['ts'].iloc[i], df['event'].iloc[i])
for i in range(1, min(6, len(df))):
    print("Bot 5 events:", df['ts'].iloc[-i], df['event'].iloc[-i])
