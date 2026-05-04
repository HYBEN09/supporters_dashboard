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

export function getJiraIssueKey(value?: string) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return "";
  }

  const issueKeyMatch = normalizedValue.match(/[A-Z][A-Z0-9]+-\d+/i);

  if (issueKeyMatch) {
    return issueKeyMatch[0].toUpperCase();
  }

  return normalizedValue;
}

export function getIssueJiraLinks(issue: IssueItem) {
  const links = [];

  if (issue.supporterJiraUrl || issue.jiraKey) {
    const jiraValue = issue.supporterJiraUrl ?? issue.jiraKey ?? "";

    links.push({
      label: getJiraIssueKey(jiraValue) || "서포터즈",
      url: createJiraUrl(jiraValue),
      text: jiraValue,
    });
  }

  if (issue.serviceJiraUrl || issue.jiraKey) {
    const jiraValue = issue.serviceJiraUrl ?? issue.jiraKey ?? "";

    links.push({
      label: getJiraIssueKey(jiraValue) || "서비스 전달",
      url: createServiceJiraUrl(jiraValue),
      text: jiraValue,
    });
  }

  return links;
}
