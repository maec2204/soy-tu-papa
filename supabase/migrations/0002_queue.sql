-- Una sola mesa: los partidos aceptados hacen cola en orden de llegada.
-- "En la mesa" = el primero de la cola que todavía no cargó marcador.
-- Solo ese puede cargar marcador. Al cargarlo, la mesa queda libre para el siguiente.
-- La mesa se desbloquea de dos formas: los jugadores cancelan su partido, o, pasados
-- 20 minutos sin marcador, cualquiera que espere en la cola la libera y ese partido
-- pasa al final.

alter type public.match_status add value 'cancelled';

alter table public.matches
  -- Lugar en la cola: cuándo se aceptó, o cuándo lo mandaron al final.
  add column queued_at timestamptz,
  -- Primera vez que se cargó marcador. Un partido ya jugado no vuelve a ocupar la mesa
  -- aunque el marcador se dispute.
  add column played_at timestamptz;

update public.matches set queued_at = created_at where status <> 'invited';
update public.matches set played_at = coalesce(confirmed_at, created_at)
where status in ('awaiting_confirmation', 'confirmed');

-- Desde cuándo está libre la mesa para quien la ocupa ahora (una sola fila).
create table public.mesa (
  id boolean primary key default true check (id),
  free_since timestamptz not null default now()
);
insert into public.mesa default values;
alter table public.mesa enable row level security;
create policy "mesa visible" on public.mesa for select to authenticated using (true);

create function public.table_head() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.matches
  where status = 'playing' and played_at is null
  order by queued_at, id
  limit 1;
$$;

create or replace function public.accept_match(p_match uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.matches set status = 'playing', queued_at = clock_timestamp()
  where id = p_match and status = 'invited' and public.my_team(p_match) = 'B';
  if not found then
    raise exception 'cannot accept this match';
  end if;
end;
$$;

create or replace function public.report_score(p_match uuid, p_score_a integer, p_score_b integer)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_on_table boolean := p_match is not distinct from public.table_head();
begin
  if p_score_a is null or p_score_b is null
     or p_score_a < 0 or p_score_b < 0 or p_score_a = p_score_b then
    raise exception 'invalid score';
  end if;

  update public.matches m
  set status = 'awaiting_confirmation',
      score_a = p_score_a,
      score_b = p_score_b,
      reported_by = auth.uid(),
      played_at = coalesce(m.played_at, clock_timestamp())
  where m.id = p_match and m.status = 'playing' and public.my_team(p_match) is not null
    -- En cola no se carga marcador. Un marcador disputado sí se vuelve a cargar.
    and (m.played_at is not null or v_on_table);
  if not found then
    raise exception 'cannot report a score for this match';
  end if;

  if v_on_table then
    update public.mesa set free_since = clock_timestamp();
  end if;
end;
$$;

-- Los jugadores del partido pueden cancelarlo, esté en la mesa o en cola.
create function public.cancel_match(p_match uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_on_table boolean := p_match is not distinct from public.table_head();
begin
  update public.matches set status = 'cancelled'
  where id = p_match and status = 'playing' and public.my_team(p_match) is not null;
  if not found then
    raise exception 'cannot cancel this match';
  end if;

  if v_on_table then
    update public.mesa set free_since = clock_timestamp();
  end if;
end;
$$;

-- Pasados 20 minutos sin marcador, quien espera en la cola manda al final al partido de la mesa.
create function public.release_table() returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_head uuid := public.table_head();
begin
  if not exists (
    select 1 from public.matches m
    join public.match_players mp on mp.match_id = m.id
    where mp.player_id = auth.uid() and m.id <> v_head
      and m.status = 'playing' and m.played_at is null
  ) then
    raise exception 'only players waiting in the queue can release the table';
  end if;

  update public.matches m set queued_at = clock_timestamp()
  where m.id = v_head
    and greatest(m.queued_at, (select free_since from public.mesa))
        <= clock_timestamp() - interval '20 minutes';
  if not found then
    raise exception 'the table cannot be released yet';
  end if;

  update public.mesa set free_since = clock_timestamp();
end;
$$;

revoke execute on function
  public.table_head(), public.cancel_match(uuid), public.release_table()
from public, anon, authenticated;
grant execute on function public.cancel_match(uuid), public.release_table() to authenticated;
