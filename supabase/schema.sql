-- Atuto — schemat bazy dla generatora skierowań na badania lekarskie
-- (załącznik 3a, Dz.U. 2023 poz. 607)
--
-- Skrypt jest idempotentny — można go uruchamiać wielokrotnie bez błędów.

-- ---------------------------------------------------------------------------
-- Rozszerzenia
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tabela: firmy
-- ---------------------------------------------------------------------------

create table if not exists public.firmy (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  nazwa text not null,
  adres text not null,
  nip text,
  created_at timestamptz default now()
);

create index if not exists idx_firmy_user_id on public.firmy (user_id);

-- ---------------------------------------------------------------------------
-- Tabela: pracownicy
-- ---------------------------------------------------------------------------

create table if not exists public.pracownicy (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmy (id) on delete cascade,
  imie_nazwisko text not null,
  typ_identyfikatora text not null check (
    typ_identyfikatora in ('pesel', 'dokument', 'data_urodzenia')
  ),
  identyfikator text not null,
  miejscowosc text,
  ulica text,
  nr_domu text,
  nr_lokalu text,
  stanowisko text,
  created_at timestamptz default now()
);

create index if not exists idx_pracownicy_firma_id on public.pracownicy (firma_id);

-- ---------------------------------------------------------------------------
-- Tabela: dokumenty
-- ---------------------------------------------------------------------------

create table if not exists public.dokumenty (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmy (id),
  -- ON DELETE SET NULL (nie CASCADE): wystawiony dokument musi pozostać
  -- niezmienny nawet po usunięciu pracownika — jego treść odtwarzamy
  -- wyłącznie z kolumny `dane`, nigdy przez ponowne złączenie z `pracownicy`.
  pracownik_id uuid references public.pracownicy (id) on delete set null,
  numer text not null unique,
  typ text not null,
  dane jsonb not null,
  url_pliku text,
  status text not null default 'wystawiony',
  data_utworzenia timestamptz default now()
);

comment on column public.dokumenty.dane is
  'Pełny snapshot danych z chwili wystawienia (dane pracodawcy, pracownika, '
  'stanowisko, czynniki). Treść dokumentu odtwarzana wyłącznie z tego pola, '
  'nigdy przez złączenie z pracownicy — dokument wystawiony musi być niezmienny.';

create index if not exists idx_dokumenty_firma_id on public.dokumenty (firma_id);
create index if not exists idx_dokumenty_pracownik_id on public.dokumenty (pracownik_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.firmy enable row level security;
alter table public.pracownicy enable row level security;
alter table public.dokumenty enable row level security;

-- firmy: dostęp tylko do wierszy własnego użytkownika

drop policy if exists "firmy_select_own" on public.firmy;
create policy "firmy_select_own" on public.firmy
  for select
  using (user_id = auth.uid());

drop policy if exists "firmy_insert_own" on public.firmy;
create policy "firmy_insert_own" on public.firmy
  for insert
  with check (user_id = auth.uid());

drop policy if exists "firmy_update_own" on public.firmy;
create policy "firmy_update_own" on public.firmy
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "firmy_delete_own" on public.firmy;
create policy "firmy_delete_own" on public.firmy
  for delete
  using (user_id = auth.uid());

-- pracownicy: dostęp przez właściciela powiązanej firmy

drop policy if exists "pracownicy_select_own" on public.pracownicy;
create policy "pracownicy_select_own" on public.pracownicy
  for select
  using (
    exists (
      select 1 from public.firmy
      where firmy.id = pracownicy.firma_id
        and firmy.user_id = auth.uid()
    )
  );

drop policy if exists "pracownicy_insert_own" on public.pracownicy;
create policy "pracownicy_insert_own" on public.pracownicy
  for insert
  with check (
    exists (
      select 1 from public.firmy
      where firmy.id = pracownicy.firma_id
        and firmy.user_id = auth.uid()
    )
  );

drop policy if exists "pracownicy_update_own" on public.pracownicy;
create policy "pracownicy_update_own" on public.pracownicy
  for update
  using (
    exists (
      select 1 from public.firmy
      where firmy.id = pracownicy.firma_id
        and firmy.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.firmy
      where firmy.id = pracownicy.firma_id
        and firmy.user_id = auth.uid()
    )
  );

drop policy if exists "pracownicy_delete_own" on public.pracownicy;
create policy "pracownicy_delete_own" on public.pracownicy
  for delete
  using (
    exists (
      select 1 from public.firmy
      where firmy.id = pracownicy.firma_id
        and firmy.user_id = auth.uid()
    )
  );

-- dokumenty: dostęp przez właściciela powiązanej firmy

drop policy if exists "dokumenty_select_own" on public.dokumenty;
create policy "dokumenty_select_own" on public.dokumenty
  for select
  using (
    exists (
      select 1 from public.firmy
      where firmy.id = dokumenty.firma_id
        and firmy.user_id = auth.uid()
    )
  );

drop policy if exists "dokumenty_insert_own" on public.dokumenty;
create policy "dokumenty_insert_own" on public.dokumenty
  for insert
  with check (
    exists (
      select 1 from public.firmy
      where firmy.id = dokumenty.firma_id
        and firmy.user_id = auth.uid()
    )
  );

drop policy if exists "dokumenty_update_own" on public.dokumenty;
create policy "dokumenty_update_own" on public.dokumenty
  for update
  using (
    exists (
      select 1 from public.firmy
      where firmy.id = dokumenty.firma_id
        and firmy.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.firmy
      where firmy.id = dokumenty.firma_id
        and firmy.user_id = auth.uid()
    )
  );

drop policy if exists "dokumenty_delete_own" on public.dokumenty;
create policy "dokumenty_delete_own" on public.dokumenty
  for delete
  using (
    exists (
      select 1 from public.firmy
      where firmy.id = dokumenty.firma_id
        and firmy.user_id = auth.uid()
    )
  );
