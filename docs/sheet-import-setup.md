# 구글 시트 제보 가져오기 설정 가이드

이슈 입력 페이지의 "구글 시트에서 가져오기" 영역은 두 가지 방식을 지원합니다.

- **앱스크립트 자동 연동**이 설정되어 있으면, 버튼 클릭 한 번으로 시트의 새 제보를 바로 읽어옵니다.
- 설정되어 있지 않으면 **붙여넣기 방식**으로 동작합니다 (시트에서 새 행을 복사해 붙여넣는 방식).

둘 다 시트 공유 설정을 "링크가 있는 모든 사용자"로 바꿀 필요가 없습니다.

> 아래 1~3번은 **원본 제보 시트에 편집자 권한이 있는 경우**를 전제로 합니다. 원본 시트
> 소유권/편집 권한이 없다면 (예: 기수마다 담당자 개인 계정으로 시트가 새로 생성되는 경우)
> [sheet-import-consolidated-setup.md](./sheet-import-consolidated-setup.md)를 대신 참고하세요 —
> 내가 소유한 별도 시트에 앱스크립트를 설치해서, 보기 권한만 있는 원본 시트들을 코드로 직접
> 읽어오는 방식입니다.

## 1. 앱스크립트 설치 (자동 연동을 원할 경우)

1. 대상 스프레드시트를 엽니다 (`카카오 접근성 서포터즈 3기 (2026) 이슈제보(응답)` 등).
2. 상단 메뉴에서 **확장 프로그램 > Apps Script** 클릭.
3. 기본 코드(`Code.gs`)를 아래 내용으로 전체 교체합니다. (`function myFunction() {`처럼 남아있는
   기본 템플릿 코드는 반드시 지우고, 아래 내용만 남겨야 합니다.)

```javascript
// 아무 값이나 긴 랜덤 문자열로 바꾸세요 (예: 32자 이상). 대시보드 쪽 설정값과 반드시 동일해야 합니다.
const SECRET_TOKEN = "여기에-긴-무작위-문자열을-넣으세요";

// 탭 이름을 못 찾았을 때만 쓰는 예비값 (보통 안 쓰임, 아래 getResponseSheet 참고)
const FALLBACK_SHEET_NAME = "설문지 응답 시트1";

// 탭 이름으로 찾지 않고, 구글 폼이 실제로 연결되어 있는 탭을 찾아냅니다.
// 매달 탭을 새로 만들거나 이름을 바꿔도(예: 2604월 → 2605월) 신경 쓸 필요가 없습니다.
function getResponseSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();

  for (const sheet of sheets) {
    if (sheet.getFormUrl()) {
      return sheet;
    }
  }

  return spreadsheet.getSheetByName(FALLBACK_SHEET_NAME);
}

function doGet(e) {
  const token = e.parameter.token;

  if (token !== SECRET_TOKEN) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: "unauthorized" }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = getResponseSheet();
  const timezone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1); // 헤더 행 제외

  const data = rows
    .filter(function (row) {
      return row[0]; // 타임스탬프가 있는 행만
    })
    .map(function (row) {
      const timestamp =
        row[0] instanceof Date
          ? Utilities.formatDate(row[0], timezone, "yyyy-MM-dd'T'HH:mm:ss")
          : String(row[0]);

      return {
        timestamp: timestamp,
        authorName: row[2] ? String(row[2]) : "",
        serviceName: row[3] ? String(row[3]) : "",
        platform: row[4] ? String(row[4]) : "",
        path: row[5] ? String(row[5]) : "",
        description: row[6] ? String(row[6]) : "",
        attachment: row[7] ? String(row[7]) : "",
      };
    });

  return ContentService.createTextOutput(
    JSON.stringify({ rows: data }),
  ).setMimeType(ContentService.MimeType.JSON);
}
```

컬럼 순서(A~H열: 타임스탬프/이메일/작성자/서비스명/플랫폼/실행경로/설명/첨부)가 실제 시트와 다르면
`row[n]` 인덱스를 시트 열 순서에 맞게 조정해야 합니다.

## 2. 웹 앱으로 배포

1. 우측 상단 **배포 > 새 배포** 클릭.
2. 유형 선택에서 **웹 앱** 선택.
3. "다음 사용자 인증으로 실행": **나(Me)**.
4. "액세스 권한이 있는 사용자": **모든 사용자(Anyone)**. (시트 자체 공유 설정과는 무관합니다 — 이 앱스크립트는 시트 소유자 권한으로 실행되고, `token` 값이 맞아야만 데이터를 반환합니다.)
5. **배포** 클릭 → 나오는 **웹 앱 URL**을 복사해둡니다 (`https://script.google.com/macros/s/.../exec` 형태).
6. 처음 배포 시 구글 계정 권한 승인 화면이 뜨면 승인합니다.

> **회사 워크스페이스 정책으로 배포가 막힐 수 있습니다.** "이 작업을 수행할 권한이 없습니다" 같은
> 오류가 배포 시점에 뜨면, 편집 권한이 있어도 카카오 워크스페이스 관리자 정책(웹 앱 "모든 사용자"
> 액세스 제한, 또는 공유 드라이브 내 스크립트 실행 제한)일 가능성이 높습니다. 이 경우 시트
> 소유자 계정으로 시도해보거나, 그래도 안 되면 아래 3번(붙여넣기 방식)을 대신 사용하세요 —
> 대시보드는 앱스크립트 설정이 없으면 자동으로 붙여넣기 모드로 동작합니다.

## 3. 대시보드에 연결 (앱스크립트 배포에 성공한 경우)

복사한 웹 앱 URL과 `SECRET_TOKEN`을 아래 두 값으로 등록합니다.

- 로컬 개발: `.env.local`에 추가
  ```
  VITE_SHEET_IMPORT_URL=https://script.google.com/macros/s/xxxxx/exec
  VITE_SHEET_IMPORT_TOKEN=여기에-긴-무작위-문자열을-넣으세요
  ```
- 배포(GitHub Pages): 저장소 **Settings > Secrets and variables > Actions**에 동일한 이름으로 시크릿 등록
  - `VITE_SHEET_IMPORT_URL`
  - `VITE_SHEET_IMPORT_TOKEN`

이 두 값이 설정되어 있으면 이슈 입력 페이지의 붙여넣기 칸이 사라지고, "구글 시트에서 가져오기"
버튼 하나로 자동 조회됩니다. 설정을 지우면 (혹은 처음부터 안 하면) 자동으로 붙여넣기 모드로
돌아갑니다.

> **보안 참고**: 이 값들은 빌드된 프론트엔드 코드에 그대로 포함되어, 배포된 사이트의 JS를 열어보면 누구나 알아낼 수 있습니다.
> 즉 URL과 토큰을 아는 사람은 대시보드 로그인 없이도 시트 원본 데이터를 읽어갈 수 있습니다 (읽기 전용, 쓰기는 여전히 불가능).
> 지금 이 대시보드는 이슈 목록 자체도 로그인 없이 조회 가능한 구조라 감수하기로 한 트레이드오프입니다.
> 더 엄격하게 막으려면 토큰을 서버(예: Vercel 서버리스 함수)에서만 보관하고 대시보드는 그 서버를 거쳐 호출하도록 바꿔야 합니다.

## 4. 붙여넣기 방식 (앱스크립트 없이 바로 사용 가능)

앱스크립트 연동 없이도, 시트에서 새 행을 드래그로 선택해 복사(Ctrl+C)한 뒤 이슈 입력 페이지의
붙여넣기 칸에 붙여넣고(Ctrl+V) **가져오기**를 누르면 동일하게 동작합니다.

- 열 순서는 앱스크립트와 동일하게 타임스탬프/이메일/작성자/서비스명/플랫폼/실행경로/내용/첨부
  순서를 따라야 합니다 (시트에서 직접 복사하면 자동으로 이 순서가 유지됩니다).
- 반드시 시트의 실제 셀 범위를 드래그해서 복사해야 합니다 — 값을 손으로 옮겨 적거나 줄바꿈으로
  나눠서 붙여넣으면 열 구분이 깨집니다.
- 헤더 행을 같이 선택해도 자동으로 걸러집니다.
- 이슈 여부/수정 여부처럼 시트에 없는 항목이나, 뒤쪽에 추가로 있는 컬럼(이슈 아님 사유, 지라 키
  등 팀에서 별도로 관리하는 항목)은 무시되니 신경 쓰지 않아도 됩니다.

## 5. 공통 사항

- 등록을 완료해야 다음 건으로 큐가 넘어갑니다. 중간에 취소해도 같은 건이 유실되지 않고 다시 뜹니다.
- 서비스명이 드롭다운 목록과 정확히 일치하지 않으면(예: "카카오톡 채널") 빈 값으로 두고 원문을
  메모에 남기니, 직접 올바른 서비스명을 선택해주세요.
- 이미 등록을 완료한 행은 타임스탬프 기준으로 브라우저에 기억되어 중복 등록되지 않습니다.
- 시트 구조(질문 항목, 열 순서)가 바뀌면 앱스크립트의 `row[n]` 인덱스와
  `src/services/sheetImport.ts`의 매핑을 함께 업데이트해야 합니다.
