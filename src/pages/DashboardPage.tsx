import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FIX_STATUS_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  PLATFORM_OPTIONS,
  SERVICE_OPTIONS,
} from "../data/filterOptions";
import { useIssues } from "../features/issues/useIssues";
import { usePeriod } from "../features/period/usePeriod";
import type {
  FixStatus,
  IssueFilters,
  IssueItem,
  IssueStatus,
  Platform,
  SelectableFilter,
  ServiceName,
} from "../types/issue";
import { usePagination } from "../hooks/usePagination";
import {
  formatDate,
  formatPercent,
  getIssueJiraLinks,
  getJiraIssueNumber,
} from "../utils/formatters";
import {
  DEFAULT_FILTERS,
  filterIssues,
  getInitialPeriodStart,
  getPeriodById,
} from "../utils/issueFilters";
import {
  getAuthorReportStatusByVisibleReporter,
  getKpis,
  getMonthlyStatus,
  getNotIssueReasonStatus,
  getServiceStatus,
} from "../utils/issueMetrics";
import { KpiCard } from "../components/dashboard/KpiCard";
import { Button } from "../components/ui/Button";
import { Pagination } from "../components/ui/Pagination";
import { SectionCard } from "../components/ui/SectionCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import styles from "./DashboardPage.module.css";

const reasonColors = [
  "#1f6feb",
  "#12b76a",
  "#f79009",
  "#f04438",
  "#667085",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#14b8a6",
  "#eab308",
];
const supporterSheetLinks = [
  {
    label: "1기",
    url: "https://docs.google.com/spreadsheets/d/1B7Ncghjq9Yq8ICzpz2jtK5LFCbDJopvY5oKLO8jHhhY/edit?gid=1382932642#gid=1382932642",
  },
  {
    label: "2기",
    url: "https://docs.google.com/spreadsheets/d/1mC4laA_06kbfea5MQtnWZbSDqDFkEM97IqZVF3bMvDU/edit?gid=1012373745#gid=1012373745",
  },
  {
    label: "3기",
    url: "https://docs.google.com/spreadsheets/d/1eWtMOa5PvyaLjpHM_W4IdTe-sy0c069T7pQka6yjPF8/edit?gid=765303742#gid=765303742",
  },
] as const;
const DASHBOARD_FILTERS_STORAGE_KEY = "supporters-dashboard-filters";

type DetailSortKey = "registeredAt" | "jiraNumber";
type DetailSortDirection = "asc" | "desc";

type DetailSort = {
  key: DetailSortKey;
  direction: DetailSortDirection;
};

function createDefaultDashboardFilters(periodId: string, periodEnd: string) {
  return {
    ...DEFAULT_FILTERS,
    periodStart: getInitialPeriodStart(periodId),
    periodEnd,
  };
}

function getStoredDashboardFilters(fallbackFilters: IssueFilters) {
  if (typeof window === "undefined") {
    return fallbackFilters;
  }

  try {
    const storedFilters = window.sessionStorage.getItem(
      DASHBOARD_FILTERS_STORAGE_KEY,
    );

    if (!storedFilters) {
      return fallbackFilters;
    }

    return {
      ...fallbackFilters,
      ...(JSON.parse(storedFilters) as Partial<IssueFilters>),
    };
  } catch {
    return fallbackFilters;
  }
}

function getPrimaryJiraNumber(issue: IssueItem) {
  for (const link of getIssueJiraLinks(issue)) {
    const jiraNumber = getJiraIssueNumber(link.label);

    if (jiraNumber !== null) {
      return jiraNumber;
    }
  }

  return null;
}

function getMonthlyStatusLabel(dataKey: string) {
  if (dataKey === "reportedIssueCount") {
    return "서포터즈 이슈";
  }

  if (dataKey === "finalDeliveredIssueCount") {
    return "최종 전달 건수";
  }

  if (dataKey === "fixedDeliveredIssueCount") {
    return "수정 완료";
  }

  return dataKey;
}

export function DashboardPage() {
  const { selectedPeriodId } = usePeriod();
  const { issues } = useIssues();
  const navigate = useNavigate();
  const [isMetricInfoOpen, setIsMetricInfoOpen] = useState(false);
  const selectedPeriod = getPeriodById(selectedPeriodId);
  const defaultFilters = createDefaultDashboardFilters(
    selectedPeriod.id,
    selectedPeriod.end,
  );
  const [filters, setFilters] = useState<IssueFilters>(() =>
    getStoredDashboardFilters(defaultFilters),
  );
  const [detailSort, setDetailSort] = useState<DetailSort>({
    key: "registeredAt",
    direction: "desc",
  });

  useEffect(() => {
    window.sessionStorage.setItem(
      DASHBOARD_FILTERS_STORAGE_KEY,
      JSON.stringify(filters),
    );
  }, [filters]);

  useEffect(() => {
    if (!isMetricInfoOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMetricInfoOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMetricInfoOpen]);

  const filteredIssues = useMemo(
    () => filterIssues(issues, filters),
    [filters, issues],
  );
  const kpis = useMemo(() => getKpis(filteredIssues), [filteredIssues]);
  const monthlyStatus = useMemo(
    () => getMonthlyStatus(filteredIssues),
    [filteredIssues],
  );
  const authorStatus = useMemo(
    () => getAuthorReportStatusByVisibleReporter(filteredIssues),
    [filteredIssues],
  );
  const authorTotals = useMemo(
    () =>
      authorStatus.reduce(
        (total, author) => ({
          totalReports: total.totalReports + author.totalReports,
          deliveredIssueCount:
            total.deliveredIssueCount + author.deliveredIssueCount,
          notIssueCount: total.notIssueCount + author.notIssueCount,
        }),
        {
          totalReports: 0,
          deliveredIssueCount: 0,
          notIssueCount: 0,
        },
      ),
    [authorStatus],
  );
  const serviceStatus = useMemo(
    () => getServiceStatus(filteredIssues),
    [filteredIssues],
  );
  const notIssueReasons = useMemo(
    () => getNotIssueReasonStatus(filteredIssues),
    [filteredIssues],
  );
  const rankedNotIssueReasons = useMemo(
    () =>
      [...notIssueReasons].sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }

        return a.reason.localeCompare(b.reason);
      }),
    [notIssueReasons],
  );
  const notIssueTotal = useMemo(
    () => notIssueReasons.reduce((total, reason) => total + reason.count, 0),
    [notIssueReasons],
  );
  const topNotIssueReason = rankedNotIssueReasons[0];
  const maxNotIssueReasonCount = Math.max(
    ...rankedNotIssueReasons.map((reason) => reason.count),
    1,
  );
  const topNotIssueRate =
    notIssueTotal > 0 && topNotIssueReason
      ? (topNotIssueReason.count / notIssueTotal) * 100
      : 0;
  const sortedDetailIssues = useMemo(() => {
    return [...filteredIssues].sort((a, b) => {
      if (detailSort.key === "jiraNumber") {
        const aJiraNumber = getPrimaryJiraNumber(a);
        const bJiraNumber = getPrimaryJiraNumber(b);

        if (aJiraNumber !== null && bJiraNumber !== null) {
          const jiraCompare = aJiraNumber - bJiraNumber;

          if (jiraCompare !== 0) {
            return detailSort.direction === "asc" ? jiraCompare : -jiraCompare;
          }
        }

        if (aJiraNumber !== null && bJiraNumber === null) {
          return -1;
        }

        if (aJiraNumber === null && bJiraNumber !== null) {
          return 1;
        }
      }

      const dateCompare = a.registeredAt.localeCompare(b.registeredAt);

      if (dateCompare !== 0) {
        return detailSort.direction === "desc" ? -dateCompare : dateCompare;
      }

      const idCompare = a.id.localeCompare(b.id);
      return detailSort.direction === "desc" ? -idCompare : idCompare;
    });
  }, [detailSort, filteredIssues]);
  const detailPagination = usePagination(sortedDetailIssues, 10);

  function updateFilter<Key extends keyof IssueFilters>(
    key: Key,
    value: IssueFilters[Key],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_FILTERS,
      periodStart: getInitialPeriodStart(selectedPeriod.id),
      periodEnd: selectedPeriod.end,
      serviceName: DEFAULT_FILTERS.serviceName,
      platform: DEFAULT_FILTERS.platform,
      issueStatus: DEFAULT_FILTERS.issueStatus,
      fixStatus: DEFAULT_FILTERS.fixStatus,
    });
    setDetailSort({ key: "registeredAt", direction: "desc" });
    detailPagination.goToPage(1);
  }

  function toggleDetailRegisteredAtSort() {
    setDetailSort((current) => ({
      key: "registeredAt",
      direction:
        current.key === "registeredAt" && current.direction === "desc"
          ? "asc"
          : "desc",
    }));
    detailPagination.goToPage(1);
  }

  function toggleDetailJiraNumberSort() {
    setDetailSort((current) => ({
      key: "jiraNumber",
      direction:
        current.key === "jiraNumber" && current.direction === "asc"
          ? "desc"
          : "asc",
    }));
    detailPagination.goToPage(1);
  }

  function openIssuesByReason(reason: string) {
    const params = new URLSearchParams({
      notIssueReason: reason,
      periodStart: filters.periodStart,
      periodEnd: filters.periodEnd,
    });

    navigate(`/issues?${params.toString()}`);
  }

  return (
    <>
      <section className={styles.filterPanel} aria-label="대시보드 필터">
        <div className={styles.filterGrid}>
          <label className={styles.dateField}>
            <span>기간</span>
            <div className={styles.dateRange}>
              <input
                aria-label="조회 시작일"
                id="dashboard-period-start"
                max={filters.periodEnd || undefined}
                name="periodStart"
                type="date"
                value={filters.periodStart}
                onChange={(event) =>
                  updateFilter("periodStart", event.target.value)
                }
              />
              <span aria-hidden="true">~</span>
              <input
                aria-label="조회 종료일"
                id="dashboard-period-end"
                min={filters.periodStart || undefined}
                name="periodEnd"
                type="date"
                value={filters.periodEnd}
                onChange={(event) =>
                  updateFilter("periodEnd", event.target.value)
                }
              />
            </div>
          </label>

          <label className={styles.filterField}>
            <span>서비스</span>
            <select
              id="dashboard-service-name"
              name="serviceName"
              value={filters.serviceName}
              onChange={(event) =>
                updateFilter(
                  "serviceName",
                  event.target.value as SelectableFilter<ServiceName>,
                )
              }
            >
              <option>전체</option>
              {SERVICE_OPTIONS.map((service) => (
                <option key={service}>{service}</option>
              ))}
            </select>
          </label>

          <label className={styles.filterField}>
            <span>플랫폼</span>
            <select
              id="dashboard-platform"
              name="platform"
              value={filters.platform}
              onChange={(event) =>
                updateFilter(
                  "platform",
                  event.target.value as SelectableFilter<Platform>,
                )
              }
            >
              <option>전체</option>
              {PLATFORM_OPTIONS.map((platform) => (
                <option key={platform}>{platform}</option>
              ))}
            </select>
          </label>

          <label className={styles.filterField}>
            <span>이슈 여부</span>
            <select
              id="dashboard-issue-status"
              name="issueStatus"
              value={filters.issueStatus}
              onChange={(event) =>
                updateFilter(
                  "issueStatus",
                  event.target.value as SelectableFilter<IssueStatus>,
                )
              }
            >
              <option>전체</option>
              {ISSUE_STATUS_OPTIONS.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <label className={styles.filterField}>
            <span>수정 여부</span>
            <select
              id="dashboard-fix-status"
              name="fixStatus"
              value={filters.fixStatus}
              onChange={(event) =>
                updateFilter(
                  "fixStatus",
                  event.target.value as SelectableFilter<FixStatus>,
                )
              }
            >
              <option>전체</option>
              {FIX_STATUS_OPTIONS.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <Button
            className={styles.resetButton}
            variant="secondary"
            onClick={resetFilters}
          >
            ↻ 초기화
          </Button>
        </div>
        <div className={styles.filterMeta}>
          <p className={styles.referenceLink}>
            <span aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24">
                <path d="M14 4h6v6" />
                <path d="M10 14 20 4" />
                <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
              </svg>
            </span>
            <strong>서포터즈 구글시트</strong>
            <div className={styles.sheetLinks}>
              {supporterSheetLinks.map((sheet) => (
                <a href={sheet.url} key={sheet.label} rel="noreferrer" target="_blank">
                  {sheet.label}
                  <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                    <path d="M14 4h6v6" />
                    <path d="M10 14 20 4" />
                    <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
                  </svg>
                </a>
              ))}
            </div>
          </p>
        </div>
      </section>

      <div className={styles.kpiHeader}>
        <h2>핵심 지표</h2>
        <Button
          className={styles.metricInfoButton}
          variant="secondary"
          onClick={() => setIsMetricInfoOpen(true)}
        >
          집계 기준 보기
        </Button>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard
          helper="서포터즈 스프린트 내 생성된 건수"
          icon="▣"
          label="서포터즈 이슈"
          tone="blue"
          value={`${kpis.totalReports}건`}
        />
        <KpiCard
          helper="검토 후 이슈 아님으로 판정된 건수"
          icon="⊘"
          label="이슈 아님"
          tone="gray"
          value={`${kpis.notIssues}건`}
        />
        <KpiCard
          helper="아지트 및 서비스팀에 전달된 건수"
          icon="!"
          label="최종 전달 건수"
          tone="orange"
          value={`${kpis.deliveredIssues}건`}
        />
        <KpiCard
          helper="전달 이슈 중 수정이 완료된 건수"
          icon="✓"
          label="수정 완료"
          tone="green"
          value={`${kpis.fixedDeliveredIssues}건`}
        />
        <KpiCard
          helper="전달 이슈 중 수정이 불가한 건수"
          icon="×"
          label="수정 불가"
          tone="rose"
          value={`${kpis.unfixableDeliveredIssues}건`}
        />
        <KpiCard
          helper={`최종 전달 이슈 중 수정 완료 비율 (${kpis.fixedDeliveredIssues} / ${kpis.deliveredIssues})`}
          icon="↗"
          label="개선율"
          progressValue={kpis.improvementRate}
          tone="purple"
          value={formatPercent(kpis.improvementRate)}
        />
      </div>

      {isMetricInfoOpen ? (
        <div
          className={styles.metricModalBackdrop}
          role="presentation"
          onClick={() => setIsMetricInfoOpen(false)}
        >
          <section
            aria-labelledby="metric-info-title"
            aria-modal="true"
            className={styles.metricModal}
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.metricModalHeader}>
              <div>
                <span>Dashboard Guide</span>
                <h2 id="metric-info-title">이슈 개수 산정 기준</h2>
              </div>
              <button
                aria-label="집계 기준 안내 닫기"
                className={styles.metricModalClose}
                type="button"
                onClick={() => setIsMetricInfoOpen(false)}
              >
                ×
              </button>
            </header>
            <div className={styles.metricModalBody}>
              <section className={styles.metricCriteriaSection}>
                <h3>서포터즈 이슈</h3>
                <ul>
                  <li>서포터즈 Jira에 생성한 이슈 카드 수를 기준으로 산정합니다.</li>
                  <li>
                    하나의 제보에서 여러 개의 Jira 이슈를 생성한 경우, 생성된
                    이슈 수만큼 집계합니다.
                    <ul>
                      <li>
                        예: 하나의 제보에서 3개 이슈 생성 시, 대시보드에는
                        이슈 3건으로 집계
                      </li>
                      <li>
                        제보 시트 기준 집계와 실제 Jira 이슈 수는 다를 수
                        있습니다.
                      </li>
                    </ul>
                  </li>
                  <li>
                    플랫폼이나 실행 경로가 달라 별도 이슈로 관리되는 경우에도
                    각각 독립 이슈로 집계합니다.
                  </li>
                </ul>
              </section>

              <section className={styles.metricCriteriaSection}>
                <h3>이슈 아님</h3>
                <ul>
                  <li>검토 후 이슈 아님으로 판정된 건수입니다.</li>
                </ul>
              </section>

              <section className={styles.metricCriteriaSection}>
                <h3>최종 전달 이슈</h3>
                <ul>
                  <li>아지트 또는 서비스팀에 전달한 이슈를 포함합니다.</li>
                  <li>
                    서비스팀으로 직접 전달되지는 않았지만, 헤빠에게 오픈한
                    이슈도 포함합니다.
                  </li>
                </ul>
                <p>
                  위 두 경우를 모두 포함하여 최종 전달 이슈 수를 산정합니다.
                </p>
              </section>

              <section className={styles.metricCriteriaSection}>
                <h3>수정 이슈 수</h3>
                <ul>
                  <li>수정 완료된 Jira 이슈 수를 기준으로 산정합니다.</li>
                  <li>
                    중복 이슈가 각각 수정된 경우에도 모두 개별 건으로
                    집계합니다.
                    <ul>
                      <li>
                        예: 동일한 내용의 중복 이슈 2건이 모두 수정된 경우,
                        2건으로 집계
                      </li>
                    </ul>
                  </li>
                </ul>
              </section>

              <section className={styles.metricCriteriaSection}>
                <h3>수정 불가 이슈 수</h3>
                <ul>
                  <li>최종 전달 이슈 중 수정 불가로 판정된 Jira 이슈 수입니다.</li>
                </ul>
              </section>

              <div className={styles.metricFormula}>
                <strong>개선율 계산식</strong>
                <code>수정 완료 / 최종 전달 건수 × 100</code>
              </div>

              <aside className={styles.metricNote}>
                <strong>서포터즈 이슈 수와 최종 전달 건수가 다른 이유</strong>
                <p>
                  하나의 서포터즈 이슈가 여러 서비스팀 이슈로 분리 전달될 수
                  있어, 두 숫자는 1:1로 일치하지 않을 수 있습니다.
                </p>
              </aside>
            </div>
          </section>
        </div>
      ) : null}

      <div className={styles.chartGrid}>
        <SectionCard title="월별 현황">
          <div className={styles.chartBox}>
            <ResponsiveContainer height={300} width="100%">
              <LineChart data={monthlyStatus}>
                <CartesianGrid
                  stroke="var(--chart-grid-color)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  axisLine={{ stroke: "var(--chart-axis-color)" }}
                  dataKey="month"
                  tick={{ fill: "var(--chart-axis-color)" }}
                  tickLine={{ stroke: "var(--chart-axis-color)" }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={{ stroke: "var(--chart-axis-color)" }}
                  tick={{ fill: "var(--chart-axis-color)" }}
                  tickLine={{ stroke: "var(--chart-axis-color)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--chart-tooltip-bg)",
                    border: "1px solid var(--chart-tooltip-border)",
                    borderRadius: 8,
                    boxShadow: "var(--chart-tooltip-shadow)",
                    color: "var(--chart-tooltip-label)",
                    fontWeight: 800,
                  }}
                  formatter={(value, _name, item) => [
                    `${value}건`,
                    getMonthlyStatusLabel(String(item.dataKey)),
                  ]}
                  itemStyle={{
                    fontSize: 14,
                    fontWeight: 800,
                    padding: "3px 0",
                  }}
                  labelStyle={{
                    color: "var(--chart-tooltip-label)",
                    fontSize: 13,
                    fontWeight: 900,
                    marginBottom: 6,
                  }}
                />
                <Legend
                  formatter={(value) => getMonthlyStatusLabel(String(value))}
                />
                <Line
                  dataKey="reportedIssueCount"
                  name="서포터즈 이슈"
                  stroke="#1f6feb"
                  strokeWidth={2}
                  type="monotone"
                />
                <Line
                  dataKey="finalDeliveredIssueCount"
                  name="최종 전달 건수"
                  stroke="#f97316"
                  strokeWidth={2}
                  type="monotone"
                />
                <Line
                  dataKey="fixedDeliveredIssueCount"
                  name="수정 완료"
                  stroke="#12b76a"
                  strokeWidth={2}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="서비스별 현황">
          <div className={styles.serviceTableWrap}>
            <table className={`${styles.summaryTable} ${styles.serviceTable}`}>
              <thead>
                <tr>
                  <th>서비스</th>
                  <th>서포터즈 제보 이슈 수</th>
                  <th>이슈 아님 수</th>
                  <th>최종 전달 건수</th>
                  <th>수정 완료 이슈 수</th>
                  <th>수정 불가 이슈 수</th>
                </tr>
              </thead>
              <tbody>
                {serviceStatus.length > 0 ? (
                  serviceStatus.map((service) => (
                    <tr key={service.serviceName}>
                      <td>{service.serviceName}</td>
                      <td>{service.supporterIssueCount}건</td>
                      <td>{service.notIssueCount}건</td>
                      <td>{service.deliveredIssueCount}건</td>
                      <td>{service.fixedIssueCount}건</td>
                      <td>{service.unfixableIssueCount}건</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className={styles.empty} colSpan={6}>
                      생성된 이슈가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="이슈 아님 분석">
          <div className={styles.reasonAnalysis}>
            <div className={styles.reasonSummaryGrid}>
              <article className={styles.reasonSummaryCard}>
                <span className={styles.reasonSummaryIcon}>▣</span>
                <div>
                  <strong>전체 건수</strong>
                  <p>
                    {notIssueTotal}
                    <small>건</small>
                  </p>
                </div>
              </article>
              <article className={styles.reasonSummaryCard}>
                <span className={styles.reasonSummaryIcon}>★</span>
                <div>
                  <strong>최다 유형</strong>
                  <p>{topNotIssueReason?.reason ?? "-"}</p>
                  <em>
                    {topNotIssueReason?.count ?? 0}건 (
                    {formatPercent(topNotIssueRate)})
                  </em>
                </div>
              </article>
            </div>

            <div className={styles.reasonContentGrid}>
              <div className={styles.reasonBarPanel}>
                <h3>유형별 건수</h3>
                <div className={styles.reasonBars}>
                  {rankedNotIssueReasons.map((reason, index) => {
                    const barWidth =
                      reason.count === 0
                        ? 0
                        : (reason.count / maxNotIssueReasonCount) * 100;

                    return (
                      <div className={styles.reasonBarRow} key={reason.reason}>
                        <span
                          className={styles.reasonRank}
                          style={{
                            backgroundColor:
                              reasonColors[index % reasonColors.length],
                          }}
                        >
                          {index + 1}
                        </span>
                        <strong>{reason.reason}</strong>
                        <div className={styles.reasonTrack}>
                          <span
                            style={{
                              backgroundColor:
                                reasonColors[index % reasonColors.length],
                              width: `${barWidth}%`,
                            }}
                          />
                        </div>
                        <b>{reason.count}건</b>
                      </div>
                    );
                  })}
                </div>
              </div>
              <table className={`${styles.summaryTable} ${styles.reportTable}`}>
                <thead>
                  <tr>
                    <th>유형</th>
                    <th>건수</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedNotIssueReasons.map((reason, index) => (
                    <tr key={reason.reason}>
                      <td>
                        <button
                          className={styles.reasonTableType}
                          disabled={reason.count === 0}
                          type="button"
                          onClick={() => openIssuesByReason(reason.reason)}
                        >
                          <i
                            style={{
                              backgroundColor:
                                reasonColors[index % reasonColors.length],
                            }}
                          >
                            {index + 1}
                          </i>
                          {reason.reason}
                        </button>
                      </td>
                      <td>{reason.count}건</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="작성자별 제보 현황">
          <table
            className={`${styles.summaryTable} ${styles.reportTable} ${styles.authorTable}`}
          >
            <thead>
              <tr>
                <th>작성자</th>
                <th>제보 수</th>
                <th>이슈 아님</th>
                <th>최종 전달 건수</th>
              </tr>
            </thead>
            <tbody>
              {authorStatus.length > 0 ? (
                <>
                  {authorStatus.map((author) => (
                    <tr key={author.authorName}>
                      <td>{author.authorName}</td>
                      <td>{author.totalReports}건</td>
                      <td>{author.notIssueCount}건</td>
                      <td>{author.deliveredIssueCount}건</td>
                    </tr>
                  ))}
                  <tr className={styles.totalRow}>
                    <td>총 건수</td>
                    <td>{authorTotals.totalReports}건</td>
                    <td>{authorTotals.notIssueCount}건</td>
                    <td>{authorTotals.deliveredIssueCount}건</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td className={styles.empty} colSpan={4}>
                    작성자별 제보 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </SectionCard>
      </div>

      <section className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <h2>상세 데이터</h2>
          <span>
            총 <strong>{filteredIssues.length}</strong>건
          </span>
        </div>
        <div className={styles.detailTableWrap}>
          <table className={styles.detailTable}>
            <thead>
              <tr>
                <th>
                  <button
                    aria-label={`등록일 ${
                      detailSort.key === "registeredAt" &&
                      detailSort.direction === "desc"
                        ? "최신순"
                        : "오래된순"
                    }. 클릭하면 정렬 순서가 변경됩니다.`}
                    className={styles.detailSortButton}
                    type="button"
                    onClick={toggleDetailRegisteredAtSort}
                  >
                    등록일
                    <span aria-hidden="true">↕</span>
                  </button>
                </th>
                <th>작성자</th>
                <th>서비스</th>
                <th>플랫폼</th>
                <th>이슈 여부</th>
                <th>수정 여부</th>
                <th>이슈 아님 사유</th>
                <th>
                  <button
                    aria-label={`Jira 링크 ${
                      detailSort.key === "jiraNumber" &&
                      detailSort.direction === "desc"
                        ? "큰 번호순"
                        : "작은 번호순"
                    }. 클릭하면 정렬 순서가 변경됩니다.`}
                    className={styles.detailSortButton}
                    type="button"
                    onClick={toggleDetailJiraNumberSort}
                  >
                    Jira 링크
                    <span aria-hidden="true">↕</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {detailPagination.paginatedItems.length > 0 ? (
                detailPagination.paginatedItems.map((issue) => (
                  <tr key={issue.id}>
                    <td>{formatDate(issue.registeredAt)}</td>
                    <td>{issue.authorName}</td>
                    <td>{issue.serviceName}</td>
                    <td>{issue.platform}</td>
                    <td>
                      <StatusBadge value={issue.issueStatus} />
                    </td>
                    <td>
                      <StatusBadge value={issue.fixStatus} />
                    </td>
                    <td>{issue.notIssueReason ?? "-"}</td>
                    <td>
                      {getIssueJiraLinks(issue).length > 0 ? (
                        <div className={styles.jiraLinks}>
                          {getIssueJiraLinks(issue).map((link) => (
                            <a
                              href={link.url}
                              key={`${link.label}-${link.url}`}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {link.label}
                            </a>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className={styles.empty} colSpan={8}>
                    표시할 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={detailPagination.page}
          totalPages={detailPagination.totalPages}
          onChange={detailPagination.goToPage}
        />
      </section>
    </>
  );
}
