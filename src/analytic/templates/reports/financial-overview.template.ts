import { ReportTemplate, FinancialData } from '../../interfaces/report-config.interface';

export const financialOverviewTemplate: ReportTemplate<FinancialData> = {
  name: 'financial-overview',
  defaultConfig: {
    currency: 'EUR',
    includeTaxes: false,
    groupBy: 'month'
  },

  async generate(data, config) {
    const { projects, invoices, expenses } = data;
    
    return {
      meta: {
        generatedAt: new Date(),
        currency: config.currency,
        timeRange: `${config.startDate} - ${config.endDate}`
      },
      totals: {
        revenue: invoices.reduce((sum, inv) => sum + inv.amount, 0),
        expenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        profit: 0 // Calculed in the end
      },
      byProject: projects.map(project => {
        const projectInvoices = invoices.filter(inv => inv.projectId === project.id);
        const projectExpenses = expenses.filter(exp => exp.projectId === project.id);
        
        const revenue = projectInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const projectExpensesTotal = projectExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        return {
          projectId: project.id,
          projectName: project.name,
          revenue,
          expenses: projectExpensesTotal,
          profit: revenue - projectExpensesTotal
        };
      }),
      charts: [
        {
          type: 'pie',
          title: 'Répartition des revenus',
          data: {
            labels: projects.map(p => p.name),
            datasets: [{
              data: projects.map(project => 
                invoices.filter(inv => inv.projectId === project.id)
                  .reduce((sum, inv) => sum + inv.amount, 0)
              )
            }]
          }
        }
      ]
    };
  }
};