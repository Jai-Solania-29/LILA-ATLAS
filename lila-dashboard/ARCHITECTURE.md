# ARCHITECTURE.md

## Tech Stack & Rationale
**Frontend**: React (with Vite) + TypeScript + Vanilla CSS.
**Data Pipeline**: Python (Pandas, PyArrow).
**Why?**: 
- *Vite + React* was chosen for its blazingly fast development cycle, excellent TypeScript support, and component-based architecture which makes managing complex UI states (like filters and playback controls) extremely clean.
- *Vanilla CSS* provides complete control over modern UI aesthetics without the overhead of heavy styling frameworks, allowing for performant transitions and custom scrollbars.
- *Python* was used as an offline pre-processing pipeline rather than doing Parquet parsing in the browser. 89,000 events across 1,243 files is manageable, but loading hundreds of small files in the browser creates immense network overhead and latency. Pre-processing it into optimized JSON guarantees an instant, snappy experience for the Level Designers.

## Data Flow
1. **Raw Parquet Files**: The raw dataset sits in `player_data/`.
2. **Preprocessing Pipeline (`scripts/process_data.py`)**: 
   - Scans and reads the `.nakama-0` files using PyArrow and Pandas.
   - Decodes byte strings and groups isolated player files into complete "Match" objects by matching their `match_id`.
   - Normalizes the `ts` values into milliseconds relative to the match's first event.
   - Exports the structured data into lightweight, per-match JSON files and aggregated map-wide heatmap JSONs.
3. **Frontend Application**:
   - Fetches the lightweight `matches_meta.json` on load.
   - When a match or map is selected, it lazily fetches only the JSON required for that specific view.
   - State (filters, playback time) flows down to the `MapViewer` component.

## Coordinate Mapping Approach
Mapping the 3D world coordinates `(x, y, z)` to the 2D minimap image required orthographic projection logic. Since `y` represents elevation, it was ignored for the 2D top-down view.

For each map, the `origin_x`, `origin_z`, and `scale` values from the dataset were used to normalize the coordinates into a standard `(u, v)` space between 0 and 1:
```javascript
const u = (x - originX) / scale;
const v = (z - originZ) / scale;
```
Since the minimap images are standard 1024x1024 textures, the UV coordinates were mapped to pixel space. A critical step was flipping the `y` axis, as 3D game engines typically have `Z` increasing upwards or forwards, whereas standard 2D image coordinates (like HTML5 Canvas) have `Y` originating from the top-left and increasing downwards:
```javascript
const pixelX = u * 1024;
const pixelY = (1 - v) * 1024;
```
This pixel math is done dynamically in the frontend's helper functions, meaning if the canvas is scaled down by CSS, the relative positioning remains perfectly accurate.

## Assumptions & Ambiguities Handled
- **Timestamp Values**: The `ts` column in the Parquet files was parsed by PyArrow as `timestamp[ms]`. However, inspecting the raw integer values (e.g., `1770741077`) revealed they likely represented seconds/milliseconds from the epoch rather than a pure match duration integer. Furthermore, matches spanned extremely short actual durations (less than a second in many cases). I assumed this was due to the data being highly downsampled or a test snapshot of production. I handled this by treating `ts` mathematically to find the relative milliseconds from the start of each match for smooth timeline playback.
- **Heatmap Generation**: I assumed Level Designers would prefer aggregated heatmaps across *all* matches for a given map to identify overall trends, rather than single-match heatmaps. I structured the data pipeline to aggregate events per map.

## Major Trade-offs

| Trade-off | Considered | Decided | Rationale |
|-----------|------------|---------|-----------|
| **Data Processing** | 1. Parse Parquet in Browser using DuckDB-Wasm.<br>2. Pre-process using Python offline. | **Pre-process with Python** | Client-side parsing would require 1,243 individual network requests, causing massive UI blocking. Pre-processing gives the Level Designer an instant dashboard. |
| **Rendering Strategy** | 1. SVG nodes for every player path and event.<br>2. HTML5 `<canvas>`. | **HTML5 `<canvas>`** | SVGs become incredibly laggy when rendering thousands of DOM nodes. Canvas can paint 10,000+ points at 60fps effortlessly, crucial for smooth timeline scrubbing. |
| **Real-time Playback** | 1. 1:1 real-time playback.<br>2. Scaled playback speed. | **Scaled Playback** | A 1:1 playback would take several minutes per match. I implemented a scaled speed (60x) and a scrubber, allowing designers to jump instantly to interesting combat phases. |
