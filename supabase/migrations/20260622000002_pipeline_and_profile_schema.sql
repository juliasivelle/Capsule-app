create table public.profile_preferences (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null unique,
  sizes           jsonb default '{"hauts": [], "bas": [], "chaussures": [], "sousvets": [], "accessoires": []}',
  tones           text[] default '{}',
  cuts_hauts      text[] default '{}',
  cuts_bas        text[] default '{}',
  style           text,
  brands          text[] default '{}',
  discovery       boolean default false,
  budget_range    text,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

alter table public.profile_preferences enable row level security;

create policy "Lecture profil"
  on public.profile_preferences for select
  using (auth.uid() = user_id);

create policy "Insertion profil"
  on public.profile_preferences for insert
  with check (auth.uid() = user_id);

create policy "Mise a jour profil"
  on public.profile_preferences for update
  using (auth.uid() = user_id);

create trigger profile_preferences_updated_at
  before update on public.profile_preferences
  for each row execute function public.handle_updated_at();

create table public.wardrobe_items (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  name        text not null,
  category    text,
  color       text,
  image_url   text,
  notes       text,
  added_at    timestamptz default now() not null
);

alter table public.wardrobe_items enable row level security;

create policy "Lecture dressing"
  on public.wardrobe_items for select
  using (auth.uid() = user_id);

create policy "Insertion dressing"
  on public.wardrobe_items for insert
  with check (auth.uid() = user_id);

create policy "Mise a jour dressing"
  on public.wardrobe_items for update
  using (auth.uid() = user_id);

create policy "Suppression dressing"
  on public.wardrobe_items for delete
  using (auth.uid() = user_id);

create index idx_wardrobe_items_user_id on public.wardrobe_items(user_id);

create table public.merchants (
  id                uuid default gen_random_uuid() primary key,
  awin_merchant_id  text unique not null,
  name              text not null,
  feed_url          text,
  feed_format       text default 'csv',
  sync_enabled      boolean default true,
  category_mapping  jsonb default '{}',
  last_synced_at    timestamptz,
  created_at        timestamptz default now() not null
);

alter table public.merchants enable row level security;
create policy "Lecture merchants"
  on public.merchants for select using (true);

create table public.raw_products (
  id                uuid default gen_random_uuid() primary key,
  awin_product_id   text unique not null,
  merchant_id       uuid references public.merchants(id) on delete cascade,
  merchant_product_id text,
  product_name      text,
  description       text,
  merchant_category text,
  merchant_image_url text,
  aw_image_url      text,
  search_price      numeric(10, 2),
  currency          text default 'EUR',
  buy_url           text,
  raw_colour        text,
  raw_size          text,
  in_stock          boolean default true,
  last_synced_at    timestamptz default now() not null,
  created_at        timestamptz default now() not null
);

alter table public.raw_products enable row level security;
create policy "Lecture raw_products"
  on public.raw_products for select using (true);

create index idx_raw_products_merchant_id on public.raw_products(merchant_id);
create index idx_raw_products_last_synced on public.raw_products(last_synced_at);

create table public.products (
  id                  uuid default gen_random_uuid() primary key,
  raw_product_id      uuid references public.raw_products(id) on delete set null,
  awin_product_id     text unique not null,
  merchant_id         uuid references public.merchants(id) on delete set null,
  name                text not null,
  brand               text,
  description         text,
  category            text,
  price               numeric(10, 2),
  currency            text default 'EUR',
  image_url           text,
  product_url         text,
  style               text,
  cut                 text,
  gender              text,
  tones               text[] default '{}',
  sizes_available     text[] default '{}',
  stock_status        text default 'ok',
  in_stock            boolean default true,
  is_active           boolean default true,
  match_scores_dirty  boolean default true,
  last_synced_at      timestamptz,
  classified_at       timestamptz,
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

alter table public.products enable row level security;
create policy "Lecture products"
  on public.products for select using (true);

create trigger products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

create index idx_products_category on public.products(category);
create index idx_products_style on public.products(style);
create index idx_products_is_active on public.products(is_active);
create index idx_products_tones on public.products using gin(tones);
create index idx_products_sizes on public.products using gin(sizes_available);
create index idx_products_match_dirty on public.products(match_scores_dirty) where match_scores_dirty = true;

create table public.sync_logs (
  id            uuid default gen_random_uuid() primary key,
  function_name text not null,
  status        text not null,
  products_processed integer default 0,
  errors_count  integer default 0,
  error_detail  text,
  duration_ms   integer,
  ran_at        timestamptz default now() not null
);

alter table public.sync_logs enable row level security;
create policy "Lecture sync_logs"
  on public.sync_logs for select using (true);

create index idx_sync_logs_ran_at on public.sync_logs(ran_at desc);