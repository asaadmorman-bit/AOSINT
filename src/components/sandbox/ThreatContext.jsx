import React, { createContext, useContext, useState } from "react";

const ThreatContextual = createContext(null);

export function ThreatContextProvider({ children }) {
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [correlationHistory, setCorrelationHistory] = useState([]);
  const [activeScenarios, setActiveScenarios] = useState([]);

  const updateThreat = (threat) => {
    setSelectedThreat(threat);
    setCorrelationHistory([]);
    setActiveScenarios([]);
  };

  const addCorrelation = (correlation) => {
    setCorrelationHistory(prev => [...prev, correlation]);
  };

  const updateScenarios = (scenarios) => {
    setActiveScenarios(scenarios);
  };

  const clearContext = () => {
    setSelectedThreat(null);
    setCorrelationHistory([]);
    setActiveScenarios([]);
  };

  return (
    <ThreatContextual.Provider value={{
      selectedThreat,
      correlationHistory,
      activeScenarios,
      updateThreat,
      addCorrelation,
      updateScenarios,
      clearContext,
    }}>
      {children}
    </ThreatContextual.Provider>
  );
}

export function useThreatContext() {
  const context = useContext(ThreatContextual);
  if (!context) {
    throw new Error("useThreatContext must be used within ThreatContextProvider");
  }
  return context;
}