import { useMemo, useState } from "react";
import { PERIOD_OPTIONS } from "../../data/filterOptions";
import { getTodayDateString } from "../../utils/issueFilters";
import { PeriodContext } from "./periodContext";

type PeriodProviderProps = {
  children: React.ReactNode;
};

export function PeriodProvider({ children }: PeriodProviderProps) {
  const initialPeriodId =
    PERIOD_OPTIONS.find((period) => {
      const today = getTodayDateString();
      return today >= period.start && today <= period.end;
    })?.id ?? PERIOD_OPTIONS[1].id;
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    initialPeriodId,
  );

  const value = useMemo(
    () => ({ selectedPeriodId, setSelectedPeriodId }),
    [selectedPeriodId],
  );

  return (
    <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
  );
}
