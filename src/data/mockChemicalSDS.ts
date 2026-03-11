export interface ChemicalSDS {
  id: string;
  name: string;
  manufacturer: string;
  hazards: string[];
  signalWord: 'Danger' | 'Warning' | 'None';
  pictograms: string[];
  lastUpdated: string;
  sdsUrl: string;
  location: string;
  quantity: string;
  unit: string;
  ghsClassification: string[];
  emergencyContact: string;
}

export const mockChemicalSDS: ChemicalSDS[] = [
  {
    id: 'chem-001',
    name: 'Acetone',
    manufacturer: 'Sigma-Aldrich',
    hazards: ['Highly flammable liquid and vapor', 'Causes serious eye irritation', 'May cause drowsiness or dizziness'],
    signalWord: 'Danger',
    pictograms: ['Flame', 'Exclamation Mark'],
    lastUpdated: '2025-10-15',
    sdsUrl: '#',
    location: 'Lab A, Cabinet 3',
    quantity: '5',
    unit: 'Liters',
    ghsClassification: ['Flammable Liquids, Category 2', 'Eye Irritation, Category 2A', 'STOT SE 3'],
    emergencyContact: '1-800-424-9300 (Chemtrec)'
  },
  {
    id: 'chem-002',
    name: 'Sulfuric Acid (98%)',
    manufacturer: 'Fisher Scientific',
    hazards: ['Causes severe skin burns and eye damage', 'May be corrosive to metals'],
    signalWord: 'Danger',
    pictograms: ['Corrosion'],
    lastUpdated: '2025-11-20',
    sdsUrl: '#',
    location: 'Acid Storage Room',
    quantity: '10',
    unit: 'Liters',
    ghsClassification: ['Skin Corrosion, Category 1A', 'Serious Eye Damage, Category 1', 'Corrosive to Metals, Category 1'],
    emergencyContact: '1-800-424-9300 (Chemtrec)'
  },
  {
    id: 'chem-003',
    name: 'Ethanol (70%)',
    manufacturer: 'VWR International',
    hazards: ['Flammable liquid and vapor', 'Causes eye irritation'],
    signalWord: 'Warning',
    pictograms: ['Flame', 'Exclamation Mark'],
    lastUpdated: '2025-12-05',
    sdsUrl: '#',
    location: 'General Storage',
    quantity: '20',
    unit: 'Liters',
    ghsClassification: ['Flammable Liquids, Category 3', 'Eye Irritation, Category 2B'],
    emergencyContact: '1-800-424-9300 (Chemtrec)'
  }
];
