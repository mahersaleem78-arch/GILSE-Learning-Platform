-- Maher AI orchestration v5
alter table maher_ai.agent_tasks add column if not exists next_run_at timestamptz;
alter table maher_ai.agent_tasks add column if not exists last_error text;
alter table maher_ai.agent_tasks add column if not exists attempts integer not null default 0;
alter table maher_ai.agent_tasks add column if not exists parent_task_id uuid references maher_ai.agent_tasks(id) on delete set null;
alter table maher_ai.agent_tasks add column if not exists blocked_reason text;
create index if not exists agent_tasks_ready_idx on maher_ai.agent_tasks(user_id,status,priority desc,next_run_at);
alter table maher_ai.agent_task_steps add column if not exists requires_approval boolean not null default false;
create table if not exists maher_ai.agent_approvals (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 task_id uuid references maher_ai.agent_tasks(id) on delete cascade,
 step_id uuid references maher_ai.agent_task_steps(id) on delete cascade,
 action text not null,
 status text not null default 'pending',
 reason text not null default '',
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 resolved_at timestamptz
);
alter table maher_ai.agent_approvals enable row level security;
drop policy if exists agent_approvals_owner on maher_ai.agent_approvals;
create policy agent_approvals_owner on maher_ai.agent_approvals for all to authenticated
using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create index if not exists agent_approvals_user_status_idx on maher_ai.agent_approvals(user_id,status,created_at desc);
