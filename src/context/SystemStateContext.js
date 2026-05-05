import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./Authcontext";
import { systemStateService } from "../services/SystemStateService";

const SystemStateContext = createContext(undefined);
const initialSystemState = { isActive: true, status: "ENABLED" };

export const SystemStateProvider = ({ children }) => {
  const { token } = useAuth();
  const [systemState, setSystemState] = useState(initialSystemState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshSystemState = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const result = await systemStateService.getStatus(token);
    if (result.success && result.data) {
      setSystemState(result.data);
    } else {
      setError(result.error || "Impossible de charger l'état du système.");
    }

    setLoading(false);
    return result;
  }, [token]);

  const toggleSystemState = useCallback(
    async (payload) => {
      if (!token) {
        return { success: false, error: "Utilisateur non authentifié." };
      }

      const optimisticState = {
        isActive: payload.isActive,
        status: payload.isActive ? "ENABLED" : "DISABLED",
      };
      setSystemState(optimisticState);
      setError(null);

      const result = await systemStateService.toggleState(payload, token);
      if (result.success && result.data) {
        setSystemState(result.data);
      } else {
        await refreshSystemState();
      }

      return result;
    },
    [refreshSystemState, token],
  );

  useEffect(() => {
    if (token) {
      refreshSystemState();
    } else {
      setSystemState(initialSystemState);
      setLoading(false);
      setError(null);
    }
  }, [refreshSystemState, token]);

  return (
    <SystemStateContext.Provider
      value={{
        systemState,
        loading,
        error,
        locked: !systemState.isActive,
        refreshSystemState,
        toggleSystemState,
      }}
    >
      {children}
    </SystemStateContext.Provider>
  );
};

export const useSystemState = () => {
  const context = useContext(SystemStateContext);
  if (!context) {
    throw new Error(
      "useSystemState() doit être utilisé à l'intérieur d'un <SystemStateProvider>.",
    );
  }
  return context;
};
