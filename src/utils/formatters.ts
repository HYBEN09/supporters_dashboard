import type { IssueItem } from "../types/issue";

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatDate(value: string) {
  return value.replaceAll("-", ".");
}

export function createJiraUrl(jiraKey?: string) {
  if (!jiraKey) {
    return "";
  }

  return jiraKey.startsWith("http")
    ? jiraKey
    : `https://jira.example.com/browse/${jiraKey}`;
}

export function createServiceJiraUrl(jiraKey?: string) {
  if (!jiraKey) {
    return "";
  }

  return jiraKey.startsWith("http")
    ? jiraKey
    : `https://jira.daumkakao.com/browse/${jiraKey}`;
}

export function getIssueJiraLinks(issue: IssueItem) {
  const links = [];

  if (issue.supporterJiraUrl || issue.jiraKey) {
    links.push({
      label: "서포터즈",
      url: createJiraUrl(issue.supporterJiraUrl ?? issue.jiraKey),
      text: issue.supporterJiraUrl ?? issue.jiraKey ?? "",
    });
  }

  if (issue.serviceJiraUrl || issue.jiraKey) {
    links.push({
      label: "서비스 전달",
      url: createServiceJiraUrl(issue.serviceJiraUrl ?? issue.jiraKey),
      text: issue.serviceJiraUrl ?? issue.jiraKey ?? "",
    });
  }

  return links;
}
