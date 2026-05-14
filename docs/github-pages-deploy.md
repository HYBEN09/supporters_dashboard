# GitHub Pages Deploy Guide

이 프로젝트는 GitHub Pages에 정적 프론트엔드로 배포하고, 데이터 저장은 Supabase를 그대로 사용합니다.

## 1. 라우팅 방식

- GitHub Pages 새로고침 이슈를 줄이기 위해 `HashRouter`를 사용합니다.
- 배포 후 주소 예시:
  - `https://<user>.github.io/<repo>/#/dashboard`

## 2. GitHub Secrets 추가

GitHub 저장소에서 아래 값을 등록합니다.

`Settings -> Secrets and variables -> Actions`

추가할 secret:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

값 예시:

```txt
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxx
```

주의:

- `service_role`
- `sb_secret_...`

이 두 종류의 키는 절대 넣지 않습니다.

## 3. GitHub Pages 설정

저장소에서 아래를 확인합니다.

`Settings -> Pages`

- Source: `GitHub Actions`

## 4. 배포 동작

`.github/workflows/deploy.yml` 이 자동으로 다음을 처리합니다.

- Node 설치
- `npm ci`
- 타입 체크
- 린트
- 빌드
- Pages artifact 업로드
- GitHub Pages 배포

추가로 저장소가:

- `username.github.io` 형태면 `base=/`
- 일반 프로젝트 저장소면 `base=/<repo>/`

로 자동 계산합니다.

## 5. Supabase 연결 방식

브라우저에서 직접 Supabase를 호출합니다.

이 방식은 아래 조건에서 안전합니다.

- Supabase publishable/anon key 사용
- Row Level Security(RLS) 설정 완료

## 6. 배포 확인

`main` 브랜치에 push 하면 GitHub Actions가 실행됩니다.

배포 URL 예시:

```txt
https://<user>.github.io/<repo>/#/dashboard
```
