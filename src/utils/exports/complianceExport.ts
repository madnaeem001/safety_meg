import html2canvas from 'html2canvas';

// Compliance Report Data Interface
export interface ComplianceReportData {
  title: string;
  generatedDate: string;
  generatedBy: string;
  overallScore: number;
  categories: {
    name: string;
    score: number;
    compliant: number;
    pending: number;
    overdue: number;
  }[];
  upcomingDeadlines: {
    item: string;
    category: string;
    dueDate: string;
    priority: string;
  }[];
  regulatoryFrameworks: {
    name: string;
    status: string;
    score: number;
  }[];
  recentActivities: {
    action: string;
    item: string;
    user: string;
    date: string;
  }[];
}

// Generate PDF-style HTML for compliance report
export const generateComplianceReportHTML = (data: ComplianceReportData): string => {
  const scoreColor = data.overallScore >= 90 ? '#22c55e' : data.overallScore >= 75 ? '#eab308' : '#ef4444';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${data.title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; color: #1e293b; }
        .container { max-width: 800px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 32px; }
        .header h1 { font-size: 28px; margin-bottom: 8px; }
        .header p { opacity: 0.9; font-size: 14px; }
        .meta { display: flex; gap: 24px; margin-top: 16px; font-size: 12px; }
        .section { padding: 24px 32px; border-bottom: 1px solid #e2e8f0; }
        .section-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1e40af; }
        .score-card { display: flex; align-items: center; gap: 24px; padding: 24px; background: #f1f5f9; border-radius: 12px; }
        .score-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: white; background: ${scoreColor}; }
        .score-details { flex: 1; }
        .score-label { font-size: 14px; color: #64748b; margin-bottom: 4px; }
        .score-value { font-size: 24px; font-weight: 600; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 16px; }
        .stat-box { padding: 16px; background: #f8fafc; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; }
        .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
        .category-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
        .category-name { font-weight: 500; }
        .category-score { font-weight: 600; }
        .progress-bar { width: 120px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 4px; }
        .deadline-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
        .priority-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .priority-high { background: #fee2e2; color: #dc2626; }
        .priority-medium { background: #fef3c7; color: #d97706; }
        .priority-low { background: #dcfce7; color: #16a34a; }
        .framework-status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .status-compliant { background: #dcfce7; color: #16a34a; }
        .status-review { background: #dbeafe; color: #2563eb; }
        .activity-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .footer { padding: 24px 32px; background: #f8fafc; text-align: center; font-size: 12px; color: #64748b; }
        @media print { body { background: white; } .container { box-shadow: none; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.title}</h1>
          <p>Comprehensive compliance status report for regulatory tracking</p>
          <div class="meta">
            <span>📅 Generated: ${data.generatedDate}</span>
            <span>👤 By: ${data.generatedBy}</span>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Overall Compliance Score</div>
          <div class="score-card">
            <div class="score-circle">${data.overallScore}%</div>
            <div class="score-details">
              <div class="score-label">Overall Compliance Status</div>
              <div class="score-value">${data.overallScore >= 90 ? 'Excellent' : data.overallScore >= 75 ? 'Good' : 'Needs Attention'}</div>
              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-value" style="color: #22c55e;">${data.categories.reduce((sum, c) => sum + c.compliant, 0)}</div>
                  <div class="stat-label">Compliant</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value" style="color: #eab308;">${data.categories.reduce((sum, c) => sum + c.pending, 0)}</div>
                  <div class="stat-label">Pending</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value" style="color: #ef4444;">${data.categories.reduce((sum, c) => sum + c.overdue, 0)}</div>
                  <div class="stat-label">Overdue</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value" style="color: #3b82f6;">${data.categories.length}</div>
                  <div class="stat-label">Categories</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Category Breakdown</div>
          ${data.categories.map(cat => `
            <div class="category-row">
              <div class="category-name">${cat.name}</div>
              <div style="display: flex; align-items: center; gap: 16px;">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${cat.score}%; background: ${cat.score >= 90 ? '#22c55e' : cat.score >= 75 ? '#eab308' : '#ef4444'};"></div>
                </div>
                <div class="category-score">${cat.score}%</div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="section">
          <div class="section-title">Regulatory Frameworks</div>
          ${data.regulatoryFrameworks.map(fw => `
            <div class="category-row">
              <div class="category-name">${fw.name}</div>
              <div style="display: flex; align-items: center; gap: 16px;">
                <span class="framework-status ${fw.status === 'compliant' ? 'status-compliant' : 'status-review'}">${fw.status.toUpperCase()}</span>
                <div class="category-score">${fw.score}%</div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="section">
          <div class="section-title">Upcoming Deadlines</div>
          ${data.upcomingDeadlines.map(dl => `
            <div class="deadline-row">
              <div>
                <div style="font-weight: 500;">${dl.item}</div>
                <div style="font-size: 12px; color: #64748b;">Due: ${dl.dueDate}</div>
              </div>
              <span class="priority-badge priority-${dl.priority}">${dl.priority.toUpperCase()}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="section">
          <div class="section-title">Recent Activity</div>
          ${data.recentActivities.slice(0, 5).map(act => `
            <div class="activity-row">
              <div>
                <span style="font-weight: 500;">${act.action}</span> - ${act.item}
              </div>
              <div style="color: #64748b;">${act.user} • ${act.date}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="footer">
          <p>Generated by safetyMEG EHS Platform • This report is for compliance tracking purposes</p>
          <p style="margin-top: 8px;">© ${new Date().getFullYear()} safetyMEG - Intelligent Safety Management</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Export compliance report as PDF (using print)
export const exportComplianceReportPDF = async (data: ComplianceReportData): Promise<void> => {
  const html = generateComplianceReportHTML(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// Export compliance report as CSV
export const exportComplianceReportCSV = (data: ComplianceReportData): void => {
  const rows: string[] = [];
  
  // Header info
  rows.push('Compliance Report');
  rows.push(`Generated Date,${data.generatedDate}`);
  rows.push(`Generated By,${data.generatedBy}`);
  rows.push(`Overall Score,${data.overallScore}%`);
  rows.push('');
  
  // Categories
  rows.push('CATEGORY BREAKDOWN');
  rows.push('Category,Score,Compliant,Pending,Overdue');
  data.categories.forEach(cat => {
    rows.push(`${cat.name},${cat.score}%,${cat.compliant},${cat.pending},${cat.overdue}`);
  });
  rows.push('');
  
  // Regulatory Frameworks
  rows.push('REGULATORY FRAMEWORKS');
  rows.push('Framework,Status,Score');
  data.regulatoryFrameworks.forEach(fw => {
    rows.push(`${fw.name},${fw.status},${fw.score}%`);
  });
  rows.push('');
  
  // Upcoming Deadlines
  rows.push('UPCOMING DEADLINES');
  rows.push('Item,Category,Due Date,Priority');
  data.upcomingDeadlines.forEach(dl => {
    rows.push(`"${dl.item}",${dl.category},${dl.dueDate},${dl.priority}`);
  });
  rows.push('');
  
  // Recent Activities
  rows.push('RECENT ACTIVITY');
  rows.push('Action,Item,User,Date');
  data.recentActivities.forEach(act => {
    rows.push(`"${act.action}","${act.item}",${act.user},${act.date}`);
  });
  
  // Create and download CSV
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// Export compliance report as JSON
export const exportComplianceReportJSON = (data: ComplianceReportData): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
};
