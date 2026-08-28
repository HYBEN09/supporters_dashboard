import type { IssueItem } from "../types/issue";

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatDate(value: string) {
  return value.replaceAll("-", ".");
}

// 지라 티켓 주소의 공통 앞부분. 서포터즈 지라와 서비스 전달 지라가 같은 서버를 쓰므로
// 하나로 관리합니다. 예전에는 두 함수가 각자 주소를 들고 있었고 서포터즈 쪽만
// jira.example.com(존재하지 않는 주소)이라, 티켓 키만 입력하면 링크가 죽어 있었습니다.
const JIRA_BROWSE_BASE_URL = "https://jira.daumkakao.com/browse/";

// 전체 URL이면 그대로 쓰고, 티켓 키만 있으면 주소를 붙여 완성합니다.
export function createJiraUrl(jiraKey?: string) {
  const value = jiraKey?.trim();

  if (!value) {
    return "";
  }

  return value.startsWith("http") ? value : `${JIRA_BROWSE_BASE_URL}${value}`;
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

export function getJiraIssueNumber(value?: string) {
  const issueKey = getJiraIssueKey(value);
  const issueNumberMatch = issueKey.match(/-(\d+)$/);

  return issueNumberMatch ? Number(issueNumberMatch[1]) : null;
}

export function getServiceJiraUrls(value?: string) {
  return (value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// 각 링크에는 목록 안에서 유일한 id를 붙입니다. 서포터즈 지라와 서비스 전달 지라에 같은
// 티켓이 들어가는 경우가 실제로 있어서(예: ASUPPORTERS-374), 라벨이나 URL로 key를 만들면
// 중복돼 React가 링크 하나를 빠뜨리거나 중복 렌더링할 수 있습니다.
export function getIssueJiraLinks(issue: IssueItem) {
  const links = [];

  if (issue.supporterJiraUrl || issue.jiraKey) {
    const jiraValue = issue.supporterJiraUrl ?? issue.jiraKey ?? "";

    links.push({
      id: "supporter",
      kind: "supporter" as const,
      label: getJiraIssueKey(jiraValue) || "서포터즈",
      url: createJiraUrl(jiraValue),
      text: jiraValue,
    });
  }

  const serviceJiraUrls = getServiceJiraUrls(issue.serviceJiraUrl);

  if (serviceJiraUrls.length > 0) {
    serviceJiraUrls.forEach((jiraValue, index) => {
      links.push({
        id: `service-${index}`,
        kind: "service" as const,
        label: getJiraIssueKey(jiraValue) || "서비스 전달",
        url: createJiraUrl(jiraValue),
        text: jiraValue,
      });
    });
  } else if (issue.jiraKey) {
    links.push({
      id: "service-0",
      kind: "service" as const,
      label: getJiraIssueKey(issue.jiraKey) || "서비스 전달",
      url: createJiraUrl(issue.jiraKey),
      text: issue.jiraKey,
    });
  }

  return links;
}
