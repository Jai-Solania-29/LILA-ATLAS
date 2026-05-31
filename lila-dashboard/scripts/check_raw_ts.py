import pyarrow.parquet as pq
table = pq.read_table("../player_data/February_10/f4e072fa-b7af-4761-b567-1d95b7ad0108_b71aaad8-aa62-4b3a-8534-927d4de18f22.nakama-0")
print("PyArrow schema:")
print(table.schema)
print("First ts raw:", table.column('ts')[0])
print("Last ts raw:", table.column('ts')[-1])
