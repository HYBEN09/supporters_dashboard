import { createContext } from "react";
import type { IssueItem } from "../../types/issue";

export type NewIssueItem = Omit<IssueItem, "id">;

export type IssueUpdate = Partial<Omit<IssueItem, "id">>;

export type IssueContextValue = {
  issues: IssueItem[];
  addIssue: (issue: NewIssueItem) => IssueItem;
  updateIssue: (id: string, updates: IssueUpdate) => void;
  deleteIssue: (id: string) => void;
};

export const IssueContext = createContext<IssueContextValue | null>(null);
