-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Players table
create table players (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  name text not null,
  age integer not null,
  nationality text not null,
  skill integer not null check (skill between 1 and 5),
  notes text default '',
  active boolean default true
);

-- Sessions table (weekly matches)
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  date date not null default current_date,
  team_size integer not null default 5,
  label text default ''
);

-- Session players (who attended each week)
create table session_players (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  player_id uuid references players(id) on delete cascade
);

-- Generated teams (saved results)
create table teams (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  name text not null,
  color text not null,
  player_ids uuid[] not null default '{}'
);

-- Row level security
alter table players enable row level security;
alter table sessions enable row level security;
alter table session_players enable row level security;
alter table teams enable row level security;

-- Allow all authenticated users full access (shared manager access)
create policy "Authenticated users can do everything with players"
  on players for all using (auth.role() = 'authenticated');

create policy "Authenticated users can do everything with sessions"
  on sessions for all using (auth.role() = 'authenticated');

create policy "Authenticated users can do everything with session_players"
  on session_players for all using (auth.role() = 'authenticated');

create policy "Authenticated users can do everything with teams"
  on teams for all using (auth.role() = 'authenticated');

-- Sample players
insert into players (name, age, nationality, skill, notes) values
  ('Carlos Silva', 28, 'Brazil', 5, 'Forward'),
  ('Tom Baker', 32, 'England', 3, ''),
  ('Yuki Tanaka', 25, 'Japan', 4, ''),
  ('Marco Rossi', 30, 'Italy', 4, 'Goalkeeper'),
  ('Kwame Osei', 27, 'Ghana', 3, ''),
  ('Pierre Dubois', 35, 'France', 2, ''),
  ('Diego Flores', 22, 'Mexico', 4, ''),
  ('Luc Mertens', 29, 'Belgium', 3, ''),
  ('Ryo Park', 26, 'Korea', 5, ''),
  ('Ahmed Benali', 31, 'Morocco', 3, '');
