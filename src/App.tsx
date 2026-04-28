import { BrowserRouter } from "react-router-dom";
import { IssueProvider } from "./features/issues/IssueProvider";
import { PeriodProvider } from "./features/period/PeriodProvider";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <PeriodProvider>
        <IssueProvider>
          <AppRoutes />
        </IssueProvider>
      </PeriodProvider>
    </BrowserRouter>
  );
}

export default App;
