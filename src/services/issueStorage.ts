import type { IssueItem } from "../types/issue";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;
const SUPABASE_REST_PATH = "/rest/v1/supporter_issues";

type IssueRow = {
  id: string;
  registered_at: string;
  author_name: string;
  service_name: IssueItem["serviceName"];
  platform: IssueItem["platform"];
  path: string;
  issue_status: IssueItem["issueStatus"];
  fix_status: IssueItem["fixStatus"];
  not_issue_reason: IssueItem["notIssueReason"] | null;
  jira_key: string | null;
  supporter_jira_url: string | null;
  service_jira_url: string | null;
  memo: string | null;
};

export function isRemoteIssueStorageEnabled() {
  return Boolean(getSupabaseBaseUrl() && SUPABASE_ANON_KEY);
}

function toIssueItem(row: IssueRow): IssueItem {
  return {
    id: row.id,
    registeredAt: row.registered_at,
    authorName: row.author_name,
    serviceName: row.service_name,
    platform: row.platform,
    path: row.path,
    issueStatus: row.issue_status,
    fixStatus: row.fix_status,
    notIssueReason: row.not_issue_reason ?? undefined,
    jiraKey: row.jira_key ?? undefined,
    supporterJiraUrl: row.supporter_jira_url ?? undefined,
    serviceJiraUrl: row.service_jira_url ?? undefined,
    memo: row.memo ?? undefined,
  };
}

function toIssueRow(issue: IssueItem): IssueRow {
  return {
    id: issue.id,
    registered_at: issue.registeredAt,
    author_name: issue.authorName,
    service_name: issue.serviceName,
    platform: issue.platform,
    path: issue.path,
    issue_status: issue.issueStatus,
    fix_status: issue.fixStatus,
    not_issue_reason: issue.notIssueReason ?? null,
    jira_key: issue.jiraKey ?? null,
    supporter_jira_url: issue.supporterJiraUrl ?? null,
    service_jira_url: issue.serviceJiraUrl ?? null,
    memo: issue.memo ?? null,
  };
}

function getSupabaseEndpoint(path = "") {
  const baseUrl = getSupabaseBaseUrl();

  if (!baseUrl) {
    throw new Error(
      "VITE_SUPABASE_URL must be a full URL like https://your-project.supabase.co.",
    );
  }

  return `${baseUrl}${SUPABASE_REST_PATH}${path}`;
}

function getSupabaseBaseUrl() {
  const url = SUPABASE_URL?.trim()
    .replace(/\/$/, "")
    .replace(/\/rest\/v1$/, "");

  if (!url) {
    return "";
  }

  if (!url.startsWith("https://")) {
    console.error(
      "VITE_SUPABASE_URL must start with https://. Use the Supabase Project URL, not the Project ID.",
    );
    return "";
  }

  return url;
}

async function requestSupabase<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!SUPABASE_ANON_KEY) {
    throw new Error("Supabase anon key is missing.");
  }

  const response = await fetch(getSupabaseEndpoint(path), {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to request issue storage.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();

  if (!responseText) {
    return undefined as T;
  }

  return JSON.parse(responseText) as T;
}

export async function loadIssuesFromStorage() {
  if (!isRemoteIssueStorageEnabled()) {
    throw new Error("Supabase storage is not configured.");
  }

  const rows = await requestSupabase<IssueRow[]>(
    "?select=*&order=registered_at.desc,id.desc",
  );

  return rows.map(toIssueItem);
}

export async function saveIssueToStorage(issue: IssueItem) {
  if (!isRemoteIssueStorageEnabled()) {
    throw new Error("Supabase storage is not configured.");
  }

  await requestSupabase<IssueRow[]>("", {
    body: JSON.stringify(toIssueRow(issue)),
    method: "POST",
    headers: {
      Prefer: "return=minimal",
    },
  });
}

export async function updateIssueInStorage(
  id: string,
  nextIssues: IssueItem[],
) {
  if (!isRemoteIssueStorageEnabled()) {
    throw new Error("Supabase storage is not configured.");
  }

  const currentIssue = nextIssues.find((issue) => issue.id === id);

  if (!currentIssue) {
    return;
  }

  await requestSupabase<void>(`?id=eq.${encodeURIComponent(id)}`, {
    body: JSON.stringify(toIssueRow(currentIssue)),
    method: "PATCH",
    headers: {
      Prefer: "return=minimal",
    },
  });
}

export async function deleteIssueFromStorage(id: string) {
  if (!isRemoteIssueStorageEnabled()) {
    throw new Error("Supabase storage is not configured.");
  }

  await requestSupabase<void>(`?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
