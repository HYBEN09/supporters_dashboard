import styles from "./KpiCard.module.css";

type KpiCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export function KpiCard({ label, value, helper }: KpiCardProps) {
  return (
    <article className={styles.card}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <p>{helper}</p> : null}
    </article>
  );
}
