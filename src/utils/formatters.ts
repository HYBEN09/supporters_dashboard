export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatDate(value: string) {
  return value.replaceAll("-", ".");
}

export function createJiraUrl(jiraKey?: string) {
  return jiraKey ? `https://jira.example.com/browse/${jiraKey}` : "";
}
