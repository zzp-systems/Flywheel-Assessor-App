export type AssessmentType = 'Move-In Assessment Report' | 'Unit Health & Safety Assessment' | 'Move-Out Assessment Report';
export type Tier = 'Red' | 'Yellow' | 'Green' | 'Slate';
export type Status = 'Pass' | 'Fail' | 'N/A' | 'Pending';

export interface ChecklistItem {
  id: string;
  tier: Tier;
  text: string;
  status: Status;
  note: string;
  baselineId?: string;
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

export interface WorkOrder {
  workOrderId: string;
  itemId: string;
  itemText: string;
  tier: Tier;
  note: string;
  facilityName: string;
  unitNumber: string;
  buildingFloor: string;
  inspectorName: string;
  dateCreated: string;
  priority: 'Critical' | 'Routine';
  status: 'Open';
}

export interface AssessmentData {
  id: string;
  type: AssessmentType;
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
  workOrders?: WorkOrder[];
}
