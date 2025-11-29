create table public.notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'system', -- 'status_update', 'promotion', 'system'
  is_read boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint notifications_pkey primary key (id)
);

-- RLS Policies
alter table public.notifications enable row level security;

create policy "Users can view their own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Admins can insert notifications" on public.notifications
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow service role to manage everything (for edge functions)
create policy "Service role full access" on public.notifications
  for all using ( auth.role() = 'service_role' );
