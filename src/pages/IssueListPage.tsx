import { useMemo, useState } from "react";
import {
  FIX_STATUS_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  PERIOD_OPTIONS,
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
import { filterIssues, DEFAULT_FILTERS } from "../utils/issueFilters";
import { getKpis } from "../utils/issueMetrics";
import { KpiCard } from "../components/dashboard/KpiCard";
import { FilterBar, FilterField } from "../components/filters/FilterBar";
import { IssueTable } from "../components/tables/IssueTable";
import { Button } from "../components/ui/Button";
import { DetailModal } from "../components/ui/DetailModal";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { SectionCard } from "../components/ui/SectionCard";
import styles from "./IssueListPage.module.css";

export function IssueListPage() {
  const { selectedPeriodId, setSelectedPeriodId } = usePeriod();
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
  const effectiveAppliedFilters = useMemo(
    () => ({ ...appliedFilters, periodId: selectedPeriodId }),
    [appliedFilters, selectedPeriodId],
  );

  const filteredIssues = useMemo(
    () => filterIssues(issues, effectiveAppliedFilters),
    [effectiveAppliedFilters, issues],
  );
  const kpis = useMemo(() => getKpis(filteredIssues), [filteredIssues]);
  const pagination = usePagination(filteredIssues, 8);

  function updateDraft<Key extends keyof Omit<IssueFilters, "periodId">>(
    key: Key,
    value: Omit<IssueFilters, "periodId">[Key],
  ) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
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
  }

  return (
    <>
      <PageHeader
        title="이슈 리스트 뷰"
        description="등록된 제보를 검색하고 상세 정보를 확인합니다."
      />

      <FilterBar
        actions={
          <>
            <Button variant="primary" onClick={applyFilters}>
              조회
            </Button>
            <Button variant="secondary" onClick={resetFilters}>
              초기화
            </Button>
          </>
        }
      >
        <FilterField label="검색어">
          <input
            placeholder="작성자, 경로, 지라 번호"
            value={draftFilters.keyword}
            onChange={(event) => updateDraft("keyword", event.target.value)}
          />
        </FilterField>
        <FilterField label="기간">
          <select
            value={selectedPeriodId}
            onChange={(event) => setSelectedPeriodId(event.target.value)}
          >
            {PERIOD_OPTIONS.map((period) => (
              <option key={period.id} value={period.id}>
                {period.label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="서비스">
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
        </FilterField>
        <FilterField label="플랫폼">
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
        </FilterField>
        <FilterField label="이슈 여부">
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
        </FilterField>
        <FilterField label="수정 여부">
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
        </FilterField>
      </FilterBar>

      <div className={styles.summaryGrid}>
        <KpiCard label="전체" value={kpis.totalReports} />
        <KpiCard label="이슈" value={kpis.totalIssues} />
        <KpiCard label="이슈 아님" value={kpis.notIssues} />
        <KpiCard label="수정 완료" value={kpis.fixedIssues} />
      </div>

      <SectionCard title="제보 리스트">
        <IssueTable
          showDetail
          items={pagination.paginatedItems}
          onSelectIssue={setSelectedIssue}
        />
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onChange={pagination.goToPage}
        />
      </SectionCard>

      <DetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </>
  );
}
