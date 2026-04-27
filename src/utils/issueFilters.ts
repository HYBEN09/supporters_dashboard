import { PERIOD_OPTIONS } from "../data/filterOptions";
import type { IssueFilters, IssueItem } from "../types/issue";

export const DEFAULT_FILTERS: IssueFilters = {
  keyword: "",
  periodId: PERIOD_OPTIONS[1].id,
  serviceName: "전체",
  platform: "전체",
  issueStatus: "전체",
  fixStatus: "전체",
};

export function getPeriodById(periodId: string) {
  return (
    PERIOD_OPTIONS.find((period) => period.id === periodId) ?? PERIOD_OPTIONS[1]
  );
}

export function isWithinPeriod(registeredAt: string, periodId: string) {
  const period = getPeriodById(periodId);
  return registeredAt >= period.start && registeredAt <= period.end;
}

export function filterIssues(items: IssueItem[], filters: IssueFilters) {
  const keyword = filters.keyword.trim().toLowerCase();

  return items.filter((item) => {
    const matchesKeyword =
      keyword.length === 0 ||
      [
        item.authorName,
        item.serviceName,
        item.platform,
        item.path,
        item.issueStatus,
        item.fixStatus,
        item.notIssueReason ?? "",
        item.jiraKey ?? "",
        item.supporterJiraUrl ?? "",
        item.serviceJiraUrl ?? "",
        item.memo ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);

    const matchesPeriod = isWithinPeriod(item.registeredAt, filters.periodId);
    const matchesService =
      filters.serviceName === "전체" || item.serviceName === filters.serviceName;
    const matchesPlatform =
      filters.platform === "전체" || item.platform === filters.platform;
    const matchesIssueStatus =
      filters.issueStatus === "전체" ||
      item.issueStatus === filters.issueStatus;
    const matchesFixStatus =
      filters.fixStatus === "전체" || item.fixStatus === filters.fixStatus;

    return (
      matchesKeyword &&
      matchesPeriod &&
      matchesService &&
      matchesPlatform &&
      matchesIssueStatus &&
      matchesFixStatus
    );
  });
}
