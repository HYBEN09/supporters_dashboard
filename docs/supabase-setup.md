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

create policy "Allow authenticated issue inserts"
on public.supporter_issues
for insert
to authenticated
with check (true);

create policy "Allow authenticated issue updates"
on public.supporter_issues
for update
to authenticated
using (true)
with check (true);

create policy "Allow authenticated issue deletes"
on public.supporter_issues
for delete
to authenticated
using (true);
```

조회(select)는 로그인 없이 누구나 가능하지만, 등록/수정/삭제(insert/update/delete)는 로그인한(`authenticated`) 사용자만 가능합니다. 기존에 `using (true)` / `with check (true)`로 전체 공개 정책이 이미 적용되어 있었다면, 아래 SQL로 기존 정책을 먼저 지우고 위 정책을 다시 생성하세요.

```sql
drop policy if exists "Allow issue inserts" on public.supporter_issues;
drop policy if exists "Allow issue updates" on public.supporter_issues;
drop policy if exists "Allow issue deletes" on public.supporter_issues;
```

## 1.5 감사 로그 / 휴지통용 컬럼 추가

등록자·최종 수정자 기록과 삭제 복원(휴지통) 기능을 위해 아래 컬럼을 추가합니다. Supabase SQL Editor에서 실행하세요.

```sql
alter table public.supporter_issues
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by text;
```

- `created_by` / `updated_by`: 이슈를 등록·수정한 로그인 아이디(LDAP 아이디)를 저장합니다.
- `deleted_at` / `deleted_by`: 삭제 버튼을 누르면 실제로 행을 지우지 않고 이 값을 채웁니다(소프트 삭제). `/issues/trash`(휴지통) 화면에서 삭제된 지 30일이 안 된 이슈를 복원하거나 영구 삭제할 수 있습니다.
- 30일이 지난 항목은 별도 서버 스케줄러 없이, 팀원이 휴지통 화면에 접속할 때 앱이 자동으로 영구 삭제합니다. 아무도 휴지통을 열지 않으면 만료된 항목이 남아있을 수 있습니다. 정확한 자동화가 필요하면 Supabase pg_cron으로 `deleted_at < now() - interval '30 days'`인 행을 주기적으로 delete하는 방식을 추가로 고려하세요.
- 기존 RLS 정책은 그대로 사용합니다. 소프트 삭제/복원은 update 정책으로, 영구 삭제는 delete 정책으로 이미 커버됩니다.

## 2. 계정(로그인) 설정

이 앱은 사번/LDAP 스타일 아이디(예: `polar.09`)로 로그인합니다. Supabase Auth는 실제 사내 LDAP과 연동되지 않으므로, 아이디를 회사 이메일로 변환해 Supabase Auth 계정을 만드는 방식입니다. 소속에 따라 다음 두 도메인 중 하나로 계정을 만들면 됩니다. 로그인 화면에는 아이디만 입력하면 되고, 앱이 두 도메인을 순서대로 시도해 일치하는 계정으로 로그인합니다.

- 링키지랩 소속: `{아이디}@linkagelab.co.kr`
- 카카오 소속: `{아이디}@kakaocorp.com`

회원가입 화면은 앱에 없고, 관리자가 아래 절차로 계정을 직접 발급합니다.

1. Supabase 대시보드 → **Authentication → Providers → Email**에서 **Confirm email**(이메일 인증 요구)을 끕니다. 실제 메일함이 있더라도 앱에서 발송하는 인증 메일을 각 팀원이 직접 열어 인증할 필요 없이 관리자가 바로 로그인 가능한 계정을 만들기 위함입니다.
2. Supabase 대시보드 → **Authentication → Users → Add user**에서 서포터즈 팀원별로 계정을 생성합니다.
   - Email: 소속에 맞는 도메인으로 `polar.09@linkagelab.co.kr` 또는 `hong.gd@kakaocorp.com` (팀원의 아이디를 소문자로)
   - Password: 팀원에게 별도로 전달할 초기 비밀번호
   - **Auto Confirm User**를 체크해서 이메일 인증 없이 바로 로그인 가능하게 합니다.
3. 팀원은 앱 우측 상단 로그인 버튼에서 아이디(`polar.09`)와 비밀번호로 로그인합니다.
4. 같은 아이디가 두 도메인에 동시에 존재하면 안 됩니다. `linkagelab.co.kr` 계정이 먼저 시도되므로, 동일 아이디가 두 도메인에 각각 있으면 `linkagelab.co.kr` 쪽 비밀번호로만 로그인됩니다.
5. Supabase 대시보드 → **Authentication → Providers → Email**에서 **Allow new users to sign up**은 꺼둔 상태를 유지하세요(기본값). 이 앱에는 회원가입 폼이 없지만, Auth API가 열려 있으면 외부에서 직접 가입 요청을 보낼 수 있습니다.

## 3. Environment variables

로컬 개발용 `.env.local` 또는 저장소 **Settings > Secrets and variables > Actions**(GitHub Pages 배포용)에 아래 값을 설정합니다.

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Deploy

GitHub Pages에 시크릿을 추가한 뒤, `main` 브랜치에 푸시하거나 Actions 탭에서 "Deploy to GitHub Pages" 워크플로를 수동 실행해 재배포합니다.

## Note

조회는 로그인 없이 공개되어 있지만, 등록/수정/삭제는 Supabase Auth 로그인이 필요합니다. 계정은 관리자가 Supabase 대시보드에서 직접 발급하며, 앱에 회원가입 화면은 없습니다.
