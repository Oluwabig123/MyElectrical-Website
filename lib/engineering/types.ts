export type ConfidenceLevel = "high" | "medium" | "low";

export type ProductType =
  | "inverter"
  | "hybrid_inverter"
  | "battery"
  | "solar_panel"
  | "charge_controller"
  | "cable"
  | "breaker"
  | "spd"
  | "earthing"
  | "installation_guide"
  | "pricing_sheet"
  | "faq"
  | "business"
  | "service";

export type ProductSpecMatch = {
  documentId?: string | null;
  manufacturer: string | null;
  model: string | null;
  productType: ProductType;
  source: string | null;
  specs: Record<string, unknown>;
  confidence: ConfidenceLevel;
  matchedBy: "exact_model" | "partial_model" | "retrieval" | "user_input";
};

export type CalculationLine = {
  label: string;
  value: string;
};

export type RecommendedComponent = {
  category: string;
  recommendation: string;
  confidence: ConfidenceLevel;
  note?: string;
};

export type ProjectSummary = {
  service: string;
  location: string;
  appliances: string;
  backupTarget: string;
  existingInverter: string;
  existingBattery: string;
  solarPanels: string;
  budget: string;
  recommendedSetup: string;
  protectionComponents: string;
  missingInformation: string;
  confidence: ConfidenceLevel;
  nextStep: string;
};

export type SizingRecommendation = {
  quickAnswer: string;
  verifiedSpecs: CalculationLine[];
  calculations: CalculationLine[];
  decision: string[];
  safetyNote: string | null;
  recommendedComponents: RecommendedComponent[];
  missingInformation: string[];
  confidenceLevel: ConfidenceLevel;
  quoteSummary: string;
  projectSummary: ProjectSummary;
  sources: Array<{
    title: string;
    manufacturer: string | null;
    model: string | null;
    productType: string;
    source: string | null;
  }>;
};

export type BatterySizingInput = {
  loadWatts: number;
  backupHours: number;
  inverterVoltage: number | null;
  efficiency: number;
  usableDod: number;
};

export type BatterySizingResult = {
  requiredWh: number;
  adjustedWh: number;
  requiredKwh: number;
  requiredContinuousCurrentA: number | null;
};

export type InverterSizingInput = {
  loadWatts: number;
  appliancesText: string;
};

export type InverterSizingResult = {
  recommendedContinuousWatts: number;
  estimatedSurgeWatts: number;
  surgeReason: string[];
};

export type PvSizingInput = {
  targetArrayW: number | null;
  desiredPanelCount: number | null;
  panelWatts: number | null;
  panelVoc: number | null;
  panelVmp: number | null;
  panelIsc: number | null;
  panelImp: number | null;
  temperatureCoefficientVoc: number | null;
  inverterMaxVoc: number | null;
  inverterMpptMin: number | null;
  inverterMpptMax: number | null;
  inverterMaxPvCurrent: number | null;
  inverterMaxPvPower: number | null;
};

export type PvConfiguration = {
  series: number;
  parallel: number;
  totalPanels: number;
  totalVoc: number;
  coldAdjustedVoc: number;
  totalVmp: number;
  totalIsc: number;
  totalImp: number;
  totalPowerW: number;
};

export type PvSizingResult = {
  configurations: PvConfiguration[];
  recommended: PvConfiguration | null;
  warnings: string[];
};
