CREATE TABLE IF NOT EXISTS crops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop_name TEXT NOT NULL UNIQUE
    CHECK (crop_name IN ('Tomato','Lettuce','Wheat','Maize')),
  location TEXT NOT NULL,
  target_min REAL NOT NULL CHECK (target_min >= 0 AND target_min <= 100),
  target_max REAL NOT NULL CHECK (target_max >= 0 AND target_max <= 100),
  normal_water REAL NOT NULL CHECK (normal_water > 0 AND normal_water <= 10000),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (target_min < target_max)
);

INSERT INTO crops (crop_name, location, target_min, target_max, normal_water, notes)
SELECT crop_name, location, target_min, target_max, normal_water, notes
FROM (
  SELECT 'Tomato' AS crop_name, 'Greenhouse A' AS location, 55 AS target_min, 75 AS target_max, 500 AS normal_water, 'Check each morning' AS notes
  UNION ALL
  SELECT 'Lettuce', 'Greenhouse B', 60, 80, 400, 'Monitor leaf condition'
  UNION ALL
  SELECT 'Wheat', 'North Field', 35, 55, 300, 'Check after rainfall'
)
WHERE NOT EXISTS (SELECT 1 FROM crops);
