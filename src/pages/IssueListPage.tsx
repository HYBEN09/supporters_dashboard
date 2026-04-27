import { useMemo, useState } from "react";
import {
  FIX_STATUS_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  PLATFORM_OPTIONS,
  SERVICE_OPTIONS,
} from "../data/filterOptions";
import { useIssues } from "../features/issues/useIssues";
import { usePeriod } from "../features/period/usePeriod";
import { usePagination } from "../hooks/usePagination";
import type {
  FixStatus,
  IssueFilters,
  IssueItem,
  IssueStatus,
  Platform,
  SelectableFilter,
  ServiceName,
} from "../types/issue";
import { createJiraUrl, formatDate } from "../utils/formatters";
import {
  DEFAULT_FILTERS,
  filterIssues,
  getPeriodById,
} from "../utils/issueFilters";
import { getKpis } from "../utils/issueMetrics";
import { KpiCard } from "../components/dashboard/KpiCard";
import { Button } from "../components/ui/Button";
import { DetailModal } from "../components/ui/DetailModal";
import { Pagination } from "../components/ui/Pagination";
import { StatusBadge } from "../components/ui/StatusBadge";
import styles from "./IssueListPage.module.css";

export function IssueListPage() {
  const { selectedPeriodId } = usePeriod();
  const { issues } = useIssues();
  const [draftFilters, setDraftFilters] = useState<Omit<IssueFilters, "periodId">>({
    keyword: "",
    serviceName: DEFAULT_FILTERS.serviceName,
    platform: DEFAULT_FILTERS.platform,
    issueStatus: DEFAULT_FILTERS.issueStatus,
    fixStatus: DEFAULT_FILTERS.fixStatus,
  });
  const [appliedFilters, setAppliedFilters] = useState<
    Omit<IssueFilters, "periodId">
  >({
    keyword: "",
    serviceName: DEFAULT_FILTERS.serviceName,
    platform: DEFAULT_FILTERS.platform,
    issueStatus: DEFAULT_FILTERS.issueStatus,
    fixStatus: DEFAULT_FILTERS.fixStatus,
  });
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const selectedPeriod = getPeriodById(selectedPeriodId);
  const effectiveAppliedFilters = useMemo(
    () => ({ ...appliedFilters, periodId: selectedPeriodId }),
    [appliedFilters, selectedPeriodId],
  );

  const filteredIssues = useMemo(
    () => filterIssues(issues, effectiveAppliedFilters),
    [effectiveAppliedFilters, issues],
  );
  const kpis = useMemo(() => getKpis(filteredIssues), [filteredIssues]);
  const pagination = usePagination(filteredIssues, 5);
  const periodSummary = `${selectedPeriod.start.replaceAll("-", ".")} - ${selectedPeriod.end.replaceAll("-", ".")}`;
  const currentSummary = `현재 조회: 전체 기간 · ${appliedFilters.serviceName} 서비스 · ${appliedFilters.platform} 플랫폼`;

  function updateDraft<Key extends keyof Omit<IssueFilters, "periodId">>(
    key: Key,
    value: Omit<IssueFilters, "periodId">[Key],
  ) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
    pagination.goToPage(1);
  }

  function resetFilters() {
    const nextFilters = {
      keyword: "",
      serviceName: DEFAULT_FILTERS.serviceName,
      platform: DEFAULT_FILTERS.platform,
      issueStatus: DEFAULT_FILTERS.issueStatus,
      fixStatus: DEFAULT_FILTERS.fixStatus,
    };
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    pagination.goToPage(1);
  }

  return (
    <>
      <header className={styles.header}>
        <h1>이슈 리스트 뷰</h1>
        <p>등록된 제보를 검색하고 상세 정보를 확인합니다.</p>
      </header>

      <section className={styles.filterPanel} aria-label="이슈 목록 필터">
        <div className={styles.filterGrid}>
          <label className={styles.filterField}>
            <span>검색어</span>
            <input
              placeholder="작성자, 경로, 지라 번호"
              value={draftFilters.keyword}
              onChange={(event) => updateDraft("keyword", event.target.value)}
            />
          </label>

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
              value={draftFilters.serviceName}
              onChange={(event) =>
                updateDraft(
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
              value={draftFilters.platform}
              onChange={(event) =>
                updateDraft(
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
              value={draftFilters.issueStatus}
              onChange={(event) =>
                updateDraft(
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
              value={draftFilters.fixStatus}
              onChange={(event) =>
                updateDraft(
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

          <div className={styles.actions}>
            <Button variant="primary" onClick={applyFilters}>
              조회
            </Button>
            <Button variant="secondary" onClick={resetFilters}>
              초기화
            </Button>
          </div>
        </div>
        <p className={styles.currentSummary}>
          {currentSummary} · 기준 기간 {periodSummary}
        </p>
      </section>

      <div className={styles.summaryGrid}>
        <KpiCard
          helper="조회 기간 내 등록된 전체 제보"
          icon="▣"
          label="전체"
          tone="blue"
          value={kpis.totalReports}
        />
        <KpiCard
          helper="접근성·사용성 이슈로 판정된 건수"
          icon="!"
          label="이슈"
          tone="orange"
          value={kpis.totalIssues}
        />
        <KpiCard
          helper="검토 후 이슈 아님으로 판정된 건수"
          icon="⊘"
          label="이슈 아님"
          tone="gray"
          value={kpis.notIssues}
        />
        <KpiCard
          helper="이슈 중 수정이 완료된 건수"
          icon="✓"
          label="수정 완료"
          tone="green"
          value={kpis.fixedIssues}
        />
      </div>

      <section className={styles.listPanel}>
        <div className={styles.listHeader}>
          <h2>이슈 목록</h2>
          <span>
            총 <strong>{filteredIssues.length}</strong>건
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>등록일</th>
                <th>작성자</th>
                <th>서비스</th>
                <th>플랫폼</th>
                <th>실행 경로</th>
                <th>이슈 여부</th>
                <th>수정 여부</th>
                <th>지라 번호</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedItems.length > 0 ? (
                pagination.paginatedItems.map((issue) => (
                  <tr key={issue.id}>
                    <td>{formatDate(issue.registeredAt)}</td>
                    <td>{issue.authorName}</td>
                    <td>{issue.serviceName}</td>
                    <td>{issue.platform}</td>
                    <td>{issue.path}</td>
                    <td>
                      <StatusBadge value={issue.issueStatus} />
                    </td>
                    <td>
                      <StatusBadge value={issue.fixStatus} />
                    </td>
                    <td>
                      {issue.jiraKey ? (
                        <a
                          href={createJiraUrl(issue.jiraKey)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {issue.jiraKey}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <button
                        className={styles.detailButton}
                        type="button"
                        onClick={() => setSelectedIssue(issue)}
                      >
                        보기
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className={styles.empty} colSpan={9}>
                    표시할 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onChange={pagination.goToPage}
        />
      </section>

      <DetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </>
  );
}
