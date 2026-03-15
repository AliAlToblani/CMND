import React, { createContext, useContext } from "react";

interface BatelcoContextType {
  isBatelcoPortal: boolean;
  partnerLabel: string;
  defaultCountry: string;
}

const BatelcoContext = createContext<BatelcoContextType>({
  isBatelcoPortal: false,
  partnerLabel: "batelco",
  defaultCountry: "Bahrain",
});

export function BatelcoProvider({ children }: { children: React.ReactNode }) {
  return (
    <BatelcoContext.Provider
      value={{
        isBatelcoPortal: true,
        partnerLabel: "batelco",
        defaultCountry: "Bahrain",
      }}
    >
      {children}
    </BatelcoContext.Provider>
  );
}

export const useBatelco = () => useContext(BatelcoContext);
