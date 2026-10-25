---
title: haus-md
tagline: a DuckDB pipeline that mines IMDb's full dump for House, M.D.
stack: [Python, DuckDB, Parquet]
year: 2026
repo: https://github.com/leNITHISH/haus-md
rank: 5
accent: '#0c9381'
---

A data pipeline that pulls every *House, M.D.* episode, rating, director and writer out of IMDb's public dataset dump, builds a local DuckDB warehouse, validates it, runs a set of analyses and plots the result. I built it to learn DuckDB, pipeline structure and data-quality checks.

```
download -> ingest -> transform -> validate -> analyze -> visualize / export
```

Everything runs through [`pipeline.py`](https://github.com/leNITHISH/haus-md/blob/main/pipeline.py). Every stage is idempotent: tables use `CREATE TABLE IF NOT EXISTS`, and the download step skips files that already exist, so rerunning the whole thing is cheap. From a clean clone, `make run` fetches the five raw files itself (about 685 MB).

The transform is a five-way join across separate IMDb files. Each episode's comma-separated director and writer lists are split into rows with `UNNEST`, and the 15 million rows of `name.basics` are filtered down to the roughly 80 people who worked on the show before joining.

## Data quality

Hard checks stop the pipeline: ratings outside 1 to 10, duplicate episode IDs, non-positive vote counts, an empty table, or a director or writer with no matching name row (which would otherwise drop that person from the rankings without any error).

Softer checks only warn. One flags episodes with suspiciously few votes compared to the rest of the series, and it caught the series finale: 239 votes when every other episode has 2,700 to 9,000+, and an ID much higher than the rest. That usually means an entry added long after the fact, probably a duplicate splitting votes from the original. The pipeline flags it on every run instead of guessing at a fix.

## Findings

- A first pass said late-season episodes rate higher, 8.52 vs 8.27. But the cutoff (episode number above 15) split the episodes 120 to 57, because seasons differ in length. Splitting at each season's own midpoint with a window function gave 87 vs 90 episodes, and the gap mostly went away: 8.40 vs 8.29.
- Season 4 is the highest rated, at 8.56.
- Finales average 9.04 across the eight seasons. Premieres average 8.64.
- Votes and rating correlate (r ≈ 0.67), but average votes per season fell from about 5,800 to 3,300 while ratings stayed roughly flat over the run (r ≈ -0.08).
- Greg Yaitanes directed 30 episodes, more than twice anyone else. David Shore is a credited writer on 176 of the 177.

Tests run the transform and validation logic against small in-memory fixtures, and CI runs them on every push. The final tables are also exported to Parquet. DuckDB notes I collected along the way are in [notes/duck.md](https://github.com/leNITHISH/haus-md/blob/main/notes/duck.md).
