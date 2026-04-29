# Supabase shared issue storage

이 프로젝트는 Supabase REST API를 사용해 여러 컴퓨터에서 같은 제보 데이터를 공유합니다. 브라우저 `localStorage`에는 이슈 데이터를 따로 저장하지 않습니다.

## 1. Table

Supabase SQL Editor에서 아래 SQL을 실행합니다.

```sql
create table if not exists public.supporter_issues (
  id text primary key,
  registered_at date not null,
  author_name text not null,
  service_name text not null,
  platform text not null,
  path text not null default '-',
  issue_status text not null,
  fix_status text not null,
  not_issue_reason text,
  jira_key text,
  supporter_jira_url text,
  service_jira_url text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.supporter_issues enable row level security;

create policy "Allow issue reads"
on public.supporter_issues
for select
using (true);

create policy "Allow issue inserts"
on public.supporter_issues
for insert
with check (true);

create policy "Allow issue updates"
on public.supporter_issues
for update
using (true)
with check (true);

create policy "Allow issue deletes"
on public.supporter_issues
for delete
using (true);
```

## 2. Environment variables

로컬 개발용 `.env.local` 또는 Vercel Environment Variables에 아래 값을 설정합니다.

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Deploy

Vercel에서 환경변수를 추가한 뒤 Production 재배포를 실행합니다.

## Note

현재 정책은 내부 운영툴의 빠른 공유를 위한 공개 읽기/쓰기 예시입니다. 실제 운영에서는 Supabase Auth를 붙이고 관리자만 insert/update/delete 할 수 있도록 RLS 정책을 좁혀야 합니다.
