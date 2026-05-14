import type { IssueItem } from "../types/issue";

const GOOGLE_SHEETS_WEBHOOK_URL = import.meta.env
  .VITE_GOOGLE_SHEETS_WEBHOOK_URL as string | undefined;

type GoogleSheetsIssueRow = {
  id: string;
  registeredAt: string;
  authorName: string;
  serviceName: IssueItem["serviceName"];
  platform: IssueItem["platform"];
  issueStatus: IssueItem["issueStatus"];
  fixStatus: IssueItem["fixStatus"];
  notIssueReason: string;
  supporterJiraUrl: string;
  serviceJiraUrl: string;
  memo: string;
};

type GoogleSheetsSyncPayload = {
  issues: GoogleSheetsIssueRow[];
  syncedAt: string;
};

function getGoogleSheetsWebhookUrl() {
  const url = GOOGLE_SHEETS_WEBHOOK_URL?.trim();

  if (!url) {
    return "";
  }

  if (!url.startsWith("https://")) {
    console.error(
      "VITE_GOOGLE_SHEETS_WEBHOOK_URL must start with https://.",
    );
    return "";
  }

  return url;
}

function toGoogleSheetsIssueRow(issue: IssueItem): GoogleSheetsIssueRow {
  return {
    id: issue.id,
    registeredAt: issue.registeredAt,
    authorName: issue.authorName,
    serviceName: issue.serviceName,
    platform: issue.platform,
    issueStatus: issue.issueStatus,
    fixStatus: issue.fixStatus,
    notIssueReason: issue.notIssueReason ?? "",
    supporterJiraUrl: issue.supporterJiraUrl ?? "",
    serviceJiraUrl: issue.serviceJiraUrl ?? "",
    memo: issue.memo ?? "",
  };
}

export function isGoogleSheetsSyncEnabled() {
  return Boolean(getGoogleSheetsWebhookUrl());
}

export async function syncIssuesToGoogleSheets(issues: IssueItem[]) {
  const webhookUrl = getGoogleSheetsWebhookUrl();

  if (!webhookUrl) {
    return;
  }

  const payload: GoogleSheetsSyncPayload = {
    issues: issues.map(toGoogleSheetsIssueRow),
    syncedAt: new Date().toISOString(),
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to sync Google Sheets.");
  }
}
