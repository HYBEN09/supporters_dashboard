# 통합 시트로 구글 시트 자동 연동 설정하기 (기수 소유권 문제 우회)

## 이 문서를 보는 이유

기수별 제보 시트(`서포터즈 N기 이슈제보(응답)`)는 보통 서포터즈 운영 담당자 개인 계정 소유로 생성되어,
내 계정에는 편집자 권한이 없는 경우가 많습니다. 앱스크립트를 원본 시트에 직접 설치·배포하려면
최소 편집자 권한이 필요한데, 권한이 없으면 [sheet-import-setup.md](./sheet-import-setup.md)에서 설명한
방식은 적용할 수 없습니다.

이 문서는 대신 **내가 소유한 새 스프레드시트**를 하나 만들고, 그 안에 앱스크립트를 설치해서
원본 시트들을 읽어오는 방법을 설명합니다. 원본 시트에는 **보기 권한만 있으면 되고, 편집
권한이나 소유권이 전혀 필요 없습니다.**

> **시도하면서 겪은 문제와 해결**
> - `IMPORTRANGE` + `VSTACK` 수식으로 시트를 이어 붙이는 방법 → 월별 탭이 늘어날 때마다 수식을
>   손으로 고쳐야 하고, 빈 범위 때문에 오류가 반복돼서 **앱스크립트 코드가 탭을 직접 순회하는
>   방식**으로 변경.
> - 웹 앱을 **기존 배포 수정(배포 관리 > 편집)** 으로 업데이트했을 때 → `linkagelab.co.kr`
>   도메인 로그인으로 리다이렉트되어 로그인 없는 요청이 전부 실패. **"배포 > 새 배포"로 완전히
>   새 배포를 만드니 해결됨** — 기존 배포를 수정하는 방식은 예전에 좁게 설정했던 접근 권한이
>   유지되는 것으로 보입니다. **새 배포**를 만들 때 "액세스 권한이 있는 사용자"를 **모든
>   사용자**로 정확히 설정하면 로그인 없이도 정상 동작합니다 (실제 확인됨).

## 실제 시트 구조 확인 결과

1~3기 시트를 직접 열어 확인해보니, 응답 데이터가 탭 하나에 전부 쌓이는 구조가 아니라
**월별로 탭이 나뉘어 있었습니다.**

| 기수 | 탭 목록 |
| --- | --- |
| 1기 | `설문지 응답 시트1`, `2503월`, `2501월`, `12월`, `11월`, `10월`, `8월`, `7월`, `6월`, `5월`, `장애유형 구성`(참고용, 응답 데이터 아님) |
| 2기 | `설문지 응답 시트1`, `Form_Responses1`, `2603월`, `2602월`, `2601월`, `2512월`, `2511월`, `2510월`, `2509월`, `2508월`, `2507월`, `2506월`, `2505월`, `2504월` |
| 3기 | `설문지 응답 시트1`, `2608월`, `2607월`, `2606월`, `2605월`, `2604월` |

실제로 3기의 `설문지 응답 시트1`을 스크립트로 읽어보니, 월별 탭과 무관하게 **4월부터 지금까지
누적 응답이 전부 들어있는 게 확인됐습니다** (128건). 즉 `설문지 응답 시트1`이 실제 폼과 연결된
누적 원본이고, `26xx월` 탭들은 별도 용도(월별 집계/보관용으로 추정)로 보입니다.

> **확인 필요**: 2기의 `Form_Responses1`이 `설문지 응답 시트1`과 중복 데이터인지, 1~3기 헤더
> 열 순서가 모두 같은지(타임스탬프/이메일/작성자/서비스명/플랫폼/실행경로/내용/첨부, A~H열).

## 설계

통합 시트에는 탭이 **`전체이력` 하나만** 필요합니다.

- **`전체이력` 탭**: 스크립트의 `syncFullHistory()` 함수가 1~3기(및 앞으로 추가될 기수)
  스프레드시트의 모든 탭을 순회하며 읽어온 데이터를 채워 넣는 조회/보관용 탭입니다. 새 탭이
  생겨도 코드가 그때그때 있는 탭을 전부 읽으므로 수식을 고칠 필요가 없습니다.
- **대시보드용 실시간 조회(`doGet`)**: 별도 탭이 필요 없습니다. 대시보드가 "가져오기"를 누르면
  스크립트가 **그 순간 3기(현재 기수) 원본 시트를 직접 열어**, `getFormUrl()`로 실제 폼이
  연결된 탭을 찾아 그 탭의 데이터를 바로 돌려줍니다.

## 1. 통합 스프레드시트 준비

1. 구글 드라이브에서 **내 드라이브(공유 드라이브 아님)** 에 스프레드시트를 준비합니다.
2. 탭 이름을 `전체이력`으로 정리합니다.
3. `A1:H1`에 헤더를 입력합니다.

   | A | B | C | D | E | F | G | H |
   | --- | --- | --- | --- | --- | --- | --- | --- |
   | 타임스탬프 | 이메일 | 작성자 | 서비스명 | 플랫폼 | 실행경로 | 내용 | 첨부 |

## 2. 앱스크립트 코드

통합 시트 상단 메뉴에서 **확장 프로그램 > Apps Script** 클릭 후, 기본 코드(`Code.gs`)를 아래
내용으로 전체 교체합니다.

```javascript
// 아무 값이나 긴 랜덤 문자열로 바꾸세요 (예: 32자 이상). 대시보드 쪽 설정값과 반드시 동일해야 합니다.
const SECRET_TOKEN = "여기에-긴-무작위-문자열을-넣으세요";

// 대시보드 "가져오기"가 실시간으로 바라보는 현재 기수 시트. 기수가 바뀌면 이 값만 바꾸면 됩니다.
const CURRENT_COHORT_SPREADSHEET_ID = "1eWtMOa5PvyaLjpHM_W4IdTe-sy0c069T7pQka6yjPF8"; // 3기

// 전체이력에 모아둘 기수 시트 ID들. 새 기수가 시작되면 여기에 한 줄 추가.
const ALL_COHORT_SPREADSHEET_IDS = [
  "1B7Ncghjq9Yq8ICzpz2jtK5LFCbDJopvY5oKLO8jHhhY", // 1기
  "1mC4laA_06kbfea5MQtnWZbSDqDFkEM97IqZVF3bMvDU", // 2기
  "1eWtMOa5PvyaLjpHM_W4IdTe-sy0c069T7pQka6yjPF8", // 3기
];

// 응답 데이터가 아닌 참고용 탭은 이름으로 제외 (필요하면 추가/삭제)
const EXCLUDED_SHEET_NAMES = ["장애유형 구성"];

// 통합 시트 안의 전체이력 탭 이름. 1번에서 만든 탭 이름과 반드시 일치해야 합니다.
const HISTORY_SHEET_NAME = "전체이력";

function rowToObject_(row, timezone) {
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
}

function findLiveResponseSheet_(spreadsheet) {
  const sheets = spreadsheet.getSheets();

  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getFormUrl()) {
      return sheets[i];
    }
  }

  return null;
}

// 대시보드 "가져오기" 버튼이 호출하는 엔드포인트. 현재 기수 시트를 실시간으로 읽어 돌려줍니다.
function doGet(e) {
  const token = e.parameter.token;

  if (token !== SECRET_TOKEN) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: "unauthorized" }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const spreadsheet = SpreadsheetApp.openById(CURRENT_COHORT_SPREADSHEET_ID);
  const sheet = findLiveResponseSheet_(spreadsheet);

  if (!sheet) {
    return ContentService.createTextOutput(
      JSON.stringify({ rows: [] }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const timezone = spreadsheet.getSpreadsheetTimeZone();
  const values = sheet.getDataRange().getValues();
  const rows = values
    .slice(1)
    .filter(function (row) {
      return row[0];
    })
    .map(function (row) {
      return rowToObject_(row, timezone);
    });

  return ContentService.createTextOutput(
    JSON.stringify({ rows: rows }),
  ).setMimeType(ContentService.MimeType.JSON);
}

// 전체이력 탭을 모든 기수 시트의 모든 탭 데이터로 다시 채웁니다. 메뉴 버튼이나 트리거로 실행합니다.
function syncFullHistory() {
  const historySheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HISTORY_SHEET_NAME);
  const allRows = [];

  ALL_COHORT_SPREADSHEET_IDS.forEach(function (id) {
    const spreadsheet = SpreadsheetApp.openById(id);
    const timezone = spreadsheet.getSpreadsheetTimeZone();

    spreadsheet.getSheets().forEach(function (sheet) {
      if (EXCLUDED_SHEET_NAMES.indexOf(sheet.getName()) !== -1) {
        return;
      }

      const values = sheet.getDataRange().getValues();

      values.slice(1).forEach(function (row) {
        if (!row[0]) {
          return;
        }

        allRows.push(rowToObject_(row, timezone));
      });
    });
  });

  allRows.sort(function (a, b) {
    return a.timestamp.localeCompare(b.timestamp);
  });

  const lastRow = historySheet.getMaxRows();

  if (lastRow > 1) {
    historySheet.getRange(2, 1, lastRow - 1, 8).clearContent();
  }

  if (allRows.length > 0) {
    const values = allRows.map(function (row) {
      return [
        row.timestamp,
        "",
        row.authorName,
        row.serviceName,
        row.platform,
        row.path,
        row.description,
        row.attachment,
      ];
    });

    historySheet.getRange(2, 1, values.length, 8).setValues(values);
  }
}

// 시트를 열면 상단에 "동기화" 메뉴가 생겨서 수동으로도 새로고침할 수 있습니다.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("동기화")
    .addItem("전체이력 새로고침", "syncFullHistory")
    .addToUi();
}
```

## 3. 최초 실행 및 권한 승인

1. Apps Script 편집기 상단에서 실행할 함수로 `syncFullHistory`를 선택하고 **실행** 버튼을
   클릭합니다.
2. 처음 실행하면 **"승인 필요"** 창이 뜹니다. 내 계정으로 로그인 → 권한 검토 →
   "Google에서 확인하지 않은 앱입니다" 경고가 나오면 **고급 > (프로젝트 이름)으로 이동** →
   **허용**을 클릭합니다.
3. 실행이 끝나면 `전체이력` 탭에 1~3기 데이터가 채워져 있는지 확인합니다.

## 4. 정기적으로 자동 새로고침되게 트리거 설정 (선택)

1. Apps Script 편집기 좌측 **트리거(시계 아이콘)** 클릭 → **트리거 추가**.
2. 실행할 함수: `syncFullHistory`, 이벤트 소스: **시간 기반**, 예: **일 타이머** 또는
   **시간 단위 타이머 (예: 1시간마다)**.
3. 저장.

## 5. 웹 앱으로 배포 (반드시 "새 배포"로)

1. 우측 상단 **배포 > 새 배포** 클릭 — 기존 배포가 있어도 **편집(연필 아이콘)이 아니라 새
   배포**를 만들어야 합니다. 편집으로 업데이트하면 예전에 설정된 접근 권한이 그대로 남아
   로그인 리다이렉트가 발생할 수 있습니다 (실제로 겪은 문제).
2. 유형 선택에서 **웹 앱** 선택.
3. "다음 사용자 인증으로 실행": **나(Me)**.
4. "액세스 권한이 있는 사용자": **모든 사용자**.
5. **배포** 클릭 → **웹 앱 URL** 복사 (`https://script.google.com/macros/s/.../exec` 형태 —
   URL에 `/a/macros/도메인/`이 포함되어 있다면 도메인 제한이 걸려 있을 가능성이 높으니 다시
   "새 배포"로 시도해보세요).
6. 처음 배포 시 구글 계정 권한 승인 화면이 뜨면 승인합니다.

## 6. 대시보드에 연결

복사한 웹 앱 URL과 `SECRET_TOKEN`을 아래 두 값으로 등록합니다.

- 로컬 개발: `.env.local`에 추가
  ```
  VITE_SHEET_IMPORT_URL=https://script.google.com/macros/s/xxxxx/exec
  VITE_SHEET_IMPORT_TOKEN=여기에-긴-무작위-문자열을-넣으세요
  ```
- 배포(GitHub Pages): 저장소 **Settings > Secrets and variables > Actions**에 동일한 이름으로
  시크릿 등록
  - `VITE_SHEET_IMPORT_URL`
  - `VITE_SHEET_IMPORT_TOKEN`

이후 동작 방식(가져오기 버튼, 중복 등록 방지 등)은 [sheet-import-setup.md](./sheet-import-setup.md)의
"5. 공통 사항"과 동일합니다.

## 7. 새 기수가 시작되면 할 일

1. 새 기수 시트에 최소 **보기 권한**을 받아 링크를 열어봅니다.
2. Apps Script 코드에서:
   - `CURRENT_COHORT_SPREADSHEET_ID`를 새 기수 시트 ID로 교체.
   - `ALL_COHORT_SPREADSHEET_IDS` 배열에 새 기수 시트 ID를 추가.
3. 저장 후 다시 배포할 필요는 없습니다 (같은 배포 URL이 새 코드를 그대로 반영합니다).
4. `동기화 > 전체이력 새로고침` 메뉴로 한 번 수동 실행해 새 기수 데이터가 들어오는지 확인합니다.

## 8. 보안 참고

웹 앱 URL과 토큰이 빌드된 프론트엔드 코드에 그대로 포함되는 구조는
[sheet-import-setup.md](./sheet-import-setup.md)의 "보안 참고" 항목과 동일합니다. 추가로, 이
스크립트는 내 계정의 "보기 권한"으로 원본 시트들을 열어보는 방식이므로, 원본 시트의 공유
설정이 바뀌어 내 계정의 보기 권한이 회수되면 그 시트에 대한 조회가 실패합니다(실행 로그에서
확인 가능).
