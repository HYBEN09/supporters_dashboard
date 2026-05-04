import {
  NOT_ISSUE_REASON_OPTIONS,
  SERVICE_OPTIONS,
} from "../data/filterOptions";
import type { IssueItem, NotIssueReason, ServiceName } from "../types/issue";

export function calculateImprovementRate(fixedCount: number, issueCount: number) {
  if (issueCount === 0) {
    return 0;
  }

  return (fixedCount / issueCount) * 100;
}

export function getKpis(items: IssueItem[]) {
  const totalReports = items.length;
  const totalIssues = items.filter((item) => item.issueStatus === "이슈").length;
  const fixedIssues = items.filter(
    (item) => item.issueStatus === "이슈" && item.fixStatus === "수정 완료",
  ).length;
  const notIssues = items.filter(
    (item) => item.issueStatus === "이슈 아님",
  ).length;
  const improvementRate = calculateImprovementRate(fixedIssues, totalIssues);

  return {
    totalReports,
    totalIssues,
    fixedIssues,
    improvementRate,
    notIssues,
  };
}

function getMonthKeys(periodStart: string, periodEnd: string) {
  const monthKeys: string[] = [];
  const start = new Date(`${periodStart.slice(0, 7)}-01T00:00:00`);
  const end = new Date(`${periodEnd.slice(0, 7)}-01T00:00:00`);

  while (start <= end) {
    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, "0");
    monthKeys.push(`${year}.${month}`);
    start.setMonth(start.getMonth() + 1);
  }

  return monthKeys;
}

function getMonthLabel(month: string) {
  return `${Number(month.slice(5, 7))}월`;
}

function getFinalDeliveredIssueCount(item: IssueItem) {
  return item.serviceJiraUrl ? 1 : 0;
}

function getFixedDeliveredIssueCount(item: IssueItem) {
  if (item.fixStatus !== "수정 완료") {
    return 0;
  }

  return getFinalDeliveredIssueCount(item);
}

export function getMonthlyStatus(items: IssueItem[]) {
  const monthlyMap = new Map<
    string,
    {
      month: string;
      reportedIssueCount: number;
      finalDeliveredIssueCount: number;
      fixedDeliveredIssueCount: number;
    }
  >();

  items.forEach((item) => {
    const month = item.registeredAt.slice(0, 7).replace("-", ".");
    const current =
      monthlyMap.get(month) ??
      {
        month,
        reportedIssueCount: 0,
        finalDeliveredIssueCount: 0,
        fixedDeliveredIssueCount: 0,
      };

    if (item.issueStatus === "이슈" || item.issueStatus === "이슈 아님") {
      current.reportedIssueCount += 1;
    }

    current.finalDeliveredIssueCount += getFinalDeliveredIssueCount(item);
    current.fixedDeliveredIssueCount += getFixedDeliveredIssueCount(item);

    monthlyMap.set(month, current);
  });

  return Array.from(monthlyMap.values()).sort((a, b) =>
    a.month.localeCompare(b.month),
  );
}

export function getMonthlyReportRows(
  items: IssueItem[],
  periodStart: string,
  periodEnd: string,
) {
  const rowMap = new Map(
    getMonthKeys(periodStart, periodEnd).map((month) => [
      month,
      {
        month,
        monthLabel: getMonthLabel(month),
        totalReports: 0,
        supporterIssues: 0,
        notIssues: 0,
        accessibilityIssues: 0,
        deliveredIssues: 0,
        fixedIssues: 0,
      },
    ]),
  );

  items.forEach((item) => {
    const month = item.registeredAt.slice(0, 7).replace("-", ".");
    const current = rowMap.get(month);

    if (!current) {
      return;
    }

    const supporterIssueCount = item.supporterJiraUrl || item.jiraKey ? 1 : 0;
    const finalDeliveredCount = getFinalDeliveredIssueCount(item);
    const fixedDeliveredCount =
      item.fixStatus === "수정 완료" ? finalDeliveredCount : 0;

    current.totalReports += 1;
    current.supporterIssues += supporterIssueCount;
    current.deliveredIssues += finalDeliveredCount;
    current.fixedIssues += fixedDeliveredCount;

    if (item.issueStatus === "이슈 아님") {
      current.notIssues += 1;
    }
  });

  return Array.from(rowMap.values()).map((row) => ({
    ...row,
    accessibilityIssues: Math.max(0, row.supporterIssues - row.notIssues),
  }));
}

export function getAuthorReportStatus(items: IssueItem[]) {
  const authorMap = new Map<
    string,
    {
      authorName: string;
      totalReports: number;
      deliveredIssueCount: number;
      notIssueCount: number;
    }
  >();

  items.forEach((item) => {
    const authorName = item.authorName.trim() || "미입력";
    const current =
      authorMap.get(authorName) ??
      {
        authorName,
        totalReports: 0,
        deliveredIssueCount: 0,
        notIssueCount: 0,
      };

    current.totalReports += 1;

    if (item.serviceJiraUrl) {
      current.deliveredIssueCount += 1;
    }

    if (item.issueStatus === "이슈 아님") {
      current.notIssueCount += 1;
    }

    authorMap.set(authorName, current);
  });

  return Array.from(authorMap.values()).sort((a, b) => {
    if (b.totalReports !== a.totalReports) {
      return b.totalReports - a.totalReports;
    }

    return a.authorName.localeCompare(b.authorName);
  });
}

export function getServiceStatus(items: IssueItem[]) {
  return SERVICE_OPTIONS.flatMap((serviceName) => {
    const serviceItems = items.filter((item) => item.serviceName === serviceName);
    const supporterIssueCount = serviceItems.filter(
      (item) => item.supporterJiraUrl || item.jiraKey,
    ).length;
    const notIssueCount = serviceItems.filter(
      (item) => item.issueStatus === "이슈 아님",
    ).length;
    const accessibilityIssueCount = Math.max(
      0,
      supporterIssueCount - notIssueCount,
    );
    const fixedIssueCount = serviceItems.filter(
      (item) => item.serviceJiraUrl && item.fixStatus === "수정 완료",
    ).length;

    if (
      supporterIssueCount === 0 &&
      accessibilityIssueCount === 0 &&
      fixedIssueCount === 0 &&
      notIssueCount === 0
    ) {
      return [];
    }

    return [
      {
        serviceName: serviceName as ServiceName,
        supporterIssueCount,
        accessibilityIssueCount,
        fixedIssueCount,
        notIssueCount,
      },
    ];
  });
}

export function getNotIssueReasonStatus(items: IssueItem[]) {
  return NOT_ISSUE_REASON_OPTIONS.map((reason) => ({
    reason: reason as NotIssueReason,
    count: items.filter((item) => item.notIssueReason === reason).length,
  }));
}
