import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mockIssues } from "../../data/mockIssues";
import type { IssueItem } from "../../types/issue";
import { IssueContext, type IssueUpdate, type NewIssueItem } from "./issueContext";

type IssueProviderProps = {
  children: React.ReactNode;
};

function createIssueId(sequence: number) {
  return `ISS-${String(sequence).padStart(3, "0")}`;
}

const STORAGE_KEY = "supporters-issues";

function getInitialIssues() {
  try {
    const savedIssues = localStorage.getItem(STORAGE_KEY);

    if (!savedIssues) {
      return mockIssues;
    }

    const parsedIssues = JSON.parse(savedIssues) as IssueItem[];
    return Array.isArray(parsedIssues) ? parsedIssues : mockIssues;
  } catch {
    return mockIssues;
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
