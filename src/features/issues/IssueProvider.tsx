import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  FixStatus,
  IssueItem,
  NotIssueReason,
  Platform,
  ServiceName,
} from "../../types/issue";
import {
  deleteIssueFromStorage,
  loadIssuesFromStorage,
  saveIssueToStorage,
  updateIssueInStorage,
} from "../../services/issueStorage";
import { IssueContext, type IssueUpdate, type NewIssueItem } from "./issueContext";

type IssueProviderProps = {
  children: React.ReactNode;
};

function createIssueId() {
  const datePart = new Date()
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(".", "")
    .slice(0, 14);
  const randomPart = crypto.randomUUID().slice(0, 4).toUpperCase();

  return `ISS-${datePart}-${randomPart}`;
}

const LEGACY_MOCK_ISSUE_IDS = new Set(
  Array.from(
    { length: 36 },
    (_, index) => `ISS-${String(index + 1).padStart(3, "0")}`,
  ),
);

const LEGACY_SERVICE_NAME_MAP: Record<string, ServiceName> = {
  "서비스 A": "카카오톡",
  "서비스 B": "멜론",
  "서비스 C": "카카오페이",
  "서비스 D": "카카오페이지",
  "서비스 E": "카카오맵",
};

const LEGACY_PLATFORM_MAP: Record<string, Platform> = {
  Web: "WIN",
};

const LEGACY_NOT_ISSUE_REASON_MAP: Record<string, NotIssueReason> = {
  "기획 의도에 부합": "정상 작동(이슈 재현 안됨)",
  "중복 제보": "기타",
  "사용자 오인": "사용성 이슈",
  "개선 불가": "기타",
};

function migrateLegacyValues(issues: IssueItem[]) {
  return issues.map((issue) => ({
    ...issue,
    serviceName: LEGACY_SERVICE_NAME_MAP[issue.serviceName] ?? issue.serviceName,
    platform: LEGACY_PLATFORM_MAP[issue.platform] ?? issue.platform,
    fixStatus: getMigratedFixStatus(issue),
    notIssueReason: issue.notIssueReason
      ? LEGACY_NOT_ISSUE_REASON_MAP[issue.notIssueReason] ?? issue.notIssueReason
      : undefined,
  }));
}

function getMigratedFixStatus(issue: IssueItem): FixStatus {
  if (issue.issueStatus === "이슈 아님") {
    return "-";
  }

  return issue.fixStatus === "-" ? "수정 필요" : issue.fixStatus;
}

function removeSeedMockIssues(issues: IssueItem[]) {
  return issues.filter((issue) => !LEGACY_MOCK_ISSUE_IDS.has(issue.id));
}

async function getInitialIssues() {
  try {
    const savedIssues = await loadIssuesFromStorage();

    if (savedIssues.length === 0) {
      return [];
    }

    return migrateLegacyValues(removeSeedMockIssues(savedIssues));
  } catch {
    return [];
  }
}

export function IssueProvider({ children }: IssueProviderProps) {
  const [issues, setIssues] = useState<IssueItem[]>([]);

  function reportStorageError(error: unknown) {
    console.error("Failed to sync issue storage.", error);
  }

  useEffect(() => {
    let isMounted = true;

    getInitialIssues().then((storedIssues) => {
      if (isMounted) {
        setIssues(storedIssues);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const addIssue = useCallback((issue: NewIssueItem) => {
    const newIssue = {
      ...issue,
      id: createIssueId(),
    };

    setIssues((current) => {
      const nextIssues = [newIssue, ...current];
      void saveIssueToStorage(newIssue).catch(reportStorageError);

      return nextIssues;
    });

    return newIssue;
  }, []);

  const updateIssue = useCallback((id: string, updates: IssueUpdate) => {
    setIssues((current) => {
      const nextIssues = current.map((issue) =>
        issue.id === id ? { ...issue, ...updates } : issue,
      );
      void updateIssueInStorage(id, nextIssues).catch(reportStorageError);

      return nextIssues;
    });
  }, []);

  const deleteIssue = useCallback((id: string) => {
    setIssues((current) => {
      const nextIssues = current.filter((issue) => issue.id !== id);
      void deleteIssueFromStorage(id).catch(reportStorageError);

      return nextIssues;
    });
  }, []);

  const value = useMemo(
    () => ({ issues, addIssue, updateIssue, deleteIssue }),
    [addIssue, deleteIssue, issues, updateIssue],
  );

  return (
    <IssueContext.Provider value={value}>{children}</IssueContext.Provider>
  );
}
