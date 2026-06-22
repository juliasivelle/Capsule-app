-- Wishlist items (product_id en text car les produits sont encore en mock JS)
-- Sera migré en UUID references products(id) au Prompt 4-5

create table public.wishlist_items (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  product_id text not null,
  saved_at   timestamptz default now() not null,
  unique(user_id, product_id)
);

alter table public.wishlist_items enable row level security;

create policy "Lecture wishlist"
  on public.wishlist_items for select using (auth.uid() = user_id);

create policy "Insertion wishlist"
  on public.wishlist_items for insert with check (auth.uid() = user_id);

create policy "Suppression wishlist"
  on public.wishlist_items for delete using (auth.uid() = user_id);

create index idx_wishlist_items_user_id on public.wishlist_items(user_id);
