-- Solo se cancela un partido que todavía no cargó marcador.
-- Sin esto, quien pierde podía responder "No es correcto" y luego cancelar para borrar la derrota.
-- Un marcador disputado se resuelve volviéndolo a cargar y confirmando.

create or replace function public.cancel_match(p_match uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_on_table boolean := p_match is not distinct from public.table_head();
begin
  update public.matches set status = 'cancelled'
  where id = p_match and status = 'playing' and played_at is null
    and public.my_team(p_match) is not null;
  if not found then
    raise exception 'cannot cancel this match';
  end if;

  if v_on_table then
    update public.mesa set free_since = clock_timestamp();
  end if;
end;
$$;
