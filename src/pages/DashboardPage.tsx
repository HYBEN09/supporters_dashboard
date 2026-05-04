import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
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
  IssueStatus,
  Platform,
  SelectableFilter,
  ServiceName,
} from "../types/issue";
import { usePagination } from "../hooks/usePagination";
import { formatDate, formatPercent, getIssueJiraLinks } from "../utils/formatters";
import {
  DEFAULT_FILTERS,
  filterIssues,
  getPeriodById,
} from "../utils/issueFilters";
import {
  getAuthorReportStatus,
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

export function DashboardPage() {
  const { selectedPeriodId } = usePeriod();
  const { issues } = useIssues();
  const selectedPeriod = getPeriodById(selectedPeriodId);
  const [filters, setFilters] = useState<IssueFilters>({
    ...DEFAULT_FILTERS,
    periodStart: selectedPeriod.start,
    periodEnd: selectedPeriod.end,
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
    () => getAuthorReportStatus(filteredIssues),
    [filteredIssues],
  );
  const serviceStatus = useMemo(
    () => getServiceStatus(filteredIssues),
    [filteredIssues],
  );
  const notIssueReasons = useMemo(
    () => getNotIssueReasonStatus(filteredIssues),
    [filteredIssues],
  );
  const detailPagination = usePagination(filteredIssues, 5);

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
      periodStart: selectedPeriod.start,
      periodEnd: selectedPeriod.end,
      serviceName: DEFAULT_FILTERS.serviceName,
      platform: DEFAULT_FILTERS.platform,
      issueStatus: DEFAULT_FILTERS.issueStatus,
      fixStatus: DEFAULT_FILTERS.fixStatus,
    });
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
      </section>

      <div className={styles.kpiGrid}>
        <KpiCard
          helper="조회 기간 내 등록된 총 제보"
          icon="▣"
          label="전체 제보 수"
          tone="blue"
          value={kpis.totalReports}
        />
        <KpiCard
          helper="접근성 또는 사용성 이슈로 판정된 제보"
          icon="!"
          label="전체 이슈 수"
          tone="orange"
          value={kpis.totalIssues}
        />
        <KpiCard
          helper="이슈 중 수정이 완료된 건수"
          icon="✓"
          label="수정 완료 수"
          tone="green"
          value={kpis.fixedIssues}
        />
        <KpiCard
          helper={`전체 이슈 중 수정 완료 비율 (${kpis.fixedIssues} / ${kpis.totalIssues})`}
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
          value={kpis.notIssues}
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
                <Tooltip formatter={(value) => String(value)} />
                <Legend />
                <Line
                  dataKey="reportedIssueCount"
                  name="제보 이슈 수"
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
          <table className={styles.summaryTable}>
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
                    <td>{service.supporterIssueCount}</td>
                    <td>{service.accessibilityIssueCount}</td>
                    <td>{service.fixedIssueCount}</td>
                    <td>{service.notIssueCount}</td>
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
        </SectionCard>

        <SectionCard title="이슈 아님 분석">
          <div className={styles.reasonGrid}>
            <div className={styles.reasonChart}>
              <ResponsiveContainer height={220} width="100%">
                <PieChart>
                  <Pie
                    data={notIssueReasons}
                    dataKey="count"
                    innerRadius={46}
                    nameKey="reason"
                    outerRadius={76}
                  >
                    {notIssueReasons.map((reason, index) => (
                      <Cell
                        fill={reasonColors[index % reasonColors.length]}
                        key={reason.reason}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.reasonLegend}>
                {notIssueReasons.map((reason, index) => (
                  <span key={reason.reason}>
                    <i
                      style={{
                        backgroundColor:
                          reasonColors[index % reasonColors.length],
                      }}
                    />
                    {reason.reason}
                  </span>
                ))}
              </div>
            </div>
            <table className={styles.summaryTable}>
              <thead>
                <tr>
                  <th>사유</th>
                  <th>건수</th>
                </tr>
              </thead>
              <tbody>
                {notIssueReasons.map((reason) => (
                  <tr key={reason.reason}>
                    <td>{reason.reason}</td>
                    <td>{reason.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="작성자별 제보 현황">
          <table className={styles.summaryTable}>
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
                authorStatus.map((author) => (
                  <tr key={author.authorName}>
                    <td>{author.authorName}</td>
                    <td>{author.totalReports}</td>
                    <td>{author.deliveredIssueCount}</td>
                    <td>{author.notIssueCount}</td>
                  </tr>
                ))
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
                <th>등록일</th>
                <th>작성자</th>
                <th>서비스</th>
                <th>플랫폼</th>
                <th>이슈 여부</th>
                <th>수정 여부</th>
                <th>이슈 아님 사유</th>
                <th>Jira 링크</th>
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
                              key={link.label}
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
