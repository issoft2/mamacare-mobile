import { createContext, useContext, type ReactNode } from "react";
import { useActivePregnancy, usePregnancyHistory } from "@mumcare/api";
import type { Pregnancy } from "@mumcare/types";

interface PregnancyStateContextValue {
  activePregnancy: Pregnancy | null | undefined;
  pregnancyHistory: Pregnancy[] | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const PregnancyStateContext = createContext<PregnancyStateContextValue | null>(null);

export function PregnancyProvider({ children }: { children: ReactNode }) {
  const activePregnancyQuery = useActivePregnancy();
  const pregnancyHistoryQuery = usePregnancyHistory();

  const value: PregnancyStateContextValue = {
    activePregnancy: activePregnancyQuery.data,
    pregnancyHistory: pregnancyHistoryQuery.data,
    isLoading: activePregnancyQuery.isLoading || pregnancyHistoryQuery.isLoading,
    isError: activePregnancyQuery.isError || pregnancyHistoryQuery.isError,
    refetch: () => {
      void activePregnancyQuery.refetch();
      void pregnancyHistoryQuery.refetch();
    },
  };

  return (
    <PregnancyStateContext.Provider value={value}>
      {children}
    </PregnancyStateContext.Provider>
  );
}

export function usePregnancyState() {
  const value = useContext(PregnancyStateContext);
  if (!value) {
    throw new Error("usePregnancyState must be used within a PregnancyProvider");
  }
  return value;
}
