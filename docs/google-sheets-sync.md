# Google Sheets Sync Setup

이 프로젝트는 선택적으로 Google Sheets와 이슈 데이터를 동기화할 수 있습니다.

## 1. 개요

- 앱에서 이슈가 추가/수정/삭제될 때 현재 이슈 전체 목록을 Google Apps Script 웹앱으로 전송합니다.
- 웹앱은 Google Sheet의 `Issues` 시트를 전체 덮어쓰기 방식으로 갱신합니다.
- 원본 저장소는 계속 Supabase이며, Google Sheet는 조회/공유용 복제본 역할을 합니다.

## 2. 환경 변수

`.env.local` 또는 Vercel 환경 변수에 아래 값을 추가합니다.

```env
VITE_GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/REPLACE_ME/exec
```

## 3. Apps Script 만들기

Google Sheet를 하나 만든 뒤 상단 메뉴에서 `확장 프로그램 -> Apps Script`를 엽니다.

아래 코드를 붙여 넣습니다.

```javascript
function doPost(e) {
  const sheetName = "Issues";
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet =
    spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);

  const payload = JSON.parse(e.postData.contents || "{}");
  const issues = Array.isArray(payload.issues) ? payload.issues : [];

  const headers = [
    "ID",
    "등록일",
    "작성자",
    "서비스명",
    "플랫폼",
    "이슈 여부",
    "수정 여부",
    "이슈 아님 사유",
    "서포터즈 Jira 링크",
    "서비스 전달 링크",
    "메모",
    "동기화 시각",
  ];

  const rows = issues.map((issue) => [
    issue.id || "",
    issue.registeredAt || "",
    issue.authorName || "",
    issue.serviceName || "",
    issue.platform || "",
    issue.issueStatus || "",
    issue.fixStatus || "",
    issue.notIssueReason || "",
    issue.supporterJiraUrl || "",
    issue.serviceJiraUrl || "",
    issue.memo || "",
    payload.syncedAt || "",
  ]);

  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, count: rows.length }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 4. 웹앱으로 배포

1. Apps Script 우측 상단 `배포 -> 새 배포`
2. 유형을 `웹 앱`으로 선택
3. 실행 계정은 본인 계정 선택
4. 접근 권한은 조직 정책에 맞게 설정
   - 테스트 용도: `Anyone`
   - 조직 계정에서만 쓰려면 정책 확인 필요
5. 배포 후 `웹 앱 URL`을 복사해 `VITE_GOOGLE_SHEETS_WEBHOOK_URL`에 넣습니다.

## 5. 확인 방법

1. 앱에서 이슈를 등록/수정/삭제합니다.
2. Google Sheet의 `Issues` 시트를 확인합니다.
3. 같은 데이터가 행 단위로 갱신되면 성공입니다.

## 6. 참고

- 이 연동은 프론트엔드에서 직접 웹앱으로 요청합니다.
- 더 엄격한 보안이 필요하면 이후 단계에서 `Supabase Edge Function`이나 별도 백엔드 프록시로 감싸는 방식을 권장합니다.
