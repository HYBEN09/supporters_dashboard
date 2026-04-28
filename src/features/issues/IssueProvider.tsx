import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IssueItem, Platform, ServiceName } from "../../types/issue";
import { IssueContext, type IssueUpdate, type NewIssueItem } from "./issueContext";

type IssueProviderProps = {
  children: React.ReactNode;
};

function createIssueId(sequence: number) {
  return `ISS-${String(sequence).padStart(3, "0")}`;
}

const STORAGE_KEY = "supporters-issues";
const MOCK_REMOVAL_KEY = "supporters-issues-mock-data-removed";
const MOCK_REMOVAL_V2_KEY = "supporters-issues-mock-data-removed-v2";

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

function migrateLegacyValues(issues: IssueItem[]) {
  return issues.map((issue) => ({
    ...issue,
    serviceName: LEGACY_SERVICE_NAME_MAP[issue.serviceName] ?? issue.serviceName,
    platform: LEGACY_PLATFORM_MAP[issue.platform] ?? issue.platform,
  }));
}

function removeSeedMockIssues(issues: IssueItem[]) {
  if (localStorage.getItem(MOCK_REMOVAL_V2_KEY) === "true") {
    return issues;
  }

  localStorage.setItem(MOCK_REMOVAL_KEY, "true");
  localStorage.setItem(MOCK_REMOVAL_V2_KEY, "true");
  return issues.filter((issue) => !LEGACY_MOCK_ISSUE_IDS.has(issue.id));
}

function getInitialIssues() {
  try {
    const savedIssues = localStorage.getItem(STORAGE_KEY);

    if (!savedIssues) {
      localStorage.setItem(MOCK_REMOVAL_KEY, "true");
      localStorage.setItem(MOCK_REMOVAL_V2_KEY, "true");
      return [];
    }

    const parsedIssues = JSON.parse(savedIssues) as IssueItem[];

    if (!Array.isArray(parsedIssues)) {
      localStorage.setItem(MOCK_REMOVAL_KEY, "true");
      localStorage.setItem(MOCK_REMOVAL_V2_KEY, "true");
      return [];
    }

    return migrateLegacyValues(removeSeedMockIssues(parsedIssues));
  } catch {
    localStorage.setItem(MOCK_REMOVAL_KEY, "true");
    localStorage.setItem(MOCK_REMOVAL_V2_KEY, "true");
    return [];
  }
}

function getNextSequence(issues: IssueItem[]) {
  const maxSequence = issues.reduce((max, issue) => {
    const sequence = Number(issue.id.replace("ISS-", ""));
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0);

  return maxSequence + 1;
}

export function IssueProvider({ children }: IssueProviderProps) {
  const [issues, setIssues] = useState<IssueItem[]>(getInitialIssues);
  const nextSequence = useRef(getNextSequence(issues));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  }, [issues]);

  const addIssue = useCallback((issue: NewIssueItem) => {
    const newIssue = {
      ...issue,
      id: createIssueId(nextSequence.current),
    };

    nextSequence.current += 1;
    setIssues((current) => [newIssue, ...current]);
    return newIssue;
  }, []);

  const updateIssue = useCallback((id: string, updates: IssueUpdate) => {
    setIssues((current) =>
      current.map((issue) =>
        issue.id === id ? { ...issue, ...updates } : issue,
      ),
    );
  }, []);

  const deleteIssue = useCallback((id: string) => {
    setIssues((current) => current.filter((issue) => issue.id !== id));
  }, []);

  const value = useMemo(
    () => ({ issues, addIssue, updateIssue, deleteIssue }),
    [addIssue, deleteIssue, issues, updateIssue],
  );

  return (
    <IssueContext.Provider value={value}>{children}</IssueContext.Provider>
  );
}
