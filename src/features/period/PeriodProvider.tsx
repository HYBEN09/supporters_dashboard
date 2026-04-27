import { useMemo, useState } from "react";
import { PERIOD_OPTIONS } from "../../data/filterOptions";
import { PeriodContext } from "./periodContext";

type PeriodProviderProps = {
  children: React.ReactNode;
};

export function PeriodProvider({ children }: PeriodProviderProps) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    PERIOD_OPTIONS[1].id,
  );

  const value = useMemo(
    () => ({ selectedPeriodId, setSelectedPeriodId }),
    [selectedPeriodId],
  );

  return (
    <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
  );
}
