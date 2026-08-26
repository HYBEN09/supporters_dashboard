import { ISSUE_FORM_SERVICE_OPTIONS } from "../data/filterOptions";
import type { IssueFormValues, IssueItem, Platform, ServiceName } from "../types/issue";

const SHEET_IMPORT_URL = (
  import.meta.env.VITE_SHEET_IMPORT_URL as string | undefined
)?.trim();
const SHEET_IMPORT_TOKEN = (
  import.meta.env.VITE_SHEET_IMPORT_TOKEN as string | undefined
)?.trim();

export const isSheetImportConfigured = Boolean(
  SHEET_IMPORT_URL && SHEET_IMPORT_TOKEN,
);

export type SheetReportRow = {
  timestamp: string;
  authorName: string;
  serviceName: string;
  platform: string;
  path: string;
  description: string;
  attachment: string;
  supporterJiraUrl?: string;
  serviceJiraUrl?: string;
};

export async function fetchSheetReportRows(): Promise<SheetReportRow[]> {
  if (!SHEET_IMPORT_URL || !SHEET_IMPORT_TOKEN) {
    throw new Error("구글 시트 연동이 설정되지 않았습니다.");
  }

  const url = new URL(SHEET_IMPORT_URL);
  url.searchParams.set("token", SHEET_IMPORT_TOKEN);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("구글 시트 응답을 가져오지 못했습니다.");
  }

  const payload = (await response.json()) as
    | { rows: SheetReportRow[] }
    | { error: string };

  if ("error" in payload) {
    throw new Error("구글 시트 인증에 실패했습니다.");
  }

  return payload.rows;
}

function parseDelimitedRows(text: string, delimiter = "\t"): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (char === delimiter) {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }

    if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") {
        i += 1;
      }
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim().length > 0));
}

export function parseSheetRowsFromPastedText(text: string): SheetReportRow[] {
  return parseDelimitedRows(text)
    .map((cells) => ({
      timestamp: (cells[0] ?? "").trim(),
      authorName: (cells[2] ?? "").trim(),
      serviceName: (cells[3] ?? "").trim(),
      platform: (cells[4] ?? "").trim(),
      path: (cells[5] ?? "").trim(),
      description: (cells[6] ?? "").trim(),
      attachment: (cells[7] ?? "").trim(),
    }))
    .filter((row) => /^\d{4}/.test(row.timestamp));
}

// 이 시점 이전 제보는 전부 수동으로 이미 등록을 마쳤다고 보고, 가져오기 대상에서
// 제외합니다. 자동화는 이 시점 이후 새로 들어오는 제보부터 적용됩니다. 다음 기수로
// 넘어가거나 시작 시점을 조정해야 하면 이 값만 바꾸면 됩니다.
const SHEET_IMPORT_CUTOFF_TIMESTAMP = "2026-08-01T00:00:00";

// 시트의 원본 타임스탬프(초 단위)를 이슈에 저장해두고, 그 값으로 중복 여부를 판단합니다.
// 등록일/작성자/서비스명/플랫폼 조합은 같은 사람이 같은 날 같은 서비스로 여러 건을
// 제보하는 경우가 실제로 흔해서 오탐이 나므로 쓰지 않습니다. 원본 시트 타임스탬프는
// 제보 하나마다 고유해서 정확하게 구분됩니다.
export function filterUnimportedRows(
  rows: SheetReportRow[],
  existingIssues: IssueItem[],
): SheetReportRow[] {
  const importedTimestamps = new Set(
    existingIssues
      .map((issue) => issue.sheetTimestamp)
      .filter((timestamp): timestamp is string => Boolean(timestamp)),
  );

  return rows
    .filter((row) => row.timestamp >= SHEET_IMPORT_CUTOFF_TIMESTAMP)
    .filter((row) => row.timestamp && !importedTimestamps.has(row.timestamp))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function parseTimestampToDate(timestamp: string): string {
  const match = timestamp.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const koreanMatch = timestamp.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);

  if (koreanMatch) {
    const [, year, month, day] = koreanMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return new Date().toISOString().slice(0, 10);
}

function normalizeServiceName(raw: string): ServiceName | "" {
  const trimmed = raw.trim();
  const match = ISSUE_FORM_SERVICE_OPTIONS.find((option) => option === trimmed);

  return match ?? "";
}

function normalizePlatform(raw: string): Platform {
  if (/iOS|아이폰/i.test(raw)) return "iOS";
  if (/Android|안드로이드|갤럭시/i.test(raw)) return "Android";
  if (/Windows|윈도우|컴퓨터|PC/i.test(raw)) return "WIN";
  if (/Mac|맥/i.test(raw)) return "Mac";
  if (/Watch|워치/i.test(raw)) return "Watch";
  if (/한소네/.test(raw)) return "점자정보단말기 한소네6";
  if (!raw.trim()) return "선택 안 함";

  return "기타";
}

export function sheetRowToFormValues(
  row: SheetReportRow,
  defaults: IssueFormValues,
): IssueFormValues {
  const serviceJiraUrls = (row.serviceJiraUrl ?? "")
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => ({ value }));

  return {
    ...defaults,
    registeredAt: parseTimestampToDate(row.timestamp),
    authorName: row.authorName.trim(),
    serviceName: normalizeServiceName(row.serviceName),
    platform: normalizePlatform(row.platform),
    issueStatus: "보류",
    supporterJiraUrl: row.supporterJiraUrl?.trim() ?? "",
    serviceJiraUrls:
      serviceJiraUrls.length > 0 ? serviceJiraUrls : defaults.serviceJiraUrls,
  };
}

// 검토 없이 여러 건을 한꺼번에 등록할 때 쓰는 변환 함수. 서비스명이 드롭다운과 안 맞으면
// 원문을 메모에 남겨 나중에 찾아 고칠 수 있게 합니다.
export function sheetRowToIssueItem(
  row: SheetReportRow,
): Omit<IssueItem, "id"> {
  const normalizedService = normalizeServiceName(row.serviceName);

  return {
    registeredAt: parseTimestampToDate(row.timestamp),
    authorName: row.authorName.trim(),
    serviceName: normalizedService || "카카오톡",
    platform: normalizePlatform(row.platform),
    path: "-",
    issueStatus: "보류",
    fixStatus: "-",
    memo: normalizedService
      ? undefined
      : `[시트 서비스명 원문] ${row.serviceName.trim()} (직접 선택 필요)`,
    sheetTimestamp: row.timestamp.trim(),
    supporterJiraUrl: row.supporterJiraUrl?.trim() || undefined,
    serviceJiraUrl: row.serviceJiraUrl?.trim() || undefined,
  };
}
