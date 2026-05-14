export type InspectionType = 'Move-In Baseline' | 'Mid-Tenancy' | 'Move-Out';
export type Tier = 'Red' | 'Yellow' | 'Green';
export type Status = 'Pass' | 'Fail' | 'N/A' | 'Pending';

export interface ChecklistItem {
  id: string;
  tier: Tier;
  text: string;
  status: Status;
  note: string;
}

export interface Photo {
  id: string;
  dataUri: string;
  caption: string;
  timestamp: string;
  linkedItemId?: string;
  facilityName?: string;
  unitNumber?: string;
  buildingFloor?: string;
}

export interface DeltaItem extends ChecklistItem {
  baselineStatus: Status;
  isDeteriorated: boolean;
  repairCostEstimate: number;
}

export interface InspectionData {
  id: string;
  type: InspectionType;
  facilityName: string;
  unitNumber: string;
  building: string;
  unitType: string;
  inspectorName: string;
  date: string;
  weather: string;
  items: Record<string, ChecklistItem>;
  photos: Photo[];
  runnerNotes: string;
  managerFollowUp: Record<string, boolean>;
  deltaItems?: Record<string, DeltaItem>;
  inspectorSignature?: string;
  signatureTimestamp?: string;
  tenantSignature?: string;
  tenantName?: string;
}
