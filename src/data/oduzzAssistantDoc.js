export const oduzzAssistantDoc = {
  company: "Oduzz Electrical Concept",
  version: "1.0",
  lastUpdated: "2026-02-17",
  policy: {
    note:
      "All recommendations are preliminary and should be confirmed during site inspection.",
  },
  knowledge: {
    services: {
      solar:
        "Solar and inverter work includes load audit, correct sizing, protection setup, and clean cable management.",
      wiring:
        "Wiring follows safety-first conduit routing and proper protection standards.",
      lighting:
        "Lighting covers POP lines, chandeliers, and decorative fixtures with neat terminations.",
    },
  },
  solarSizing: {
    requiredInputs: ["loads_watts", "location", "backup_hours"],
    assumptions: {
      inverterSafetyFactor: 1.25,
      systemLossFactor: 1.3,
      batteryDoD: 0.8,
      systemVoltage: 48,
    },
    peakSunHoursByLocation: [
      { match: ["lagos", "ikorodu"], value: 4.2 },
      { match: ["abuja"], value: 5.2 },
      { match: ["port harcourt", "rivers"], value: 3.9 },
      { match: ["kano"], value: 5.8 },
      { match: ["kaduna"], value: 5.5 },
      { match: ["ibadan", "oyo"], value: 4.8 },
      { match: ["enugu"], value: 4.3 },
      { match: ["default"], value: 4.5 },
    ],
    outputRules: {
      inverterRoundingKVA: [1, 1.5, 2, 3, 3.5, 5, 7.5, 10, 12, 15, 20],
      panelRoundingWp: [2000, 3000, 4000, 5000, 6000, 8000, 10000, 12000, 15000],
    },
  },
};
