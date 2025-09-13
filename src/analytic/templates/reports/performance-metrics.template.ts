import { ReportTemplate, PerformanceData } from '../../interfaces/report-config.interface';

export const performanceMetricsTemplate: ReportTemplate<PerformanceData> = {
  name: 'performance-metrics',
  defaultConfig: {
    trackVelocity: true,
    trackCycleTime: true,
    trackBurnDown: false
  },

  async generate(data, config) {
    const { tasks, sprints } = data;
    
    const result = {
      meta: {
        generatedAt: new Date(),
        sprintCount: sprints.length,
        taskCount: tasks.length
      },
      velocity: null as any,
      cycleTime: null as any,
      burnDown: null as any
    };

    if (config.trackVelocity && sprints.length > 0) {
      result.velocity = {
        average: calculateAverageVelocity(sprints),
        lastSprints: sprints.slice(-5).map(s => ({
          name: s.name,
          velocity: s.completedPoints
        }))
      };
    }

    if (config.trackCycleTime && tasks.length > 0) {
      const completedTasks = tasks.filter(t => t.completedAt);
      result.cycleTime = {
        average: calculateAverageCycleTime(completedTasks),
        distribution: buildCycleTimeDistribution(completedTasks)
      };
    }

    return result;
  }
};

// Helper functions
function calculateAverageVelocity(sprints: any[]) {
  const total = sprints.reduce((sum, sprint) => sum + sprint.completedPoints, 0);
  return sprints.length > 0 ? total / sprints.length : 0;
}

function calculateAverageCycleTime(tasks: any[]) {
  const total = tasks.reduce((sum, task) => {
    const created = new Date(task.createdAt).getTime();
    const completed = new Date(task.completedAt).getTime();
    return sum + (completed - created) / (1000 * 60 * 60 * 24); // en jours
  }, 0);
  return tasks.length > 0 ? total / tasks.length : 0;
}

function buildCycleTimeDistribution(tasks: any[]) {
  // simple implementation
  return {
    '0-1': tasks.filter(t => /* logique */).length,
    '1-3': tasks.filter(t => /* logique */).length,
    
  };
}