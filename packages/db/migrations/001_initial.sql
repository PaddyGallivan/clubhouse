-- Clubhouse v1 schema
-- Multi-tenant sport club platform

CREATE TABLE IF NOT EXISTS clubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT,
  sport TEXT NOT NULL DEFAULT 'afl',
  logo_url TEXT,
  primary_colour TEXT DEFAULT '#003087',
  secondary_colour TEXT DEFAULT '#FFD700',
  founded_year INTEGER,
  ground_name TEXT,
  ground_address TEXT,
  website TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  club_id INTEGER NOT NULL REFERENCES clubs(id),
  role TEXT NOT NULL CHECK(role IN ('player','coach','committee','sponsor','supporter','parent','volunteer','umpire')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','pending')),
  jumper_number INTEGER,
  positions TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, club_id, role)
);

CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL REFERENCES clubs(id),
  name TEXT NOT NULL,
  age_group TEXT,
  gender TEXT CHECK(gender IN ('male','female','mixed','open')),
  season TEXT,
  coach_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL REFERENCES teams(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  position TEXT,
  jumper_number INTEGER,
  is_captain INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS fixtures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL REFERENCES clubs(id),
  team_id INTEGER REFERENCES teams(id),
  round TEXT,
  opponent_name TEXT NOT NULL,
  date TEXT,
  time TEXT,
  venue TEXT,
  is_home INTEGER DEFAULT 1,
  score_us INTEGER,
  score_them INTEGER,
  status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming','played','cancelled','bye')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL REFERENCES clubs(id),
  team_id INTEGER REFERENCES teams(id),
  author_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sponsors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL REFERENCES clubs(id),
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK(tier IN ('platinum','gold','silver','bronze')),
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  contract_start TEXT,
  contract_end TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS magic_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  club_slug TEXT,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- WCYMS seed data
INSERT OR IGNORE INTO clubs (slug, name, short_name, sport, primary_colour, secondary_colour, founded_year, ground_name, ground_address)
VALUES ('wcyms', 'Williamstown CYMS FC', 'WCYMS', 'afl', '#003087', '#FFD700', 1946, 'Fearon Reserve', 'Williamstown, VIC');

INSERT OR IGNORE INTO teams (club_id, name, age_group, gender, season)
VALUES
  (1, 'Seniors', 'Open', 'male', '2026'),
  (1, 'Reserves', 'Open', 'male', '2026'),
  (1, 'Under 19s', 'U19', 'male', '2026'),
  (1, 'Women''s', 'Open', 'female', '2026');

INSERT OR IGNORE INTO sponsors (club_id, name, tier, website_url)
VALUES
  (1, 'Major Sponsor', 'gold', null),
  (1, 'Club Supporter', 'silver', null),
  (1, 'Local Business', 'bronze', null);
