create schema if not exists app_private;

do $$
begin
  if not exists (select 1 from pg_settings where name = 'app.tenant_id') then
    perform set_config('app.tenant_id', '', false);
  end if;
end$$;

create or replace function app_private.current_tenant_id() returns text as $$
begin
  return nullif(current_setting('app.tenant_id', true), '');
end;
$$ language plpgsql stable;

create or replace function app_private.enforce_tenant_id()
returns trigger as $$
begin
  if app_private.current_tenant_id() is null then
    raise exception 'tenant id must be set using SET app.tenant_id before accessing tenant scoped tables';
  end if;
  if TG_OP in ('INSERT', 'UPDATE') then
    NEW."tenantId" := app_private.current_tenant_id();
  end if;
  return NEW;
end;
$$ language plpgsql;

create or replace procedure app_private.enable_rls_for(table_name text) as $$
declare
  policy_select text := format('%I_tenant_isolation_select', table_name);
  policy_write text := format('%I_tenant_isolation_write', table_name);
begin
  execute format('alter table %I enable row level security', table_name);
  execute format('drop policy if exists %I on %I', policy_select, table_name);
  execute format('drop policy if exists %I on %I', policy_write, table_name);
  execute format('create policy %I on %I for select using ("tenantId" = app_private.current_tenant_id())', policy_select, table_name);
  execute format('create policy %I on %I for all to public using ("tenantId" = app_private.current_tenant_id()) with check ("tenantId" = app_private.current_tenant_id())', policy_write, table_name);
  execute format('drop trigger if exists enforce_tenant_id on %I', table_name);
  execute format('create trigger enforce_tenant_id before insert or update on %I for each row execute procedure app_private.enforce_tenant_id()', table_name);
end;
$$ language plpgsql;

select app_private.enable_rls_for(table_name)
from (
  values
    ('Tenant'),
    ('Facility'),
    ('TenantUser'),
    ('ApiKey'),
    ('PolicyNode'),
    ('PolicyDocument'),
    ('PolicyVersion'),
    ('PolicyChunk'),
    ('IngestJob'),
    ('ChatSession'),
    ('ChatMessage'),
    ('UsageEvent'),
    ('UsageAggregate'),
    ('AuditEvent')
) as t(table_name);

revoke all on function app_private.enable_rls_for(text) from public;
