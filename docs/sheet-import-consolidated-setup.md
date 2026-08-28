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

### 월별 정리 탭의 지라 링크 자동 반영

원본(폼 연결) 탭에는 등록일/작성자/서비스명/플랫폼만 있고, 지라 링크는 담당자가 검토 후
**월별 정리 탭**(`2608월` 등)에 직접 채워 넣습니다. `doGet`은 원본 탭에서 제보를 읽어올 때,
각 제보의 타임스탬프로 소속 월(예: `2608월`)을 계산해서 **같은 원본 시트 안의 그 월별 정리
탭을 같이 열어보고**, 같은 타임스탬프를 가진 열의 "서포터즈 지라 링크" / "전달(한/할) 지라
링크" 값을 찾아 붙여서 돌려줍니다. 아직 월별 정리 탭에 옮겨지지 않았거나 지라 링크가 비어있는
제보는 그냥 빈 값으로 돌아옵니다 (등록 자체는 그대로 진행되고, 이슈 여부는 여전히 "보류"로
유지됩니다).

이 매칭은 두 가지를 전제로 합니다.
- 월별 정리 탭 이름이 `YYMM월` 규칙(타임스탬프 연도/월 두 자리, 예: `2608월`)을 따를 것.
- 각 탭 A열에 `타임스탬프`, `서포터즈 지라 링크`, `전달...지라 링크`라는 글자가 포함된 라벨
  행이 있을 것 (정확한 행 번호나 "전달한"/"전달할" 같은 토씨 차이는 상관없이 라벨 텍스트로
  찾습니다 — 실제로 확인해보니 달마다 행 구성이 조금씩 달랐습니다).

### 이슈 여부 자동 분류 기준

지라 두 칸의 상태로 이슈 여부를 추정해서 채웁니다 (`src/services/sheetImport.ts`의
`classifyIssueStatus`).

| 서포터즈 지라 | 전달 지라 | 이슈 여부 | 수정 여부 |
| --- | --- | --- | --- |
| 없음 | (상관없음) | 보류 | - |
| 있음 | 있음 | 이슈 | 수정 필요 |
| 있음 | `이슈 아님` / `아님` / `-` 등의 표기 | 이슈 아님 | - |
| 있음 | 비어 있음 | 보류 | - |

- "이슈 아님"은 링크가 아니라 **글자**이므로, 앱스크립트가 지라 칸의 **원문 텍스트**
  (`supporterJiraText` / `serviceJiraText`)도 같이 넘겨야 이 분류가 동작합니다. 링크만
  넘기면 "빈칸"과 "이슈 아님이라고 적힌 칸"을 구분할 수 없습니다.
- `이슈 아님`으로 분류돼도 **이슈 아님 사유는 시트에 없어서 비워둡니다.** 등록 화면에서
  직접 선택해주세요.
- 자동 분류는 어디까지나 추정이므로, 등록 전에 화면에서 언제든 고칠 수 있습니다.

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

// 월별 정리 탭에 지라 키만 텍스트로 적혀 있을 때(하이퍼링크가 아닐 때) 붙일 기본 주소.
const JIRA_BROWSE_BASE_URL = "https://jira.daumkakao.com/browse/";

// 타임스탬프 셀 값을 항상 같은 형식("yyyy-MM-ddTHH:mm:ss")의 문자열로 만듭니다.
// 원본 탭은 보통 날짜값이지만, 월별 정리 탭은 값을 옮겨 적는 과정에서 텍스트
// (예: "2026. 8. 9 오후 6:45:05")로 들어있는 경우가 있어 양쪽을 모두 처리해야
// 원본 ↔ 월별 탭 매칭이 성립합니다.
function normalizeTimestamp_(raw, timezone) {
  if (raw instanceof Date) {
    return Utilities.formatDate(raw, timezone, "yyyy-MM-dd'T'HH:mm:ss");
  }

  const text = String(raw).trim();

  if (!text) {
    return "";
  }

  // 이미 "2026-08-09T18:45:05" 또는 "2026-08-09 18:45:05" 형태
  const isoMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );

  if (isoMatch) {
    return (
      isoMatch[1] +
      "-" +
      isoMatch[2] +
      "-" +
      isoMatch[3] +
      "T" +
      ("0" + isoMatch[4]).slice(-2) +
      ":" +
      isoMatch[5] +
      ":" +
      (isoMatch[6] || "00")
    );
  }

  // 한국 로케일 표시 형태 "2026. 8. 9 오후 6:45:05"
  const koreanMatch = text.match(
    /^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(오전|오후)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );

  if (koreanMatch) {
    let hour = Number(koreanMatch[5]);

    if (koreanMatch[4] === "오후" && hour < 12) {
      hour += 12;
    }

    if (koreanMatch[4] === "오전" && hour === 12) {
      hour = 0;
    }

    return (
      koreanMatch[1] +
      "-" +
      ("0" + koreanMatch[2]).slice(-2) +
      "-" +
      ("0" + koreanMatch[3]).slice(-2) +
      "T" +
      ("0" + hour).slice(-2) +
      ":" +
      koreanMatch[6] +
      ":" +
      (koreanMatch[7] || "00")
    );
  }

  return text;
}

function rowToObject_(row, timezone) {
  const timestamp = normalizeTimestamp_(row[0], timezone);

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

// 셀에 보이는 그대로의 글자를 돌려줍니다 (링크든 일반 텍스트든).
function getCellText_(range) {
  return String(range.getDisplayValue() || "").trim();
}

// 월별 정리 탭(예: "2608월")의 지라 링크 셀에서 값을 뽑아냅니다.
// 실제 시트를 확인해보니 이 칸에는 두 가지 형태가 섞여 있습니다.
//   1) 진짜 하이퍼링크 — 짧은 코드만 보이고 URL이 걸린 형태 (예: ASUPPORTERS-375)
//   2) 링크 없이 지라 키만 타이핑된 형태 — 파란 밑줄 "서식"만 입혀져 링크처럼 보이지만
//      실제 링크는 없음 (예: GIFTACCESS-2418)
// 1번만 처리하면 2번이 전부 빈 값으로 누락되므로, 링크가 없으면 셀 텍스트에서 지라 키처럼
// 생긴 부분을 찾아 씁니다 (대시보드가 지라 키만 있어도 링크로 만들어 줍니다).
// "이슈 아님"처럼 지라 키가 아닌 텍스트는 빈 문자열을 돌려줍니다.
function extractLinkFromCell_(range) {
  const richText = range.getRichTextValue();

  if (richText) {
    const wholeCellLink = richText.getLinkUrl();

    if (wholeCellLink) {
      return wholeCellLink;
    }

    // 셀 안에 링크가 여러 개 섞여 있는 경우(여러 지라 티켓을 한 셀에 적은 경우) 전부 모읍니다.
    const links = richText
      .getRuns()
      .map(function (run) {
        return run.getLinkUrl();
      })
      .filter(Boolean);

    if (links.length > 0) {
      return links.join("\n");
    }
  }

  // 하이퍼링크가 전혀 없으면 텍스트에서 지라 키를 찾아 전체 URL로 만들어 줍니다.
  // (키만 넘기면 대시보드가 붙이는 기본 도메인이 실제와 달라 링크가 깨질 수 있어서,
  //  여기서 확실하게 전체 주소로 만들어 보냅니다.)
  const text = String(range.getDisplayValue() || "").trim();
  const keys = text.match(/[A-Z][A-Z0-9]*-\d+/gi);

  if (!keys) {
    return "";
  }

  return keys
    .map(function (key) {
      return JIRA_BROWSE_BASE_URL + key.toUpperCase();
    })
    .join("\n");
}

// 시트 A열(라벨 열)에서 원하는 행을 찾습니다. 월별 정리 탭은 달마다 행 구성이 조금씩
// 달라질 수 있어서("이메일 주소" 행이 있다 없다 하는 식), 행 번호를 고정하지 않고 라벨
// 텍스트로 찾습니다.
function findRowIndexByLabel_(values, matchesLabel) {
  for (let i = 0; i < values.length; i++) {
    const label = values[i][0] ? String(values[i][0]) : "";

    if (matchesLabel(label)) {
      return i;
    }
  }

  return -1;
}

// 제보 하나의 타임스탬프로 소속 월(예: "2608월")을 계산합니다. 월별 정리 탭 이름 규칙과
// 반드시 일치해야 합니다.
function getMonthTabName_(timestamp, timezone) {
  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return null;
  }

  return Utilities.formatDate(date, timezone, "yyMM") + "월";
}

// 월별 정리 탭 하나를 통째로 읽어서 "타임스탬프 → 지라 링크" 조회표를 만듭니다.
// 월별 정리 탭은 원본 탭과 반대로 행이 항목, 열이 제보 1건씩인 구조입니다.
function buildJiraLookupForTab_(spreadsheet, tabName) {
  const lookup = {};
  const sheet = spreadsheet.getSheetByName(tabName);

  if (!sheet) {
    return lookup;
  }

  const values = sheet.getDataRange().getValues();
  const timestampRow = findRowIndexByLabel_(values, function (label) {
    return label.indexOf("타임스탬프") !== -1;
  });

  if (timestampRow === -1) {
    return lookup;
  }

  const supporterJiraRow = findRowIndexByLabel_(values, function (label) {
    return label.indexOf("서포터즈") !== -1 && /지라|jira/i.test(label);
  });
  const serviceJiraRow = findRowIndexByLabel_(values, function (label) {
    return label.indexOf("전달") !== -1 && /지라|jira/i.test(label);
  });
  const timezone = spreadsheet.getSpreadsheetTimeZone();
  const columnCount = values[timestampRow].length;

  for (let col = 1; col < columnCount; col++) {
    const rawTimestamp = values[timestampRow][col];

    if (!rawTimestamp) {
      continue;
    }

    const timestamp = normalizeTimestamp_(rawTimestamp, timezone);

    if (!timestamp) {
      continue;
    }

    const supporterCell =
      supporterJiraRow !== -1
        ? sheet.getRange(supporterJiraRow + 1, col + 1)
        : null;
    const serviceCell =
      serviceJiraRow !== -1 ? sheet.getRange(serviceJiraRow + 1, col + 1) : null;

    lookup[timestamp] = {
      supporterJiraUrl: supporterCell ? extractLinkFromCell_(supporterCell) : "",
      serviceJiraUrl: serviceCell ? extractLinkFromCell_(serviceCell) : "",
      // 링크가 아닌 원문 텍스트도 같이 넘깁니다. 전달 칸에 "이슈 아님", "-" 처럼 적어두는
      // 경우가 있어서, 대시보드가 이슈 여부를 자동 분류하려면 이 값이 필요합니다.
      supporterJiraText: supporterCell ? getCellText_(supporterCell) : "",
      serviceJiraText: serviceCell ? getCellText_(serviceCell) : "",
    };
  }

  return lookup;
}

// 대시보드 "가져오기" 버튼이 호출하는 엔드포인트. 현재 기수 시트를 실시간으로 읽어 돌려주고,
// 각 제보의 소속 월별 정리 탭에서 지라 링크가 채워져 있으면 같이 붙여서 돌려줍니다.
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

  // 같은 월별 탭을 제보마다 반복해서 열어보지 않도록, 요청 하나 안에서만 캐시합니다.
  const jiraLookupCache = {};

  rows.forEach(function (row) {
    const tabName = getMonthTabName_(row.timestamp, timezone);

    if (!tabName) {
      row.supporterJiraUrl = "";
      row.serviceJiraUrl = "";
      row.supporterJiraText = "";
      row.serviceJiraText = "";
      return;
    }

    if (!(tabName in jiraLookupCache)) {
      jiraLookupCache[tabName] = buildJiraLookupForTab_(spreadsheet, tabName);
    }

    const jira = jiraLookupCache[tabName][row.timestamp];

    row.supporterJiraUrl = jira ? jira.supporterJiraUrl : "";
    row.serviceJiraUrl = jira ? jira.serviceJiraUrl : "";
    row.supporterJiraText = jira ? jira.supporterJiraText : "";
    row.serviceJiraText = jira ? jira.serviceJiraText : "";
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

// 지라 링크 매칭이 되는지 확인용. Apps Script 편집기에서 이 함수를 선택해 실행하고
// "실행 로그"를 보면, 월별 탭을 제대로 찾았는지 / 타임스탬프가 매칭됐는지 알 수 있습니다.
function debugJiraLookup() {
  const spreadsheet = SpreadsheetApp.openById(CURRENT_COHORT_SPREADSHEET_ID);
  const timezone = spreadsheet.getSpreadsheetTimeZone();
  const sheet = findLiveResponseSheet_(spreadsheet);

  if (!sheet) {
    Logger.log("폼이 연결된 원본 탭을 찾지 못했습니다.");
    return;
  }

  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1).filter(function (row) {
    return row[0];
  });
  const recent = rows.slice(-5); // 최근 5건만 확인

  recent.forEach(function (row) {
    const timestamp = normalizeTimestamp_(row[0], timezone);
    const tabName = getMonthTabName_(timestamp, timezone);
    const monthSheet = tabName ? spreadsheet.getSheetByName(tabName) : null;

    if (!monthSheet) {
      Logger.log(
        timestamp + " → 월별 탭 '" + tabName + "' 없음 (탭 이름 규칙 확인 필요)",
      );
      return;
    }

    const lookup = buildJiraLookupForTab_(spreadsheet, tabName);
    const jira = lookup[timestamp];

    if (!jira) {
      Logger.log(
        timestamp +
          " → '" +
          tabName +
          "' 탭에 이 타임스탬프가 없음. 탭에 있는 값들: " +
          Object.keys(lookup).join(", "),
      );
      return;
    }

    Logger.log(
      timestamp +
        " → 서포터즈: " +
        (jira.supporterJiraUrl || "(링크없음)") +
        " [원문: " +
        (jira.supporterJiraText || "(빈칸)") +
        "] / 전달: " +
        (jira.serviceJiraUrl || "(링크없음)") +
        " [원문: " +
        (jira.serviceJiraText || "(빈칸)") +
        "]",
    );
  });
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

## 5. 웹 앱으로 배포

> **⚠️ 코드를 고쳤는데 대시보드에 반영이 안 될 때 (실제로 겪은 문제)**
>
> Apps Script는 **저장만 해서는 웹 앱에 반영되지 않습니다.** 배포를 다시 해야 하고, 여기서
> 두 방식의 차이가 중요합니다.
>
> - **배포 관리 > 편집(연필) > 버전을 "새 버전"으로 > 배포**: **URL이 그대로 유지**되면서 새
>   코드가 반영됩니다. 이미 "모든 사용자" 접근으로 잘 돌아가는 배포가 있으면 **이 방법을
>   먼저 쓰세요.** 환경변수를 고칠 필요가 없습니다.
> - **배포 > 새 배포**: **URL이 새로 생깁니다.** 기존 URL은 계속 예전 코드를 서비스하므로,
>   이 방법을 쓰면 `.env.local`과 GitHub Actions 시크릿의 `VITE_SHEET_IMPORT_URL`을 **반드시
>   새 URL로 바꿔야** 합니다. 안 바꾸면 코드를 고쳐도 대시보드는 계속 옛 응답을 받습니다.
>
> 반영됐는지 빠르게 확인하려면 브라우저에서 `웹앱URL?token=내토큰`을 열어보고 응답 JSON에
> `supporterJiraUrl` 필드가 보이는지 확인하세요. 필드 자체가 없으면 아직 예전 코드입니다.
>
> **되도록 배포는 하나만 유지하세요.** "새 배포"를 계속 만들면 URL이 여러 개가 되고, 각
> 배포가 서로 다른 코드 버전에 고정됩니다. 실제로 이 문제를 두 번 겪었습니다 — 로컬
> `.env.local`만 새 URL로 바꾸고 GitHub 시크릿은 예전 URL로 남아 있어서, **로컬에서는
> 지라 링크가 들어오는데 배포 사이트에서는 안 들어오는** 상황이 발생했습니다.
>
> 로컬과 배포본이 다르게 동작하면 이 순서로 확인하세요.
> 1. 배포 사이트의 JS 번들에 박힌 `script.google.com/macros/s/.../exec` 주소가
>    `.env.local`의 주소와 같은지 비교
> 2. 다르면 **GitHub 저장소 Settings > Secrets and variables > Actions**의
>    `VITE_SHEET_IMPORT_URL`을 현재 쓰는 주소로 갱신하고 워크플로를 다시 실행
> 3. 또는 (더 권장) Apps Script의 **배포 관리**에서 그 예전 배포를 최신 버전으로 갱신해
>    URL을 그대로 두고 코드만 최신으로 맞추기

### 처음 배포하는 경우 (반드시 "새 배포"로)

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
3. 저장한 뒤 **반드시 재배포해야 합니다** — 저장만으로는 웹 앱(`/exec` URL)에 반영되지 않습니다.
   `배포 관리 > 편집(연필) > 버전: 새 버전 > 배포`로 하면 URL이 유지된 채 새 코드가 반영됩니다.
   (자세한 내용은 위 5번의 경고 상자 참고. 이 문서에 예전에 "재배포 불필요"라고 적혀 있었는데,
   실제로는 코드가 반영되지 않아 대시보드가 계속 옛 응답을 받는 문제가 있었습니다.)
4. `동기화 > 전체이력 새로고침` 메뉴로 한 번 수동 실행해 새 기수 데이터가 들어오는지 확인합니다.
5. 통합 시트의 `사용방법` 탭에도 같은 내용(재배포 필요)이 반영되어 있는지 확인해주세요 —
   시트 안 안내문에 "재배포 불필요"라고 적혀 있으면 같이 고쳐야 합니다.

## 8. 보안 참고

웹 앱 URL과 토큰이 빌드된 프론트엔드 코드에 그대로 포함되는 구조는
[sheet-import-setup.md](./sheet-import-setup.md)의 "보안 참고" 항목과 동일합니다. 추가로, 이
스크립트는 내 계정의 "보기 권한"으로 원본 시트들을 열어보는 방식이므로, 원본 시트의 공유
설정이 바뀌어 내 계정의 보기 권한이 회수되면 그 시트에 대한 조회가 실패합니다(실행 로그에서
확인 가능).
