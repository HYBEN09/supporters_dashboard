import styles from "./KpiCard.module.css";

type KpiCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon?: string;
  progressValue?: number;
  tone?: "blue" | "orange" | "green" | "purple" | "gray";
};

export function KpiCard({
  label,
  value,
  helper,
  icon,
  progressValue,
  tone = "blue",
}: KpiCardProps) {
  const displayLabel =
    tone === "blue"
      ? "서포터즈 이슈 수"
      : tone === "orange"
        ? "최종 전달 이슈 수"
        : label;
  const displayHelper =
    tone === "blue"
      ? "조회 기간 내 등록된 서포터즈 이슈"
      : tone === "orange"
        ? "서비스 전달 링크가 등록된 이슈"
        : helper;

  return (
    <article className={`${styles.card} ${styles[tone]}`}>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span className={styles.label}>{displayLabel}</span>
      <strong>{value}</strong>
      {typeof progressValue === "number" ? (
        <div className={styles.progress} aria-hidden="true">
          <span style={{ width: `${Math.min(progressValue, 100)}%` }} />
        </div>
      ) : null}
      {displayHelper ? <p>{displayHelper}</p> : null}
    </article>
  );
}
