/**
 * Layout Context - Provides layout units throughout the app
 *
 * Wrap your app in LayoutProvider to access layout values
 * without prop drilling via useLayout() hook.
 */

import React, { createContext, useContext } from "react";
import { useLayoutUnits, LayoutUnits } from "./useLayoutUnits";

// Context with null default (must be used within provider)
const LayoutContext = createContext<LayoutUnits | null>(null);

interface LayoutProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that calculates and shares layout values
 * Must be placed inside SafeAreaProvider (needs safe area insets)
 */
export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const layout = useLayoutUnits();

  return (
    <LayoutContext.Provider value={layout}>{children}</LayoutContext.Provider>
  );
};

/**
 * Hook to access layout values from context
 * @throws Error if used outside LayoutProvider
 */
export const useLayout = (): LayoutUnits => {
  const context = useContext(LayoutContext);

  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }

  return context;
};

// Export context for advanced use cases (testing, etc.)
export { LayoutContext };
