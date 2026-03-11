export interface Incident {
  id: string;
  title: string;
  location: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved';
  date: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}
