-- Boss Butler Database Schema

-- Stores (两家餐厅)
create table stores (
  id text primary key,
  name text not null,
  type text not null check (type in ('operating', 'preparing'))
);

insert into stores values
  ('store1', 'Store 1', 'operating'),
  ('store2', 'New Location', 'preparing');

-- Tasks (事项)
create table tasks (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  store_id text references stores(id),
  status text default 'open' check (status in ('open', 'following', 'done')),
  priority text default 'medium' check (priority in ('high', 'medium', 'low')),
  due_date date,
  follow_up_at timestamptz,
  source text default 'text' check (source in ('voice', 'text', 'translation')),
  original_input text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Translations (翻译记录)
create table translations (
  id uuid default gen_random_uuid() primary key,
  source_text text not null,
  source_lang text not null,
  target_text text not null,
  target_lang text not null,
  converted_to_task_id uuid references tasks(id),
  created_at timestamptz default now()
);

-- Enable RLS (Row Level Security) - open for now
alter table stores enable row level security;
alter table tasks enable row level security;
alter table translations enable row level security;

create policy "Allow all" on stores for all using (true);
create policy "Allow all" on tasks for all using (true);
create policy "Allow all" on translations for all using (true);

-- Exercises (运动记录)
create table exercises (
  id uuid default gen_random_uuid() primary key,
  type text not null,
  duration_min integer not null,
  calories_burned integer not null,
  note text,
  source text default 'manual',
  logged_at date default current_date,
  created_at timestamptz default now()
);

-- Meals (饮食记录)
create table meals (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  photo_url text,
  portion text,
  calories integer not null,
  protein_g numeric(6,1),
  carbs_g numeric(6,1),
  fat_g numeric(6,1),
  meal_type text default '其他',
  ai_raw jsonb,
  source text default 'photo',
  logged_at date default current_date,
  created_at timestamptz default now()
);

alter table exercises enable row level security;
alter table meals enable row level security;

create policy "Allow all" on exercises for all using (true);
create policy "Allow all" on meals for all using (true);
