import { HashRouter } from "react-router-dom";
import { IssueProvider } from "./features/issues/IssueProvider";
import { PeriodProvider } from "./features/period/PeriodProvider";
import { ThemeProvider } from "./features/theme/ThemeProvider";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <PeriodProvider>
          <IssueProvider>
            <AppRoutes />
          </IssueProvider>
        </PeriodProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

export default App;
