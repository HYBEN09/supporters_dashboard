import type { IssueItem } from "../types/issue";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const TABLE_NAME = "supporter_issues";

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
  return isSupabaseConfigured;
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

function requireRemoteIssueStorage() {
  if (!isRemoteIssueStorageEnabled()) {
    throw new Error("Supabase storage is not configured.");
  }
}

export async function loadIssuesFromStorage() {
  requireRemoteIssueStorage();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("registered_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as IssueRow[]).map(toIssueItem);
}

export async function saveIssueToStorage(issue: IssueItem) {
  requireRemoteIssueStorage();

  const { error } = await supabase.from(TABLE_NAME).insert(toIssueRow(issue));

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateIssueInStorage(
  id: string,
  nextIssues: IssueItem[],
) {
  requireRemoteIssueStorage();

  const currentIssue = nextIssues.find((issue) => issue.id === id);

  if (!currentIssue) {
    return;
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .update(toIssueRow(currentIssue))
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteIssueFromStorage(id: string) {
  requireRemoteIssueStorage();

  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
