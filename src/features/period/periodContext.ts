import { createContext } from "react";

export type PeriodContextValue = {
  selectedPeriodId: string;
  setSelectedPeriodId: (periodId: string) => void;
};

export const PeriodContext = createContext<PeriodContextValue | null>(null);
