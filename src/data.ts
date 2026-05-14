import { ChecklistItem, InspectionType } from './types';

export const RED_LIGHT_ITEMS: Omit<ChecklistItem, 'status' | 'note'>[] = [
  { id: 'red-1', tier: 'Red', text: 'Fire sprinkler system — visual check, no leaks, no corrosion (Texas Property Code §59, NFPA 13)' },
  { id: 'red-2', tier: 'Red', text: 'Dry‑pipe valve room heater — operational, no condensate freezing risk' },
  { id: 'red-3', tier: 'Red', text: 'Smoke detectors — present, tested, battery functional' },
  { id: 'red-4', tier: 'Red', text: 'Carbon monoxide detector — present and tested' },
  { id: 'red-5', tier: 'Red', text: 'Emergency generator — start‑up test, fuel level check, transfer switch functional' },
  { id: 'red-6', tier: 'Red', text: 'Emergency exit path — clear, unobstructed, exit sign illuminated' },
  { id: 'red-7', tier: 'Red', text: 'Electrical panel — secure cover, no exposed wiring, no scorch marks' },
  { id: 'red-8', tier: 'Red', text: 'Gate access system — operational, emergency release functional' },
  { id: 'red-9', tier: 'Red', text: 'Security camera coverage — all hallways and entry points visible' },
  { id: 'red-10', tier: 'Red', text: 'Fire extinguisher — present, charged, within inspection date' }
];

export const YELLOW_LIGHT_ITEMS: Record<InspectionType, Omit<ChecklistItem, 'status' | 'note'>[]> = {
  'Move-In Baseline': [
    { id: 'y-movein-1', tier: 'Yellow', text: 'HVAC / climate control — operational, maintaining 65-80°F' },
    { id: 'y-movein-2', tier: 'Yellow', text: 'Humidity levels — within 30-60% RH' },
    { id: 'y-movein-3', tier: 'Yellow', text: 'Plumbing / sump pump — no leaks, operational' },
    { id: 'y-movein-4', tier: 'Yellow', text: 'Lighting — all functional' },
    { id: 'y-movein-5', tier: 'Yellow', text: 'Water intrusion — no standing water, no stains, no odor' },
    { id: 'y-movein-6', tier: 'Yellow', text: 'Pest activity — no visible signs' },
    { id: 'y-movein-7', tier: 'Yellow', text: 'Roll-up door operation — opens smoothly, seal intact, no rust' },
    { id: 'y-movein-8', tier: 'Yellow', text: 'Overhead door spring tension — no gaps, no squealing' },
    { id: 'y-movein-9', tier: 'Yellow', text: 'Unit interior surfaces — free of damage/stains' }
  ],
  'Mid-Tenancy': [
    { id: 'y-mid-1', tier: 'Yellow', text: 'HVAC / climate control — operational, no noise' },
    { id: 'y-mid-2', tier: 'Yellow', text: 'Pest activity — no new signs' },
    { id: 'y-mid-3', tier: 'Yellow', text: 'Water intrusion — no new leaks/stains' },
    { id: 'y-mid-4', tier: 'Yellow', text: 'Roll-up door operation — seal intact, no rust' },
    { id: 'y-mid-5', tier: 'Yellow', text: 'Prohibited items check — no hazardous/illegal/perishable items visible' },
    { id: 'y-mid-6', tier: 'Yellow', text: 'Habitation check — no evidence of living (Texas Property Code §59.009)' },
    { id: 'y-mid-7', tier: 'Yellow', text: 'Lock check — tenant lock present and secure' },
    { id: 'y-mid-8', tier: 'Yellow', text: 'Unit access — no obstructions' }
  ],
  'Move-Out': [
    { id: 'y-moveout-1', tier: 'Yellow', text: 'HVAC / climate control — still operational? Note new damage' },
    { id: 'y-moveout-2', tier: 'Yellow', text: 'Plumbing / sump pump — new leaks or damage' },
    { id: 'y-moveout-3', tier: 'Yellow', text: 'Lighting — broken fixtures/missing bulbs' },
    { id: 'y-moveout-4', tier: 'Yellow', text: 'Water intrusion — new stains, mold, or odor' },
    { id: 'y-moveout-5', tier: 'Yellow', text: 'Pest activity — new infestation evidence' },
    { id: 'y-moveout-6', tier: 'Yellow', text: 'Roll-up door — new dents, damaged seal, broken spring' },
    { id: 'y-moveout-7', tier: 'Yellow', text: 'Unit interior surfaces — new holes, deep scratches, paint damage' },
    { id: 'y-moveout-8', tier: 'Yellow', text: 'Overall condition compared to baseline' }
  ]
};

export const GREEN_LIGHT_ITEMS: Record<InspectionType, Omit<ChecklistItem, 'status' | 'note'>[]> = {
  'Move-In Baseline': [
    { id: 'g-movein-1', tier: 'Green', text: 'Unit cleanliness — swept, debris-free' },
    { id: 'g-movein-2', tier: 'Green', text: 'Hallway cleanliness — clear, no trip hazards' },
    { id: 'g-movein-3', tier: 'Green', text: 'Signage — legible, directional present' },
    { id: 'g-movein-4', tier: 'Green', text: 'Keypad / access control — responsive, lit' },
    { id: 'g-movein-5', tier: 'Green', text: 'Paint / wall condition — no peeling/graffiti' },
    { id: 'g-movein-6', tier: 'Green', text: 'Trash / dumpster area — not overflowing' },
    { id: 'g-movein-7', tier: 'Green', text: 'Landscaping — no overgrowth' }
  ],
  'Mid-Tenancy': [
    { id: 'g-mid-1', tier: 'Green', text: 'Hallway cleanliness — no tenant-created hazards' },
    { id: 'g-mid-2', tier: 'Green', text: 'Trash / dumpster area — no overflow from tenant' }
  ],
  'Move-Out': [
    { id: 'g-moveout-1', tier: 'Green', text: 'Unit cleanliness — swept, no odors left' },
    { id: 'g-moveout-2', tier: 'Green', text: 'Hallway cleanliness — clear' },
    { id: 'g-moveout-3', tier: 'Green', text: 'Signage — still legible' },
    { id: 'g-moveout-4', tier: 'Green', text: 'Keypad / access control — still functional' },
    { id: 'g-moveout-5', tier: 'Green', text: 'Paint / wall condition — ready for touch-up' },
    { id: 'g-moveout-6', tier: 'Green', text: 'Trash / dumpster area — tenant trash removed' },
    { id: 'g-moveout-7', tier: 'Green', text: 'Landscaping — no damage from move-out' }
  ]
};
