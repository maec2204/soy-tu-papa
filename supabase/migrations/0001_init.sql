-- Soy tu papá: partidos de ping pong con confirmación de los dos lados.
-- Las tablas son de solo lectura para los usuarios; todo cambio pasa por las
-- funciones de este archivo, que toman la identidad de la sesión (auth.uid()).

-- Quién puede crear cuenta. Se llena a mano en Supabase; nunca va en el repositorio.
create table public.allowed_emails (
  email text primary key check (email = lower(email))
);

create table public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  avatar_url text,
  rating integer not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  created_at timestamptz not null default now()
);

create type public.match_kind as enum ('1v1', '2v2');
create type public.match_status as enum (
  'invited', 'playing', 'awaiting_confirmation', 'confirmed', 'declined'
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  kind public.match_kind not null,
  status public.match_status not null default 'invited',
  created_by uuid not null references public.players (id),
  score_a integer,
  score_b integer,
  reported_by uuid references public.players (id),
  rating_delta integer,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

-- El equipo A es el de quien crea el partido.
create table public.match_players (
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.players (id),
  team text not null check (team in ('A', 'B')),
  primary key (match_id, player_id)
);
create index match_players_player_idx on public.match_players (player_id);

-- Sin políticas: nadie la lee ni la escribe desde la app.
alter table public.allowed_emails enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;

create policy "players are readable" on public.players
  for select to authenticated using (true);
create policy "matches are readable" on public.matches
  for select to authenticated using (true);
create policy "match players are readable" on public.match_players
  for select to authenticated using (true);

-- Alta de jugador: solo correos del dominio de la empresa.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Un usuario sin correo tampoco pasa: "not exists" lo deja fuera.
  if not exists (
    select 1 from public.allowed_emails a where a.email = lower(new.email)
  ) then
    raise exception 'email not allowed';
  end if;
  insert into public.players (id, name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(left(btrim(new.raw_user_meta_data ->> 'name'), 40), ''),
      split_part(new.email, '@', 1)
    ),
    null
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Victorias de cada jugador sobre cada rival, solo en 1 contra 1 confirmados.
create view public.head_to_head with (security_invoker = true) as
select w.player_id as winner_id, l.player_id as loser_id, count(*)::integer as wins
from public.matches m
join public.match_players w
  on w.match_id = m.id
 and w.team = case when m.score_a > m.score_b then 'A' else 'B' end
join public.match_players l
  on l.match_id = m.id and l.team <> w.team
where m.kind = '1v1' and m.status = 'confirmed'
group by w.player_id, l.player_id;

-- Papá: 5 o más partidos entre los dos y 3 o más victorias de ventaja.
create view public.fatherhoods with (security_invoker = true) as
select
  t.winner_id as father_id,
  t.loser_id as child_id,
  t.wins,
  coalesce(r.wins, 0) as losses
from public.head_to_head t
left join public.head_to_head r
  on r.winner_id = t.loser_id and r.loser_id = t.winner_id
where t.wins + coalesce(r.wins, 0) >= 5
  and t.wins - coalesce(r.wins, 0) >= 3;

create function public.create_match(
  p_kind public.match_kind,
  p_rivals uuid[],
  p_partner uuid default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := auth.uid();
  v_team_a uuid[];
  v_all uuid[];
  v_size integer := case when p_kind = '1v1' then 1 else 2 end;
  v_match uuid;
begin
  if v_me is null then
    raise exception 'not authenticated';
  end if;

  v_team_a := case when p_kind = '1v1' then array[v_me] else array[v_me, p_partner] end;
  v_all := v_team_a || p_rivals;

  if array_position(v_all, null) is not null
     or cardinality(p_rivals) <> v_size
     or (select count(distinct x) from unnest(v_all) x) <> v_size * 2 then
    raise exception 'invalid players';
  end if;

  insert into public.matches (kind, created_by) values (p_kind, v_me)
  returning id into v_match;

  insert into public.match_players (match_id, player_id, team)
  select v_match, x, 'A' from unnest(v_team_a) x
  union all
  select v_match, x, 'B' from unnest(p_rivals) x;

  return v_match;
end;
$$;

-- Equipo del jugador de la sesión en un partido (null si no juega en él).
create function public.my_team(p_match uuid) returns text
language sql stable security definer set search_path = '' as $$
  select team from public.match_players
  where match_id = p_match and player_id = auth.uid();
$$;

create function public.accept_match(p_match uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.matches set status = 'playing'
  where id = p_match and status = 'invited' and public.my_team(p_match) = 'B';
  if not found then
    raise exception 'cannot accept this match';
  end if;
end;
$$;

create function public.decline_match(p_match uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.matches set status = 'declined'
  where id = p_match and status = 'invited' and public.my_team(p_match) = 'B';
  if not found then
    raise exception 'cannot decline this match';
  end if;
end;
$$;

create function public.report_score(p_match uuid, p_score_a integer, p_score_b integer)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_score_a is null or p_score_b is null
     or p_score_a < 0 or p_score_b < 0 or p_score_a = p_score_b then
    raise exception 'invalid score';
  end if;

  update public.matches
  set status = 'awaiting_confirmation',
      score_a = p_score_a,
      score_b = p_score_b,
      reported_by = auth.uid()
  where id = p_match and status = 'playing' and public.my_team(p_match) is not null;
  if not found then
    raise exception 'cannot report a score for this match';
  end if;
end;
$$;

-- Quien confirma o disputa tiene que ser del equipo contrario al que cargó el marcador.
create function public.reject_score(p_match uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.matches m
  set status = 'playing', score_a = null, score_b = null, reported_by = null
  where m.id = p_match
    and m.status = 'awaiting_confirmation'
    and public.my_team(p_match) <> (
      select team from public.match_players
      where match_id = p_match and player_id = m.reported_by
    );
  if not found then
    raise exception 'cannot reject this score';
  end if;
end;
$$;

create function public.confirm_score(p_match uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_match public.matches;
  v_winner text;
  v_rating_winner numeric;
  v_rating_loser numeric;
  v_delta integer;
begin
  update public.matches m
  set status = 'confirmed', confirmed_at = now()
  where m.id = p_match
    and m.status = 'awaiting_confirmation'
    and public.my_team(p_match) <> (
      select team from public.match_players
      where match_id = p_match and player_id = m.reported_by
    )
  returning * into v_match;
  if not found then
    raise exception 'cannot confirm this score';
  end if;

  v_winner := case when v_match.score_a > v_match.score_b then 'A' else 'B' end;

  select avg(p.rating) filter (where mp.team = v_winner),
         avg(p.rating) filter (where mp.team <> v_winner)
  into v_rating_winner, v_rating_loser
  from public.match_players mp
  join public.players p on p.id = mp.player_id
  where mp.match_id = p_match;

  -- Elo con K = 32: ganarle a un equipo de más nivel suma más.
  v_delta := round(32 * (1 - 1 / (1 + power(10, (v_rating_loser - v_rating_winner) / 400))));

  update public.players p
  set rating = p.rating + v_delta,
      wins = p.wins + 1,
      current_streak = p.current_streak + 1,
      best_streak = greatest(p.best_streak, p.current_streak + 1)
  from public.match_players mp
  where mp.match_id = p_match and mp.player_id = p.id and mp.team = v_winner;

  update public.players p
  set rating = p.rating - v_delta,
      losses = p.losses + 1,
      current_streak = 0
  from public.match_players mp
  where mp.match_id = p_match and mp.player_id = p.id and mp.team <> v_winner;

  update public.matches set rating_delta = v_delta where id = p_match;
end;
$$;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function
  public.create_match(public.match_kind, uuid[], uuid),
  public.accept_match(uuid),
  public.decline_match(uuid),
  public.report_score(uuid, integer, integer),
  public.reject_score(uuid),
  public.confirm_score(uuid)
to authenticated;

-- Avisos en vivo: la web se entera cuando cambia un partido.
alter publication supabase_realtime add table public.matches;
