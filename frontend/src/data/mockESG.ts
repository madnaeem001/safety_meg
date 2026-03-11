export interface ESGMetric {
  category: 'Environmental' | 'Social' | 'Governance';
  metric: string;
  value: string;
  target: string;
  status: 'On Track' | 'At Risk' | 'Behind';
  description: string;
  trend: 'up' | 'down' | 'stable';
}

export const ESG_METRICS: ESGMetric[] = [
  // ENVIRONMENTAL
  { 
    category: 'Environmental', 
    metric: 'Carbon Footprint Reduction', 
    value: '12%', 
    target: '15%', 
    status: 'On Track',
    description: 'Reduction in total CO2 emissions across all facilities.',
    trend: 'up'
  },
  { 
    category: 'Environmental', 
    metric: 'Energy Consumption', 
    value: '850 MWh', 
    target: '800 MWh', 
    status: 'At Risk',
    description: 'Total energy usage from renewable and non-renewable sources.',
    trend: 'down'
  },
  { 
    category: 'Environmental', 
    metric: 'Water Usage Efficiency', 
    value: '8%', 
    target: '10%', 
    status: 'On Track',
    description: 'Improvement in water recycling and reduction in waste.',
    trend: 'up'
  },
  { 
    category: 'Environmental', 
    metric: 'Waste Management', 
    value: '92%', 
    target: '95%', 
    status: 'On Track',
    description: 'Percentage of waste diverted from landfills through recycling.',
    trend: 'stable'
  },

  // SOCIAL
  { 
    category: 'Social', 
    metric: 'Employee Diversity', 
    value: '32%', 
    target: '40%', 
    status: 'At Risk',
    description: 'Representation of diverse groups across all levels of the company.',
    trend: 'up'
  },
  { 
    category: 'Social', 
    metric: 'Safety Training Completion', 
    value: '98%', 
    target: '100%', 
    status: 'On Track',
    description: 'Percentage of employees who have completed mandatory safety courses.',
    trend: 'stable'
  },
  { 
    category: 'Social', 
    metric: 'Community Impact', 
    value: '4.5/5', 
    target: '4.8/5', 
    status: 'On Track',
    description: 'Score based on community engagement and philanthropic activities.',
    trend: 'up'
  },
  { 
    category: 'Social', 
    metric: 'Data Privacy Compliance', 
    value: '100%', 
    target: '100%', 
    status: 'On Track',
    description: 'Adherence to global data protection regulations (GDPR, CCPA).',
    trend: 'stable'
  },

  // GOVERNANCE
  { 
    category: 'Governance', 
    metric: 'Board Independence', 
    value: '75%', 
    target: '75%', 
    status: 'On Track',
    description: 'Percentage of independent directors on the company board.',
    trend: 'stable'
  },
  { 
    category: 'Governance', 
    metric: 'Ethics Training', 
    value: '100%', 
    target: '100%', 
    status: 'On Track',
    description: 'Completion rate for annual ethical conduct and anti-corruption training.',
    trend: 'stable'
  },
  { 
    category: 'Governance', 
    metric: 'Risk Management Maturity', 
    value: 'Level 4', 
    target: 'Level 5', 
    status: 'On Track',
    description: 'Assessment of internal controls and risk mitigation processes.',
    trend: 'up'
  },
  { 
    category: 'Governance', 
    metric: 'Transparency Score', 
    value: '94/100', 
    target: '95/100', 
    status: 'On Track',
    description: 'Rating of public disclosure and shareholder communication.',
    trend: 'up'
  }
];
