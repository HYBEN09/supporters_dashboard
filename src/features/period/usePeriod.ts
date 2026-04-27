import { useContext } from "react";
import { PeriodContext } from "./periodContext";

export function usePeriod() {
  const context = useContext(PeriodContext);

  if (!context) {
    throw new Error("usePeriod must be used within PeriodProvider");
  }

  return context;
}
