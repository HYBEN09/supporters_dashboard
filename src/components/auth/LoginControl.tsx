import { useEffect, useState } from "react";
import { useAuth } from "../../features/auth/useAuth";
import { Button } from "../ui/Button";
import styles from "./LoginControl.module.css";

export function LoginControl() {
  const {
    closeLoginPanel,
    isAuthenticated,
    isLoading,
    isLoginPanelOpen,
    openLoginPanel,
    signIn,
    signOut,
    user,
  } = useAuth();
  const [ldapId, setLdapId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoginPanelOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeLoginPanel();
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closeLoginPanel, isLoginPanelOpen]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isProfileMenuOpen]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await signIn(ldapId, password);

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setPassword("");
    closeLoginPanel();
  }

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user) {
    return (
      <div className={styles.profileControl}>
        <button
          aria-expanded={isProfileMenuOpen}
          className={styles.profileTrigger}
          type="button"
          onClick={() => setIsProfileMenuOpen((current) => !current)}
        >
          <span className={styles.avatar} aria-hidden="true">
            {user.ldapId.slice(0, 1).toUpperCase()}
          </span>
          <span className={styles.profileName}>{user.ldapId}</span>
          <span className={styles.chevron} aria-hidden="true">
            <svg fill="none" viewBox="0 0 24 24">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>
        {isProfileMenuOpen ? (
          <>
            <div
              className={styles.backdrop}
              role="presentation"
              onClick={() => setIsProfileMenuOpen(false)}
            />
            <div className={styles.profileMenu} role="menu">
              <div className={styles.profileMenuHeader}>
                <strong>{user.ldapId}</strong>
                <span>로그인됨</span>
              </div>
              <button
                className={styles.profileMenuItem}
                role="menuitem"
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  void signOut();
                }}
              >
                로그아웃
              </button>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.loginControl}>
      <Button
        aria-expanded={isLoginPanelOpen}
        variant="secondary"
        onClick={() => (isLoginPanelOpen ? closeLoginPanel() : openLoginPanel())}
      >
        로그인
      </Button>
      {isLoginPanelOpen ? (
        <>
          <div
            className={styles.backdrop}
            role="presentation"
            onClick={closeLoginPanel}
          />
          <form
            aria-label="로그인"
            className={styles.loginBox}
            onSubmit={handleSubmit}
          >
            <label>
              <span>아이디</span>
              <input
                autoFocus
                id="login-ldap-id"
                name="ldapId"
                placeholder="예: polar.09"
                value={ldapId}
                onChange={(event) => setLdapId(event.target.value)}
              />
            </label>
            <label>
              <span>비밀번호</span>
              <input
                id="login-password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error ? <p className={styles.error}>{error}</p> : null}
            <Button
              disabled={isSubmitting || !ldapId || !password}
              type="submit"
              variant="primary"
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </>
      ) : null}
    </div>
  );
}
