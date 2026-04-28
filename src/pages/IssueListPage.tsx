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
import { formatDate, getIssueJiraLinks } from "../utils/formatters";
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
  const { deleteIssue, issues, updateIssue } = useIssues();
  const selectedPeriod = getPeriodById(selectedPeriodId);
  const defaultFilters: IssueFilters = {
    ...DEFAULT_FILTERS,
    periodStart: selectedPeriod.start,
    periodEnd: selectedPeriod.end,
  };
  const [draftFilters, setDraftFilters] =
    useState<IssueFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<IssueFilters>(defaultFilters);
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);

  const filteredIssues = useMemo(
    () => filterIssues(issues, appliedFilters),
    [appliedFilters, issues],
  );
  const kpis = useMemo(() => getKpis(filteredIssues), [filteredIssues]);
  const pagination = usePagination(filteredIssues, 5);
  const periodSummary = `${appliedFilters.periodStart.replaceAll("-", ".")} - ${appliedFilters.periodEnd.replaceAll("-", ".")}`;
  const currentSummary = `현재 조회: 전체 기간 · ${appliedFilters.serviceName} 서비스 · ${appliedFilters.platform} 플랫폼`;

  function updateDraft<Key extends keyof IssueFilters>(
    key: Key,
    value: IssueFilters[Key],
  ) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
    pagination.goToPage(1);
  }

  function resetFilters() {
    const nextFilters = {
      ...DEFAULT_FILTERS,
      periodStart: selectedPeriod.start,
      periodEnd: selectedPeriod.end,
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
              placeholder="작성자, Jira 링크"
              value={draftFilters.keyword}
              onChange={(event) => updateDraft("keyword", event.target.value)}
            />
          </label>

          <label className={styles.dateField}>
            <span>기간</span>
            <div className={styles.dateRange}>
              <input
                aria-label="조회 시작일"
                max={draftFilters.periodEnd || undefined}
                type="date"
                value={draftFilters.periodStart}
                onChange={(event) =>
                  updateDraft("periodStart", event.target.value)
                }
              />
              <span aria-hidden="true">~</span>
              <input
                aria-label="조회 종료일"
                min={draftFilters.periodStart || undefined}
                type="date"
                value={draftFilters.periodEnd}
                onChange={(event) =>
                  updateDraft("periodEnd", event.target.value)
                }
              />
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
                <th>이슈 여부</th>
                <th>수정 여부</th>
                <th>이슈 아님 사유</th>
                <th>Jira 링크</th>
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

      <DetailModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onDelete={(id) => {
          deleteIssue(id);
          setSelectedIssue(null);
        }}
        onSave={(id, updates) => {
          updateIssue(id, updates);
          setSelectedIssue((current) =>
            current?.id === id ? { ...current, ...updates } : current,
          );
        }}
      />
    </>
  );
}
