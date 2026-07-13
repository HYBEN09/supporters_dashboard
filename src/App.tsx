import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthProvider";
import { IssueProvider } from "./features/issues/IssueProvider";
import { PeriodProvider } from "./features/period/PeriodProvider";
import { ThemeProvider } from "./features/theme/ThemeProvider";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <AuthProvider>
          <PeriodProvider>
            <IssueProvider>
              <AppRoutes />
            </IssueProvider>
          </PeriodProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
