import type { ReactNode } from "react";
import styles from "./SectionCard.module.css";

type SectionCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className={styles.card}>
      {title ? (
        <div className={styles.header}>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
