import { useContext } from "react";
import { IssueContext } from "./issueContext";

export function useIssues() {
  const context = useContext(IssueContext);

  if (!context) {
    throw new Error("useIssues must be used within IssueProvider");
  }

  return context;
}
