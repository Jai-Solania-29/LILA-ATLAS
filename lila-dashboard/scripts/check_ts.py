import pyarrow.parquet as pq
table = pq.read_table("../player_data/February_10/f4e072fa-b7af-4761-b567-1d95b7ad0108_b71aaad8-aa62-4b3a-8534-927d4de18f22.nakama-0")
df = table.to_pandas()
print(df['ts'].head())
print("First TS:", df['ts'].iloc[0], "Last TS:", df['ts'].iloc[-1])
print("Type:", type(df['ts'].iloc[0]))
