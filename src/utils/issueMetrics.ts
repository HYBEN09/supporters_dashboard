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

export function getMonthlyStatus(items: IssueItem[]) {
  const monthlyMap = new Map<
    string,
    { month: string; issueCount: number; fixedCount: number; improvementRate: number }
  >();

  items.forEach((item) => {
    const month = item.registeredAt.slice(0, 7).replace("-", ".");
    const current =
      monthlyMap.get(month) ??
      { month, issueCount: 0, fixedCount: 0, improvementRate: 0 };

    if (item.issueStatus === "이슈") {
      current.issueCount += 1;
    }

    if (item.issueStatus === "이슈" && item.fixStatus === "수정 완료") {
      current.fixedCount += 1;
    }

    current.improvementRate = calculateImprovementRate(
      current.fixedCount,
      current.issueCount,
    );
    monthlyMap.set(month, current);
  });

  return Array.from(monthlyMap.values()).sort((a, b) =>
    a.month.localeCompare(b.month),
  );
}

export function getServiceStatus(items: IssueItem[]) {
  return SERVICE_OPTIONS.flatMap((serviceName) => {
    const serviceItems = items.filter((item) => item.serviceName === serviceName);
    const issueCount = serviceItems.filter(
      (item) => item.issueStatus === "이슈",
    ).length;

    if (issueCount === 0) {
      return [];
    }

    const fixedCount = serviceItems.filter(
      (item) => item.issueStatus === "이슈" && item.fixStatus === "수정 완료",
    ).length;

    return [
      {
        serviceName: serviceName as ServiceName,
        totalReports: serviceItems.length,
        issueCount,
        fixedCount,
        improvementRate: calculateImprovementRate(fixedCount, issueCount),
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
