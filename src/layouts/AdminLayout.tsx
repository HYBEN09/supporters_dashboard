import { Outlet } from "react-router-dom";
import { Navbar } from "../components/navigation/Navbar";
import styles from "./AdminLayout.module.css";

export function AdminLayout() {
  return (
    <div className={styles.shell}>
      <Navbar />
      <main className={styles.main} aria-label="관리자 페이지 본문">
        <Outlet />
      </main>
    </div>
  );
}
