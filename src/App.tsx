import { BrowserRouter } from "react-router-dom";
import { IssueProvider } from "./features/issues/IssueProvider";
import { PeriodProvider } from "./features/period/PeriodProvider";
import { ThemeProvider } from "./features/theme/ThemeProvider";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <PeriodProvider>
          <IssueProvider>
            <AppRoutes />
          </IssueProvider>
        </PeriodProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
