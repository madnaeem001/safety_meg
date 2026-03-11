export interface ControlItem {
  id: string;
  title: string;
  description: string;
  examples: string[];
}

export interface ISOControl {
  id: string;
  clause: string;
  title: string;
  description: string;
}

export const COMPANY_NAME = 'MegSafe';

export const HIERARCHY_OF_CONTROLS: ControlItem[] = [
  {
    id: 'elimination',
    title: 'Elimination',
    description: 'Physically remove the hazard. This is the most effective control.',
    examples: ['Removing a trip hazard from a walkway', 'Eliminating the use of a toxic chemical']
  },
  {
    id: 'substitution',
    title: 'Substitution',
    description: 'Replace the hazard with something less dangerous.',
    examples: ['Replacing a solvent-based paint with a water-based one', 'Using a smaller, lighter tool to reduce strain']
  },
  {
    id: 'engineering',
    title: 'Engineering Controls',
    description: 'Isolate people from the hazard through physical changes.',
    examples: ['Installing machine guards', 'Using local exhaust ventilation', 'Soundproofing noisy equipment']
  },
  {
    id: 'administrative',
    title: 'Administrative Controls',
    description: 'Change the way people work through procedures and training.',
    examples: ['Safety training', 'Warning signs', 'Rotating workers to reduce exposure time']
  },
  {
    id: 'ppe',
    title: 'Personal Protective Equipment (PPE)',
    description: 'Protect the worker with equipment. This is the least effective control.',
    examples: ['Hard hats', 'Safety glasses', 'Respirators', 'Gloves']
  }
];

export const ISO_CONTROLS: ISOControl[] = [
  {
    id: 'iso-45001-6.1.2.1',
    clause: '6.1.2.1',
    title: 'Hazard Identification',
    description: 'The organization shall establish, implement and maintain a process for hazard identification that is ongoing and proactive.'
  },
  {
    id: 'iso-45001-8.1.2',
    clause: '8.1.2',
    title: 'Eliminating Hazards and Reducing OH&S Risks',
    description: 'The organization shall establish, implement and maintain a process for the elimination of hazards and reduction of OH&S risks using the hierarchy of controls.'
  },
  {
    id: 'iso-45001-7.3',
    clause: '7.3',
    title: 'Awareness',
    description: 'Workers shall be made aware of the OH&S policy, their contribution to the effectiveness of the OH&S management system, and the implications of not conforming to requirements.'
  }
];
