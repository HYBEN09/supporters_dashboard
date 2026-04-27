import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "../layouts/AdminLayout";
import { DashboardPage } from "../pages/DashboardPage";
import { IssueFormPage } from "../pages/IssueFormPage";
import { IssueListPage } from "../pages/IssueListPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/issues/new" element={<IssueFormPage />} />
        <Route path="/issues" element={<IssueListPage />} />
      </Route>
    </Routes>
  );
}
