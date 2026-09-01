import {
  NOT_ISSUE_REASON_OPTIONS,
  SERVICE_OPTIONS,
} from "../data/filterOptions";
import type { IssueItem, NotIssueReason, ServiceName } from "../types/issue";
import { getServiceJiraUrls } from "./formatters";

export function calculateImprovementRate(
  fixedCount: number,
  issueCount: number,
) {
  if (issueCount === 0) {
    return 0;
  }

  return (fixedCount / issueCount) * 100;
}

function getNormalizedServiceJiraUrls(item: IssueItem) {
  return Array.from(
    new Set(
      getServiceJiraUrls(item.serviceJiraUrl)
        .map((url) => url.trim())
        .filter(Boolean),
    ),
  );
}

function getDeliveredIssueKeys(item: IssueItem) {
  const monthKey = item.registeredAt.slice(0, 7);

  return getNormalizedServiceJiraUrls(item).map((url) => `${monthKey}::${url}`);
}

function getUniqueDeliveredIssueCount(items: IssueItem[]) {
  return new Set(items.flatMap((item) => getDeliveredIssueKeys(item))).size;
}

export function getDuplicateDeliveredIssueKeys(items: IssueItem[]) {
  const keyCounts = new Map<string, number>();

  items.forEach((item) => {
    getDeliveredIssueKeys(item).forEach((key) => {
      keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    });
  });

  return new Set(
    Array.from(keyCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([key]) => key),
  );
}

function getUniqueFixedDeliveredIssueCount(items: IssueItem[]) {
  return new Set(
    items.flatMap((item) =>
      item.fixStatus === "수정 완료" ? getDeliveredIssueKeys(item) : [],
    ),
  ).size;
}

function getUniqueUnfixableDeliveredIssueCount(items: IssueItem[]) {
  return new Set(
    items.flatMap((item) =>
      item.fixStatus === "수정 불가" ? getDeliveredIssueKeys(item) : [],
    ),
  ).size;
}

export function getKpis(items: IssueItem[]) {
  const totalReports = items.length;
  const totalIssues = items.filter((item) => item.issueStatus === "이슈").length;
  const fixedIssues = items.filter(
    (item) => item.issueStatus === "이슈" && item.fixStatus === "수정 완료",
  ).length;
  const deliveredIssues = getUniqueDeliveredIssueCount(items);
  const fixedDeliveredIssues = getUniqueFixedDeliveredIssueCount(items);
  const unfixableDeliveredIssues =
    getUniqueUnfixableDeliveredIssueCount(items);
  const notIssues = items.filter(
    (item) => item.issueStatus === "이슈 아님",
  ).length;
  const improvementRate = calculateImprovementRate(
    fixedDeliveredIssues,
    deliveredIssues,
  );

  return {
    totalReports,
    totalIssues,
    fixedIssues,
    deliveredIssues,
    fixedDeliveredIssues,
    unfixableDeliveredIssues,
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

export function getMonthlyStatus(items: IssueItem[]) {
  const months = new Map<string, IssueItem[]>();

  items.forEach((item) => {
    const month = item.registeredAt.slice(0, 7).replace("-", ".");
    const monthItems = months.get(month) ?? [];
    monthItems.push(item);
    months.set(month, monthItems);
  });

  return Array.from(months.entries())
    .map(([month, monthItems]) => ({
      month,
      reportedIssueCount: monthItems.filter(
        (item) => item.issueStatus === "이슈" || item.issueStatus === "이슈 아님",
      ).length,
      finalDeliveredIssueCount: getUniqueDeliveredIssueCount(monthItems),
      fixedDeliveredIssueCount: getUniqueFixedDeliveredIssueCount(monthItems),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
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
        supporterIssues: 0,
        notIssues: 0,
        accessibilityIssues: 0,
        deliveredIssues: 0,
        fixedIssues: 0,
        unfixableIssues: 0,
      },
    ]),
  );

  const groupedItems = new Map<string, IssueItem[]>();

  items.forEach((item) => {
    const month = item.registeredAt.slice(0, 7).replace("-", ".");
    const monthItems = groupedItems.get(month) ?? [];
    monthItems.push(item);
    groupedItems.set(month, monthItems);
  });

  groupedItems.forEach((monthItems, month) => {
    const row = rowMap.get(month);

    if (!row) {
      return;
    }

    row.supporterIssues = monthItems.filter(
      (item) => item.supporterJiraUrl || item.jiraKey,
    ).length;
    row.notIssues = monthItems.filter(
      (item) => item.issueStatus === "이슈 아님",
    ).length;
    row.deliveredIssues = getUniqueDeliveredIssueCount(monthItems);
    row.fixedIssues = getUniqueFixedDeliveredIssueCount(monthItems);
    row.unfixableIssues = getUniqueUnfixableDeliveredIssueCount(monthItems);
    row.accessibilityIssues = Math.max(0, row.supporterIssues - row.notIssues);
  });

  return Array.from(rowMap.values());
}

export function getAuthorReportStatus(items: IssueItem[]) {
  const authorMap = new Map<string, IssueItem[]>();

  items.forEach((item) => {
    if (/_\d+$/.test(item.authorName.trim())) {
      return;
    }

    const authorName = item.authorName.trim() || "미입력";
    const authorItems = authorMap.get(authorName) ?? [];
    authorItems.push(item);
    authorMap.set(authorName, authorItems);
  });

  return Array.from(authorMap.entries())
    .map(([authorName, authorItems]) => ({
      authorName,
      totalReports: authorItems.length,
      deliveredIssueCount: getUniqueDeliveredIssueCount(authorItems),
      notIssueCount: authorItems.filter(
        (item) => item.issueStatus === "이슈 아님",
      ).length,
    }))
    .sort((a, b) => {
      if (b.totalReports !== a.totalReports) {
        return b.totalReports - a.totalReports;
      }

      return a.authorName.localeCompare(b.authorName);
    });
}

export function getAuthorReportStatusByVisibleReporter(items: IssueItem[]) {
  const authorMap = new Map<string, IssueItem[]>();
  const reportCountMap = new Map<string, number>();

  items.forEach((item) => {
    const rawAuthorName = item.authorName.trim();
    const isAliasAuthor = /_\d+$/.test(rawAuthorName);
    const authorName = rawAuthorName.replace(/_\d+$/, "").trim() || "미입력";
    const authorItems = authorMap.get(authorName) ?? [];
    authorItems.push(item);
    authorMap.set(authorName, authorItems);

    if (!isAliasAuthor) {
      reportCountMap.set(authorName, (reportCountMap.get(authorName) ?? 0) + 1);
    }
  });

  return Array.from(authorMap.entries())
    .map(([authorName, authorItems]) => ({
      authorName,
      totalReports: reportCountMap.get(authorName) ?? 0,
      deliveredIssueCount: getUniqueDeliveredIssueCount(authorItems),
      notIssueCount: authorItems.filter(
        (item) => item.issueStatus === "이슈 아님",
      ).length,
    }))
    .sort((a, b) => {
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
    const fixedIssueCount = getUniqueFixedDeliveredIssueCount(serviceItems);
    const unfixableIssueCount =
      getUniqueUnfixableDeliveredIssueCount(serviceItems);
    const deliveredIssueCount = getUniqueDeliveredIssueCount(serviceItems);

    if (
      supporterIssueCount === 0 &&
      deliveredIssueCount === 0 &&
      fixedIssueCount === 0 &&
      unfixableIssueCount === 0 &&
      notIssueCount === 0
    ) {
      return [];
    }

    return [
      {
        serviceName: serviceName as ServiceName,
        supporterIssueCount,
        accessibilityIssueCount,
        deliveredIssueCount,
        fixedIssueCount,
        unfixableIssueCount,
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
