import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { useIssues } from "../../features/issues/useIssues";
import { useTheme } from "../../features/theme/useTheme";
import { LoginControl } from "../auth/LoginControl";
import styles from "./Navbar.module.css";

const navItems = [
  { end: true, label: "대시보드", to: "/dashboard" },
  { end: true, label: "월별 리포트", to: "/reports/monthly" },
  { end: true, label: "이슈 리스트", to: "/issues" },
  { end: true, label: "이슈 입력", to: "/issues/new" },
];

export function Navbar() {
  const { isAuthenticated } = useAuth();
  const { deletedCount } = useIssues();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span aria-hidden="true" className={styles.brandIcon}>
            ✓
          </span>
          서포터즈 제보 관리
        </div>
        <nav className={styles.nav} aria-label="주요 메뉴">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
              end={item.end}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.actions}>
          {isAuthenticated ? (
            <div className={styles.trashButtonWrap}>
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? `${styles.trashButton} ${styles.trashButtonActive}`
                    : styles.trashButton
                }
                end
                to="/issues/trash"
              >
                휴지통
              </NavLink>
              {deletedCount > 0 ? (
                <span className={styles.navBadge}>{deletedCount}</span>
              ) : null}
            </div>
          ) : null}
          <button
            aria-label={
              theme === "dark"
                ? "라이트 모드로 전환"
                : "다크 모드로 전환"
            }
            className={styles.themeButton}
            type="button"
            onClick={toggleTheme}
          >
            <span aria-hidden="true">{theme === "dark" ? "☀" : "◐"}</span>
            {theme === "dark" ? "라이트" : "다크"}
          </button>
          <LoginControl />
        </div>
      </div>
    </header>
  );
}
