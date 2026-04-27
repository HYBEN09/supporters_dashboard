import styles from "./PageHeader.module.css";

type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
