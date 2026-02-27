-- Canadian City Prosperity Dashboard
-- D1 (SQLite) Schema — Migration 0001

CREATE TABLE IF NOT EXISTS cmas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  province TEXT NOT NULL,
  province_abbr TEXT NOT NULL,
  population_latest INTEGER,
  centroid_lat REAL,
  centroid_lng REAL,
  cma_boundary_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS metrics (
  id TEXT PRIMARY KEY,
  dimension TEXT NOT NULL CHECK(dimension IN ('economic','housing','quality_of_life','safety','environment','demographics')),
  name TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_table TEXT,
  source_url TEXT,
  update_frequency TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('higher_is_better','lower_is_better','neutral')),
  weight_within_dimension REAL NOT NULL,
  proxy_fallback_metric_id TEXT REFERENCES metrics(id),
  is_proxy_target INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS metric_values (
  id TEXT PRIMARY KEY,
  cma_id TEXT NOT NULL REFERENCES cmas(id),
  metric_id TEXT NOT NULL REFERENCES metrics(id),
  period TEXT NOT NULL,
  value REAL,
  is_proxy INTEGER NOT NULL DEFAULT 0,
  proxy_note TEXT,
  source_publication_date TEXT,
  collected_at TEXT NOT NULL DEFAULT (datetime('now')),
  source_table_id TEXT,
  UNIQUE(cma_id, metric_id, period)
);

CREATE TABLE IF NOT EXISTS cma_scores (
  id TEXT PRIMARY KEY,
  cma_id TEXT NOT NULL REFERENCES cmas(id),
  computed_at TEXT NOT NULL DEFAULT (datetime('now')),
  economic_score REAL,
  housing_score REAL,
  quality_score REAL,
  safety_score REAL,
  environment_score REAL,
  demographic_score REAL,
  overall_score REAL NOT NULL,
  completeness_score REAL NOT NULL,
  default_weights_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS metric_history (
  id TEXT PRIMARY KEY,
  cma_id TEXT NOT NULL REFERENCES cmas(id),
  metric_id TEXT NOT NULL REFERENCES metrics(id),
  period TEXT NOT NULL,
  value REAL,
  collected_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(cma_id, metric_id, period)
);

CREATE INDEX IF NOT EXISTS idx_metric_values_cma ON metric_values(cma_id);
CREATE INDEX IF NOT EXISTS idx_metric_values_metric ON metric_values(metric_id);
CREATE INDEX IF NOT EXISTS idx_cma_scores_cma ON cma_scores(cma_id);
CREATE INDEX IF NOT EXISTS idx_metric_history_cma ON metric_history(cma_id);
