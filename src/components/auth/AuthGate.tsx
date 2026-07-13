import type { ReactNode } from "react";
import { useAuth } from "../../features/auth/useAuth";
import { Button } from "../ui/Button";
import styles from "./AuthGate.module.css";

type AuthGateProps = {
  title: string;
  description: ReactNode;
};

export function AuthGate({ title, description }: AuthGateProps) {
  const { openLoginPanel } = useAuth();

  return (
    <div className={styles.authNotice}>
      <span className={styles.authNoticeIcon} aria-hidden="true">
        <svg fill="none" viewBox="0 0 24 24">
          <rect height="11" rx="2" width="16" x="4" y="10" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      <Button variant="primary" onClick={openLoginPanel}>
        로그인하기
      </Button>
    </div>
  );
}
