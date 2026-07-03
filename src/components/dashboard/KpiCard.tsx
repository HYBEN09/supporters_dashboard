import styles from "./KpiCard.module.css";

type KpiCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon?: string;
  progressValue?: number;
  tone?: "blue" | "orange" | "green" | "purple" | "gray" | "rose";
};

export function KpiCard({
  label,
  value,
  helper,
  icon,
  progressValue,
  tone = "blue",
}: KpiCardProps) {
  return (
    <article className={`${styles.card} ${styles[tone]}`}>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span className={styles.label}>{label}</span>
      <strong>{value}</strong>
      {typeof progressValue === "number" ? (
        <div className={styles.progress} aria-hidden="true">
          <span style={{ width: `${Math.min(progressValue, 100)}%` }} />
        </div>
      ) : null}
      {helper ? <p>{helper}</p> : null}
    </article>
  );
}
