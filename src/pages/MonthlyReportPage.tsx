import { useMemo, useState } from "react";
import { KpiCard } from "../components/dashboard/KpiCard";
import {
  IconDelivered,
  IconFixed,
  IconNotIssue,
  IconReported,
  IconUnfixable,
} from "../components/dashboard/kpiIcons";
import { PERIOD_OPTIONS } from "../data/filterOptions";
import { useIssues } from "../features/issues/useIssues";
import { usePeriod } from "../features/period/usePeriod";
import { filterIssues, getPeriodById } from "../utils/issueFilters";
import { getMonthlyReportRows } from "../utils/issueMetrics";
import styles from "./MonthlyReportPage.module.css";

type MetricTone = "accent" | "warning" | "muted" | "success" | "critical";

function ReportMetricCell({ value, tone }: { value: number; tone: MetricTone }) {
  return (
    <div className={styles.metricCell}>
      <span className={`${styles.metricNumber} ${styles[`tone-${tone}`]}`}>
        <strong>{value}</strong>
        <small>건</small>
      </span>
    </div>
  );
}

export function MonthlyReportPage() {
  const { selectedPeriodId, setSelectedPeriodId } = usePeriod();
  const { issues } = useIssues();
  const [periodId, setPeriodId] = useState<string>(selectedPeriodId);
  const period = getPeriodById(periodId);

  const periodIssues = useMemo(
    () =>
      filterIssues(issues, {
        keyword: "",
        periodStart: period.start,
        periodEnd: period.end,
        serviceName: "전체",
        platform: "전체",
        issueStatus: "전체",
        fixStatus: "전체",
        notIssueReason: "전체",
      }),
    [issues, period.end, period.start],
  );

  const rows = useMemo(
    () => getMonthlyReportRows(periodIssues, period.start, period.end),
    [period.end, period.start, periodIssues],
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (sum, row) => ({
          supporterIssues: sum.supporterIssues + row.supporterIssues,
          deliveredIssues: sum.deliveredIssues + row.deliveredIssues,
          notIssues: sum.notIssues + row.notIssues,
          fixedIssues: sum.fixedIssues + row.fixedIssues,
          unfixableIssues: sum.unfixableIssues + row.unfixableIssues,
        }),
        {
          supporterIssues: 0,
          deliveredIssues: 0,
          notIssues: 0,
          fixedIssues: 0,
          unfixableIssues: 0,
        },
      ),
    [rows],
  );

  function updatePeriod(nextPeriodId: string) {
    setPeriodId(nextPeriodId);
    setSelectedPeriodId(nextPeriodId);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>월별 리포트</h1>
          <p>월별 제보, 전달, 수정 현황을 확인합니다.</p>
        </div>
        <label className={styles.periodControl}>
          <span>기간</span>
          <select
            id="monthly-report-period"
            name="period"
            value={periodId}
            onChange={(event) => updatePeriod(event.target.value)}
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className={styles.summaryGrid} aria-label="월별 리포트 요약">
        <KpiCard
          helper="서포터즈 스프린트 내 생성된 건수"
          icon={<IconReported />}
          label="서포터즈 이슈"
          tone="blue"
          value={`${totals.supporterIssues}건`}
        />
        <KpiCard
          helper="검토 후 이슈 아님으로 판정된 건수"
          icon={<IconNotIssue />}
          label="이슈 아님"
          tone="gray"
          value={`${totals.notIssues}건`}
        />
        <KpiCard
          helper="아지트 및 서비스팀에 전달된 건수"
          icon={<IconDelivered />}
          label="최종 전달 건수"
          tone="orange"
          value={`${totals.deliveredIssues}건`}
        />
        <KpiCard
          helper="전달 이슈 중 수정이 완료된 건수"
          icon={<IconFixed />}
          label="수정 완료"
          tone="green"
          value={`${totals.fixedIssues}건`}
        />
        <KpiCard
          helper="전달 이슈 중 수정이 불가한 건수"
          icon={<IconUnfixable />}
          label="수정 불가"
          tone="rose"
          value={`${totals.unfixableIssues}건`}
        />
      </section>

      <section className={styles.reportPanel}>
        <div className={styles.reportHeader}>
          <h2>월별 운영 리포트</h2>
          <span>
            기준 기간 {period.start.replaceAll("-", ".")} -{" "}
            {period.end.replaceAll("-", ".")}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.reportTable}>
            <thead>
              <tr>
                <th>해당 월</th>
                <th>
                  <span className={styles.headerLabel}>
                    <IconReported /> 서포터즈 이슈
                  </span>
                </th>
                <th>
                  <span className={styles.headerLabel}>
                    <IconDelivered /> 최종 전달 이슈
                  </span>
                </th>
                <th>
                  <span className={styles.headerLabel}>
                    <IconNotIssue /> 이슈 아님
                  </span>
                </th>
                <th>
                  <span className={styles.headerLabel}>
                    <IconFixed /> 수정 완료 이슈
                  </span>
                </th>
                <th>
                  <span className={styles.headerLabel}>
                    <IconUnfixable /> 수정 불가 이슈
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.month}>
                  <th scope="row">{row.monthLabel}</th>
                  <td>
                    <ReportMetricCell tone="accent" value={row.supporterIssues} />
                  </td>
                  <td>
                    <ReportMetricCell tone="warning" value={row.deliveredIssues} />
                  </td>
                  <td>
                    <ReportMetricCell tone="muted" value={row.notIssues} />
                  </td>
                  <td>
                    <ReportMetricCell tone="success" value={row.fixedIssues} />
                  </td>
                  <td>
                    <ReportMetricCell tone="critical" value={row.unfixableIssues} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
