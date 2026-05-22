import { useMemo, useState } from "react";
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

const reasonColors = ["#1f6feb", "#12b76a", "#f79009", "#f04438", "#667085"];
const SUPPORTERS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1eWtMOa5PvyaLjpHM_W4IdTe-sy0c069T7pQka6yjPF8/edit?gid=765303742#gid=765303742";

type DetailSortKey = "registeredAt" | "jiraNumber";
type DetailSortDirection = "asc" | "desc";

type DetailSort = {
  key: DetailSortKey;
  direction: DetailSortDirection;
};

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
    return "서포터즈 이슈 수";
  }

  if (dataKey === "finalDeliveredIssueCount") {
    return "최종 전달 이슈 수";
  }

  if (dataKey === "fixedDeliveredIssueCount") {
    return "수정 이슈 수";
  }

  return dataKey;
}

export function DashboardPage() {
  const { selectedPeriodId } = usePeriod();
  const { issues } = useIssues();
  const selectedPeriod = getPeriodById(selectedPeriodId);
  const [filters, setFilters] = useState<IssueFilters>({
    ...DEFAULT_FILTERS,
    periodStart: getInitialPeriodStart(selectedPeriod.id),
    periodEnd: selectedPeriod.end,
  });
  const [detailSort, setDetailSort] = useState<DetailSort>({
    key: "registeredAt",
    direction: "desc",
  });

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

  const periodSummary = `${filters.periodStart.replaceAll("-", ".")} - ${filters.periodEnd.replaceAll("-", ".")}`;
  const currentSummary = `현재 조회: 전체 기간 · ${filters.serviceName} 서비스 · ${filters.platform} 플랫폼`;

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

  return (
    <>
      <section className={styles.filterPanel} aria-label="대시보드 필터">
        <div className={styles.filterGrid}>
          <label className={styles.dateField}>
            <span>기간</span>
            <div className={styles.dateRange}>
              <input
                aria-label="조회 시작일"
                max={filters.periodEnd || undefined}
                type="date"
                value={filters.periodStart}
                onChange={(event) =>
                  updateFilter("periodStart", event.target.value)
                }
              />
              <span aria-hidden="true">~</span>
              <input
                aria-label="조회 종료일"
                min={filters.periodStart || undefined}
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
        <p className={styles.currentSummary}>
          {currentSummary} · 기준 기간 {periodSummary}
        </p>
        <p className={styles.referenceLink}>
          서포터즈 3기 구글시트:{" "}
          <a href={SUPPORTERS_SHEET_URL} rel="noreferrer" target="_blank">
            {SUPPORTERS_SHEET_URL}
          </a>
        </p>
      </section>

      <div className={styles.kpiGrid}>
        <KpiCard
          helper="조회 기간 내 등록된 서포터즈 이슈"
          icon="▣"
          label="서포터즈 이슈 수"
          tone="blue"
          value={`${kpis.totalReports}건`}
        />
        <KpiCard
          helper="서비스 전달 링크가 등록된 이슈"
          icon="!"
          label="최종 전달 이슈 수"
          tone="orange"
          value={`${kpis.deliveredIssues}건`}
        />
        <KpiCard
          helper="전달 이슈 중 수정이 완료된 건수"
          icon="✓"
          label="수정 완료 수"
          tone="green"
          value={`${kpis.fixedDeliveredIssues}건`}
        />
        <KpiCard
          helper={`전체 전달 이슈 중 수정 완료 비율 (${kpis.fixedDeliveredIssues} / ${kpis.deliveredIssues})`}
          icon="↗"
          label="개선율"
          progressValue={kpis.improvementRate}
          tone="purple"
          value={formatPercent(kpis.improvementRate)}
        />
        <KpiCard
          helper="검토 후 이슈 아님으로 판정된 건수"
          icon="⊘"
          label="이슈 아님 수"
          tone="gray"
          value={`${kpis.notIssues}건`}
        />
      </div>

      <div className={styles.chartGrid}>
        <SectionCard title="월별 현황">
          <div className={styles.chartBox}>
            <ResponsiveContainer height={300} width="100%">
              <LineChart data={monthlyStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value, _name, item) => [
                    String(value),
                    getMonthlyStatusLabel(String(item.dataKey)),
                  ]}
                />
                <Legend formatter={(value) => getMonthlyStatusLabel(String(value))} />
                <Line
                  dataKey="reportedIssueCount"
                  name="서포터즈 이슈 수"
                  stroke="#1f6feb"
                  strokeWidth={2}
                  type="monotone"
                />
                <Line
                  dataKey="finalDeliveredIssueCount"
                  name="최종 전달 이슈 수"
                  stroke="#f97316"
                  strokeWidth={2}
                  type="monotone"
                />
                <Line
                  dataKey="fixedDeliveredIssueCount"
                  name="수정 이슈 수"
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
                  <th>접근성 이슈 수</th>
                  <th>수정된 이슈 수</th>
                  <th>이슈 아님 수</th>
                </tr>
              </thead>
              <tbody>
                {serviceStatus.length > 0 ? (
                  serviceStatus.map((service) => (
                    <tr key={service.serviceName}>
                      <td>{service.serviceName}</td>
                      <td>{service.supporterIssueCount}건</td>
                      <td>{service.accessibilityIssueCount}건</td>
                      <td>{service.fixedIssueCount}건</td>
                      <td>{service.notIssueCount}건</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className={styles.empty} colSpan={5}>
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
                        <span className={styles.reasonTableType}>
                          <i
                            style={{
                              backgroundColor:
                                reasonColors[index % reasonColors.length],
                            }}
                          >
                            {index + 1}
                          </i>
                          {reason.reason}
                        </span>
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
                <th>최종 전달</th>
                <th>이슈 아님</th>
              </tr>
            </thead>
            <tbody>
              {authorStatus.length > 0 ? (
                <>
                  {authorStatus.map((author) => (
                    <tr key={author.authorName}>
                      <td>{author.authorName}</td>
                      <td>{author.totalReports}건</td>
                      <td>{author.deliveredIssueCount}건</td>
                      <td>{author.notIssueCount}건</td>
                    </tr>
                  ))}
                  <tr className={styles.totalRow}>
                    <td>총 건수</td>
                    <td>{authorTotals.totalReports}건</td>
                    <td>{authorTotals.deliveredIssueCount}건</td>
                    <td>{authorTotals.notIssueCount}건</td>
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
