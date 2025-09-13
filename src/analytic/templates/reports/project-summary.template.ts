import { ReportTemplate, ProjectSummaryData } from '../../interfaces/report-config.interface';

export const projectSummaryTemplate: ReportTemplate<ProjectSummaryData> = {
  name: 'project-summary',
  defaultConfig: {
    includeInactive: false,
    groupBy: 'week',
    chartType: 'bar'
  },

  async generate(data, config) {
    const { projects, timeLogs } = data;
    const results = {
      meta: {
        generatedAt: new Date(),
        projectCount: projects.length,
        timeRange: `${config.startDate} - ${config.endDate}`
      },
      summary: {
        totalHours: 0,
        billableHours: 0,
        byProject: [] as Array<{
          id: string;
          name: string;
          hours: number;
          billablePercentage: number;
        }>
      },
      charts: [] as Array<{ type: string; title: string; data: any }>
    };

    // Process data
    projects.forEach(project => {
      const projectLogs = timeLogs.filter(log => log.projectId === project.id);
      const totalHours = projectLogs.reduce((sum, log) => sum + log.duration, 0) / 60;
      const billableHours = projectLogs
        .filter(log => log.billable)
        .reduce((sum, log) => sum + log.duration, 0) / 60;

      results.summary.byProject.push({
        id: project.id,
        name: project.name,
        hours: totalHours,
        billablePercentage: totalHours > 0 ? (billableHours / totalHours) * 100 : 0
      });

      results.summary.totalHours += totalHours;
      results.summary.billableHours += billableHours;
    });

    // Add main chart
    results.charts.push({
      type: config.chartType || 'bar',
      title: 'Heures par projet',
      data: {
        labels: results.summary.byProject.map(p => p.name),
        datasets: [{
          label: 'Heures',
          data: results.summary.byProject.map(p => p.hours)
        }]
      }
    });

    return results;
  }
};