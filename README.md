# LILA Atlas - Player Journey Visualization Tool

A web-based dashboard for the Level Design team to visualize and analyze player journeys, map hotspots, and combat events in LILA Atlas.

## Tech Stack
- **Frontend**: Vite, React, TypeScript, HTML5 Canvas
- **Data Pipeline**: Python, Pandas, PyArrow

## Prerequisites
- Node.js (v18+)
- Python (3.9+)

## Setup Instructions

### 1. Run the Data Pipeline (Optional, pre-processed data is included)
The raw parquet files in `player_data/` must be processed into lightweight JSONs for the web app to consume.
1. Navigate to the project directory: `cd lila-dashboard`
2. Create a virtual environment: `python3 -m venv venv`
3. Activate it: `source venv/bin/activate` (Mac/Linux) or `venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install pandas pyarrow`
5. Run the pipeline: `python scripts/process_data.py`

*Note: This will output JSON files into `public/data/`.*

### 2. Run the Web Dashboard
1. Install node modules: `npm install`
2. Start the development server: `npm run dev`
3. Open your browser and navigate to `http://localhost:5173/`

### 3. Production Build
To create a production-ready bundle:
`npm run build`
The built files will be located in the `dist/` directory, which can be deployed to any static host (Vercel, Netlify, Surge, GitHub Pages).

## Features
- **Timeline Playback**: Watch the match unfold over time with a draggable slider and playback controls.
- **Heatmaps**: Aggregate view of Player Traffic, Kill Zones, Death Zones, and Loot Density across all matches on a given map.
- **Filters**: Toggle visibility for Humans, Bots, Kills, Deaths, Loot, and Storm events.
- **High Performance**: Built with an HTML5 `<canvas>` rendering engine capable of smoothly animating thousands of data points at 60fps.

## Architecture & Insights
For detailed information regarding the design decisions, coordinate math, and data flow, please read [ARCHITECTURE.md](./ARCHITECTURE.md).
For actionable insights derived from the dataset for the Level Design team, please read [INSIGHTS.md](./INSIGHTS.md).
