import { ChecklistItem, AssessmentType } from './types';

export const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const REQUIRED_SHOTS = [
  'Exterior front of facility (with signage)',
  'Unit exterior door (with unit number visible)',
  'Wide shot of unit interior (all corners if large)',
  'Thermostat / HVAC control reading (if climate‑controlled)',
  'Electrical panel interior',
  'Under sinks / near plumbing (if applicable)',
  'Gate access control panel',
  'Roll‑up door track & weather seal',
  'Overhead door spring assembly',
  'Fire extinguisher tag / date',
  'Any damage, safety issues, or pest evidence',
  'Hallway condition (both directions from unit)',
  'Trash area / dumpster',
  'General security camera overview',
  'Additional context shot'
].map(text => ({
  id: `required-shot-${slugify(text)}`,
  text
}));

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
  { id: 'red-10', tier: 'Red', text: 'Fire extinguisher — present, charged, within assessment date' }
];

export const YELLOW_LIGHT_ITEMS: Record<AssessmentType, Omit<ChecklistItem, 'status' | 'note'>[]> = {
  'Move-In Assessment Report': [
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
  'Unit Health & Safety Assessment': [
    { id: 'y-mid-1', tier: 'Yellow', text: 'HVAC / climate control — operational, no noise' },
    { id: 'y-mid-2', tier: 'Yellow', text: 'Pest activity — no new signs' },
    { id: 'y-mid-3', tier: 'Yellow', text: 'Water intrusion — no new leaks/stains' },
    { id: 'y-mid-4', tier: 'Yellow', text: 'Roll-up door operation — seal intact, no rust' },
    { id: 'y-mid-5', tier: 'Yellow', text: 'Prohibited items check — no hazardous/illegal/perishable items visible' },
    { id: 'y-mid-6', tier: 'Yellow', text: 'Habitation check — no evidence of living (Texas Property Code §59.009)' },
    { id: 'y-mid-7', tier: 'Yellow', text: 'Lock check — tenant lock present and secure' },
    { id: 'y-mid-8', tier: 'Yellow', text: 'Unit access — no obstructions' }
  ],
  'Move-Out Assessment Report': [
    { id: 'y-moveout-1', tier: 'Yellow', text: 'HVAC / climate control — still operational? Note new damage', baselineId: 'y-movein-1' },
    { id: 'y-moveout-2', tier: 'Yellow', text: 'Plumbing / sump pump — new leaks or damage', baselineId: 'y-movein-3' },
    { id: 'y-moveout-3', tier: 'Yellow', text: 'Lighting — broken fixtures/missing bulbs', baselineId: 'y-movein-4' },
    { id: 'y-moveout-4', tier: 'Yellow', text: 'Water intrusion — new stains, mold, or odor', baselineId: 'y-movein-5' },
    { id: 'y-moveout-5', tier: 'Yellow', text: 'Pest activity — new infestation evidence', baselineId: 'y-movein-6' },
    { id: 'y-moveout-6', tier: 'Yellow', text: 'Roll-up door — new dents, damaged seal, broken spring', baselineId: 'y-movein-7' },
    { id: 'y-moveout-7', tier: 'Yellow', text: 'Unit interior surfaces — new holes, deep scratches, paint damage', baselineId: 'y-movein-9' },
    { id: 'y-moveout-8', tier: 'Yellow', text: 'Overall condition compared to baseline' }
  ]
};

export const SLATE_LIGHT_ITEMS: Record<AssessmentType, Omit<ChecklistItem, 'status' | 'note'>[]> = {
  'Move-In Assessment Report': [
    { id: 's-movein-1', tier: 'Slate', text: 'Gate access code assigned' },
    { id: 's-movein-2', tier: 'Slate', text: 'Key fob / proximity card issued' },
    { id: 's-movein-3', tier: 'Slate', text: 'Remote control issued' },
    { id: 's-movein-4', tier: 'Slate', text: 'Tenant lock verified' },
    { id: 's-movein-5', tier: 'Slate', text: 'Number of keys provided to tenant' },
    { id: 's-movein-6', tier: 'Slate', text: 'Access instructions reviewed' }
  ],
  'Unit Health & Safety Assessment': [],
  'Move-Out Assessment Report': [
    { id: 's-moveout-1', tier: 'Slate', text: 'Gate access code deactivated', baselineId: 's-movein-1' },
    { id: 's-moveout-2', tier: 'Slate', text: 'Key fob / proximity card returned', baselineId: 's-movein-2' },
    { id: 's-moveout-3', tier: 'Slate', text: 'Remote control returned', baselineId: 's-movein-3' },
    { id: 's-moveout-4', tier: 'Slate', text: 'Tenant lock removed', baselineId: 's-movein-4' },
    { id: 's-moveout-5', tier: 'Slate', text: 'All keys returned', baselineId: 's-movein-5' },
    { id: 's-moveout-6', tier: 'Slate', text: 'Access credentials audit complete', baselineId: 's-movein-6' }
  ]
};

export const GREEN_LIGHT_ITEMS: Record<AssessmentType, Omit<ChecklistItem, 'status' | 'note'>[]> = {
  'Move-In Assessment Report': [
    { id: 'g-movein-1', tier: 'Green', text: 'Unit cleanliness — swept, debris-free' },
    { id: 'g-movein-2', tier: 'Green', text: 'Hallway cleanliness — clear, no trip hazards' },
    { id: 'g-movein-3', tier: 'Green', text: 'Signage — legible, directional present' },
    { id: 'g-movein-4', tier: 'Green', text: 'Keypad / access control — responsive, lit' },
    { id: 'g-movein-5', tier: 'Green', text: 'Paint / wall condition — no peeling/graffiti' },
    { id: 'g-movein-6', tier: 'Green', text: 'Trash / dumpster area — not overflowing' },
    { id: 'g-movein-7', tier: 'Green', text: 'Landscaping — no overgrowth' }
  ],
  'Unit Health & Safety Assessment': [
    { id: 'g-mid-1', tier: 'Green', text: 'Hallway cleanliness — no tenant-created hazards' },
    { id: 'g-mid-2', tier: 'Green', text: 'Trash / dumpster area — no overflow from tenant' }
  ],
  'Move-Out Assessment Report': [
    { id: 'g-moveout-1', tier: 'Green', text: 'Unit cleanliness — swept, no odors left', baselineId: 'g-movein-1' },
    { id: 'g-moveout-2', tier: 'Green', text: 'Hallway cleanliness — clear', baselineId: 'g-movein-2' },
    { id: 'g-moveout-3', tier: 'Green', text: 'Signage — still legible', baselineId: 'g-movein-3' },
    { id: 'g-moveout-4', tier: 'Green', text: 'Keypad / access control — still functional', baselineId: 'g-movein-4' },
    { id: 'g-moveout-5', tier: 'Green', text: 'Paint / wall condition — ready for touch-up', baselineId: 'g-movein-5' },
    { id: 'g-moveout-6', tier: 'Green', text: 'Trash / dumpster area — tenant trash removed', baselineId: 'g-movein-6' },
    { id: 'g-moveout-7', tier: 'Green', text: 'Landscaping — no damage from move-out', baselineId: 'g-movein-7' }
  ]
};
