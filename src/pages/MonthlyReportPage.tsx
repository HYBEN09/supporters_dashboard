import { useMemo, useState } from "react";
import { PERIOD_OPTIONS } from "../data/filterOptions";
import { useIssues } from "../features/issues/useIssues";
import { usePeriod } from "../features/period/usePeriod";
import { filterIssues, getPeriodById } from "../utils/issueFilters";
import { getMonthlyReportRows } from "../utils/issueMetrics";
import styles from "./MonthlyReportPage.module.css";

function formatCount(value: number) {
  return `${value}건`;
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
          notIssues: sum.notIssues + row.notIssues,
          accessibilityIssues:
            sum.accessibilityIssues + row.accessibilityIssues,
          deliveredIssues: sum.deliveredIssues + row.deliveredIssues,
          fixedIssues: sum.fixedIssues + row.fixedIssues,
        }),
        {
          supporterIssues: 0,
          notIssues: 0,
          accessibilityIssues: 0,
          deliveredIssues: 0,
          fixedIssues: 0,
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
        <article>
          <span>서포터즈 이슈</span>
          <strong>{formatCount(totals.supporterIssues)}</strong>
        </article>
        <article>
          <span>이슈 아님</span>
          <strong>{formatCount(totals.notIssues)}</strong>
        </article>
        <article>
          <span>접근성 이슈</span>
          <strong>{formatCount(totals.accessibilityIssues)}</strong>
        </article>
        <article>
          <span>최종 전달 이슈</span>
          <strong>{formatCount(totals.deliveredIssues)}</strong>
        </article>
        <article>
          <span>수정된 이슈</span>
          <strong>{formatCount(totals.fixedIssues)}</strong>
        </article>
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
                <th>서포터즈 이슈</th>
                <th>이슈 아님</th>
                <th>접근성 이슈</th>
                <th>최종 전달 이슈</th>
                <th>수정된 이슈</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.month}>
                  <th scope="row">{row.monthLabel}</th>
                  <td>{formatCount(row.supporterIssues)}</td>
                  <td>{formatCount(row.notIssues)}</td>
                  <td>{formatCount(row.accessibilityIssues)}</td>
                  <td>{formatCount(row.deliveredIssues)}</td>
                  <td>{formatCount(row.fixedIssues)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
