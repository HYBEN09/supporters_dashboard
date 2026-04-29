import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";

const navItems = [
  { end: true, label: "대시보드", to: "/dashboard" },
  { end: true, label: "이슈 입력", to: "/issues/new" },
  { end: true, label: "이슈 리스트", to: "/issues" },
];

export function Navbar() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>✓</span>
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
          <div className={styles.profile} aria-label="관리자 프로필">
            <span className={styles.avatar}></span>
            <div>
              <strong>관리자</strong>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
