import type { ReactNode } from "react";
import styles from "./FilterBar.module.css";

type FilterBarProps = {
  children: ReactNode;
  actions?: ReactNode;
};

export function FilterBar({ children, actions }: FilterBarProps) {
  return (
    <section className={styles.filterBar} aria-label="필터">
      <div className={styles.fields}>{children}</div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </section>
  );
}

type FieldProps = {
  label: string;
  children: ReactNode;
};

export function FilterField({ label, children }: FieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}
