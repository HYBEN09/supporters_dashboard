import { PERIOD_OPTIONS } from "../data/filterOptions";
import type { IssueFilters, IssueItem } from "../types/issue";

export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultPeriod() {
  const today = getTodayDateString();

  return (
    PERIOD_OPTIONS.find(
      (period) => today >= period.start && today <= period.end,
    ) ?? PERIOD_OPTIONS[1]
  );
}

const DEFAULT_PERIOD = getDefaultPeriod();

export function getPeriodById(periodId: string) {
  return (
    PERIOD_OPTIONS.find((period) => period.id === periodId) ?? DEFAULT_PERIOD
  );
}

export function getInitialPeriodStart(periodId: string) {
  const period = getPeriodById(periodId);

  return period.start;
}

export const DEFAULT_FILTERS: IssueFilters = {
  keyword: "",
  periodStart: getInitialPeriodStart(DEFAULT_PERIOD.id),
  periodEnd: DEFAULT_PERIOD.end,
  serviceName: "전체",
  platform: "전체",
  issueStatus: "전체",
  fixStatus: "전체",
  notIssueReason: "전체",
};

export function isWithinPeriod(
  registeredAt: string,
  periodStart: string,
  periodEnd: string,
) {
  const startsAfter = periodStart.length === 0 || registeredAt >= periodStart;
  const endsBefore = periodEnd.length === 0 || registeredAt <= periodEnd;

  return startsAfter && endsBefore;
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

    const matchesPeriod = isWithinPeriod(
      item.registeredAt,
      filters.periodStart,
      filters.periodEnd,
    );
    const matchesService =
      filters.serviceName === "전체" ||
      item.serviceName === filters.serviceName;
    const matchesPlatform =
      filters.platform === "전체" || item.platform === filters.platform;
    const matchesIssueStatus =
      filters.issueStatus === "전체" ||
      item.issueStatus === filters.issueStatus;
    const matchesFixStatus =
      filters.fixStatus === "전체" || item.fixStatus === filters.fixStatus;
    const matchesNotIssueReason =
      filters.notIssueReason === "전체" ||
      item.notIssueReason === filters.notIssueReason;

    return (
      matchesKeyword &&
      matchesPeriod &&
      matchesService &&
      matchesPlatform &&
      matchesIssueStatus &&
      matchesFixStatus &&
      matchesNotIssueReason
    );
  });
}
