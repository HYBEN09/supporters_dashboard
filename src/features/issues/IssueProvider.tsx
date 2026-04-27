import { useCallback, useMemo, useRef, useState } from "react";
import { mockIssues } from "../../data/mockIssues";
import type { IssueItem } from "../../types/issue";
import { IssueContext, type IssueUpdate, type NewIssueItem } from "./issueContext";

type IssueProviderProps = {
  children: React.ReactNode;
};

function createIssueId(sequence: number) {
  return `ISS-${String(sequence).padStart(3, "0")}`;
}

export function IssueProvider({ children }: IssueProviderProps) {
  const [issues, setIssues] = useState<IssueItem[]>(mockIssues);
  const nextSequence = useRef(mockIssues.length + 1);

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

  const value = useMemo(
    () => ({ issues, addIssue, updateIssue }),
    [addIssue, issues, updateIssue],
  );

  return (
    <IssueContext.Provider value={value}>{children}</IssueContext.Provider>
  );
}
