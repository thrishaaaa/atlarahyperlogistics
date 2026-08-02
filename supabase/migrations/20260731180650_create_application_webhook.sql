create extension if not exists pg_net with schema extensions;

create or replace function public.notify_application_change()
returns trigger
language plpgsql
security definer
as $$
declare
  request_id bigint;
begin
  select net.http_post(
    url := 'https://prgcbiuinainrvedeeal.supabase.co/functions/v1/send-email',
    body := jsonb_build_object(
      'type', tg_op,
      'table', tg_table_name,
      'record', to_jsonb(new),
      'old_record', case when tg_op = 'UPDATE' then to_jsonb(old) else null end
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'atlarahyperlogistics@2026'
    )
  ) into request_id;

  return new;
end;
$$;

drop trigger if exists applications_notify_change on public.applications;

create trigger applications_notify_change
after insert or update on public.applications
for each row
execute function public.notify_application_change();