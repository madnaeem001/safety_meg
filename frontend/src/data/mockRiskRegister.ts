export interface RiskItem {
  id: string;
  hazard: string;
  consequence: string;
  likelihood: number; // 1-5
  severity: number; // 1-5
  score: number;
  mitigation: string;
  status: 'Open' | 'Mitigated' | 'Closed';
}

export const RISK_REGISTER: RiskItem[] = [
  { id: 'R-001', hazard: 'Working at Height', consequence: 'Fall from height, serious injury', likelihood: 3, severity: 5, score: 15, mitigation: 'Full body harness, guardrails, training', status: 'Mitigated' },
  { id: 'R-002', hazard: 'Chemical Exposure', consequence: 'Respiratory issues, skin burns', likelihood: 2, severity: 4, score: 8, mitigation: 'PPE, ventilation, SDS training', status: 'Open' },
  { id: 'R-003', hazard: 'Electrical Shock', consequence: 'Electrocution, fire', likelihood: 1, severity: 5, score: 5, mitigation: 'LOTO procedures, insulated tools', status: 'Mitigated' },
  { id: 'R-004', hazard: 'Manual Handling', consequence: 'Musculoskeletal disorders', likelihood: 4, severity: 2, score: 8, mitigation: 'Lifting aids, team lifting training', status: 'Open' },
  { id: 'R-005', hazard: 'Noise Exposure', consequence: 'Hearing loss', likelihood: 5, severity: 2, score: 10, mitigation: 'Ear protection, noise barriers', status: 'Mitigated' }
];
