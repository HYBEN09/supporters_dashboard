import type { FixStatus, IssueStatus } from "../../types/issue";
import styles from "./StatusBadge.module.css";

type StatusBadgeProps = {
  value: IssueStatus | FixStatus;
};

export function StatusBadge({ value }: StatusBadgeProps) {
  const tone =
    value === "이슈"
      ? "danger"
      : value === "이슈 아님"
        ? "neutral"
        : value === "수정 완료"
          ? "success"
          : "warning";

  return <span className={`${styles.badge} ${styles[tone]}`}>{value}</span>;
}
