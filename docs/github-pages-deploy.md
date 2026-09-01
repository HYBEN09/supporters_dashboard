# GitHub Pages 배포 가이드

이 프로젝트는 GitHub Pages에 정적 프론트엔드로 배포하고, 데이터 저장은 Supabase를 그대로 사용합니다.

`main` 브랜치에 push하면 [.github/workflows/deploy.yml](../.github/workflows/deploy.yml)이 자동으로 타입 체크 → 린트 → 빌드 → 배포까지 실행합니다. 아래 순서대로 한 번만 설정해두면 이후로는 push만 하면 됩니다.

## 0. 사전 준비물

- GitHub 저장소에 대한 관리자 권한 (Settings 접근 가능)
- Supabase 프로젝트 (없다면 [supabase-setup.md](./supabase-setup.md) 먼저 진행)
- (선택) 구글 시트 연동을 쓴다면 [sheet-import-consolidated-setup.md](./sheet-import-consolidated-setup.md) 참고

## 1. Supabase 값 준비

Supabase 프로젝트 대시보드 → `Settings -> API`에서 아래 두 값을 복사해둡니다.

- Project URL → `VITE_SUPABASE_URL`
- `anon` / `publishable` key → `VITE_SUPABASE_ANON_KEY`

```txt
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxx
```

**주의:** `service_role` 키나 `sb_secret_...` 로 시작하는 키는 절대 사용하지 않습니다. 브라우저에 그대로 노출되는 값이므로 반드시 `anon`/`publishable` 키만 사용합니다.

## 2. GitHub Secrets 등록

저장소에서 `Settings -> Secrets and variables -> Actions -> New repository secret`으로 이동해 아래 값을 등록합니다.

| Secret 이름 | 필수 여부 | 설명 |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | 필수 | 1단계에서 복사한 Project URL |
| `VITE_SUPABASE_ANON_KEY` | 필수 | 1단계에서 복사한 anon/publishable key |
| `VITE_SHEET_IMPORT_URL` | 선택 | 구글 시트 연동을 쓸 때만 |
| `VITE_SHEET_IMPORT_TOKEN` | 선택 | 구글 시트 연동을 쓸 때만 |

선택 항목(시트 연동)은 비워둬도 빌드와 배포는 정상적으로 됩니다. 앱에서 해당 기능만 비활성화됩니다.

## 3. GitHub Pages 활성화

저장소 `Settings -> Pages`로 이동해 **Source**를 `GitHub Actions`로 설정합니다. (한 번만 하면 됩니다.)

## 4. 배포하기

`main` 브랜치에 push하면 Actions 탭에서 워크플로우가 자동 실행됩니다.

```bash
git push origin main
```

워크플로우가 하는 일:

1. Node 22 설치, `npm ci`
2. 저장소 이름으로 base path 자동 계산
   - `<owner>.github.io` 형태의 저장소면 `base=/`
   - 그 외 일반 저장소면 `base=/<repo>/`
3. `npx tsc -b` 타입 체크
4. `npm run lint`
5. `npm run build` (위에서 등록한 Secrets를 빌드 환경 변수로 주입)
6. `dist/index.html`을 `dist/404.html`로 복사 (새로고침 시 404 방지용 SPA 폴백)
7. Pages artifact 업로드 후 배포

Actions 탭에서 초록 체크가 뜨면 배포 완료입니다. 실패하면 로그에서 어느 단계(타입 체크/린트/빌드)인지 먼저 확인합니다.

## 5. 배포 URL / 라우팅

- GitHub Pages는 딥링크 새로고침 시 404가 나기 쉬워서 이 프로젝트는 `HashRouter`를 사용합니다.
- 배포 URL 형식: `https://<user>.github.io/<repo>/#/dashboard`

## 6. 왜 Supabase 키를 브라우저에 노출해도 되나요?

브라우저에서 Supabase를 직접 호출하는 구조이며, 아래 두 조건이 갖춰져 있으면 안전합니다.

- `anon`/`publishable` key만 사용 (service_role 키 금지)
- Supabase에서 Row Level Security(RLS)가 켜져 있고 정책이 설정되어 있음 (설정 방법: [supabase-setup.md](./supabase-setup.md))

## 7. 로컬에서 미리 확인하고 싶다면

배포 전에 로컬에서 같은 빌드를 검증하려면:

```bash
npm ci
npx tsc -b
npm run lint
npm run build
npm run preview
```

## 문제 해결

- **배포는 됐는데 화면이 빈 화면**: base path 문제일 가능성이 높습니다. 저장소 이름과 워크플로우의 base path 계산 로직(3단계 참고)이 맞는지 확인합니다.
- **로그인/데이터가 하나도 안 뜸**: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` secret 값이 정확한지, RLS 정책이 설정되어 있는지 확인합니다.
- **새로고침하면 404**: `dist/404.html` 복사 단계가 정상 실행됐는지 Actions 로그에서 확인합니다.
