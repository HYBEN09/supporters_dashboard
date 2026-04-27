import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
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
import { formatPercent } from "../utils/formatters";
import {
  DEFAULT_FILTERS,
  filterIssues,
  getPeriodById,
} from "../utils/issueFilters";
import {
  getKpis,
  getMonthlyStatus,
  getNotIssueReasonStatus,
  getServiceStatus,
} from "../utils/issueMetrics";
import { KpiCard } from "../components/dashboard/KpiCard";
import { IssueTable } from "../components/tables/IssueTable";
import { Button } from "../components/ui/Button";
import { SectionCard } from "../components/ui/SectionCard";
import styles from "./DashboardPage.module.css";

const reasonColors = ["#1f6feb", "#12b76a", "#f79009", "#f04438", "#667085"];

export function DashboardPage() {
  const { selectedPeriodId } = usePeriod();
  const { issues } = useIssues();
  const [filters, setFilters] = useState<Omit<IssueFilters, "periodId">>({
    keyword: "",
    serviceName: DEFAULT_FILTERS.serviceName,
    platform: DEFAULT_FILTERS.platform,
    issueStatus: DEFAULT_FILTERS.issueStatus,
    fixStatus: DEFAULT_FILTERS.fixStatus,
  });
  const selectedPeriod = getPeriodById(selectedPeriodId);
  const effectiveFilters = useMemo(
    () => ({ ...filters, periodId: selectedPeriodId }),
    [filters, selectedPeriodId],
  );

  const filteredIssues = useMemo(
    () => filterIssues(issues, effectiveFilters),
    [effectiveFilters, issues],
  );
  const kpis = useMemo(() => getKpis(filteredIssues), [filteredIssues]);
  const monthlyStatus = useMemo(
    () => getMonthlyStatus(filteredIssues),
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

  const periodSummary = `${selectedPeriod.start.replaceAll("-", ".")} - ${selectedPeriod.end.replaceAll("-", ".")}`;
  const currentSummary = `현재 조회: 전체 기간 · ${filters.serviceName} 서비스 · ${filters.platform} 플랫폼`;

  function updateFilter<Key extends keyof Omit<IssueFilters, "periodId">>(
    key: Key,
    value: Omit<IssueFilters, "periodId">[Key],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters({
      keyword: "",
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
              <input readOnly type="date" value={selectedPeriod.start} />
              <span aria-hidden="true">~</span>
              <input readOnly type="date" value={selectedPeriod.end} />
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
                <YAxis yAxisId="count" allowDecimals={false} />
                <YAxis
                  yAxisId="rate"
                  orientation="right"
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip formatter={(value) => String(value)} />
                <Legend />
                <Line
                  dataKey="issueCount"
                  name="월별 이슈 수"
                  stroke="#1f6feb"
                  strokeWidth={2}
                  type="monotone"
                  yAxisId="count"
                />
                <Line
                  dataKey="fixedCount"
                  name="월별 수정 완료 수"
                  stroke="#12b76a"
                  strokeWidth={2}
                  type="monotone"
                  yAxisId="count"
                />
                <Line
                  dataKey="improvementRate"
                  name="월별 개선율"
                  stroke="#f79009"
                  strokeWidth={2}
                  type="monotone"
                  yAxisId="rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="서비스별 현황">
          <div className={styles.chartBox}>
            <ResponsiveContainer height={300} width="100%">
              <BarChart data={serviceStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="serviceName" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="issueCount" fill="#1f6feb" name="이슈 수" />
                <Bar dataKey="fixedCount" fill="#12b76a" name="수정 완료 수" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className={styles.summaryTable}>
            <thead>
              <tr>
                <th>서비스</th>
                <th>전체</th>
                <th>이슈</th>
                <th>수정 완료</th>
                <th>개선율</th>
              </tr>
            </thead>
            <tbody>
              {serviceStatus.map((service) => (
                <tr key={service.serviceName}>
                  <td>{service.serviceName}</td>
                  <td>{service.totalReports}</td>
                  <td>{service.issueCount}</td>
                  <td>{service.fixedCount}</td>
                  <td>{formatPercent(service.improvementRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="이슈 아님 분석">
          <div className={styles.reasonGrid}>
            <ResponsiveContainer height={260} width="100%">
              <PieChart>
                <Pie
                  data={notIssueReasons}
                  dataKey="count"
                  innerRadius={52}
                  nameKey="reason"
                  outerRadius={86}
                >
                  {notIssueReasons.map((reason, index) => (
                    <Cell
                      fill={reasonColors[index % reasonColors.length]}
                      key={reason.reason}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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
      </div>

      <SectionCard title="상세 데이터">
        <IssueTable items={filteredIssues} />
      </SectionCard>
    </>
  );
}
