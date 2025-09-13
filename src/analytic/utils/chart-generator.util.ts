import { Injectable } from '@nestjs/common';

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  title: string;
  data: any[];
  xField?: string;
  yField?: string;
  colorField?: string;
}

@Injectable()
export class ChartGeneratorUtil {
  
  // Generate chart configuration for frontend
  generateChartConfig(config: ChartConfig) {
    const baseConfig = {
      type: config.type,
      data: {
        labels: [],
        datasets: [{
          label: config.title,
          data: [],
          backgroundColor: this.getColors(config.data.length),
          borderColor: this.getBorderColors(config.data.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: config.title
          },
          legend: {
            display: config.type === 'pie' || config.type === 'doughnut'
          }
        }
      }
    };

    // Configure based on chart type
    switch (config.type) {
      case 'bar':
      case 'line':
        baseConfig.data.labels = config.data.map(item => item[config.xField]);
        baseConfig.data.datasets[0].data = config.data.map(item => item[config.yField]);
        break;
        
      case 'pie':
      case 'doughnut':
        baseConfig.data.labels = config.data.map(item => item.label || item.name);
        baseConfig.data.datasets[0].data = config.data.map(item => item.value || item.count);
        break;
    }

    return baseConfig;
  }

  // Generate time series chart for analytics
  generateTimeSeriesChart(data: any[], title: string) {
    return this.generateChartConfig({
      type: 'line',
      title,
      data,
      xField: 'date',
      yField: 'value'
    });
  }

  // Generate KPI comparison chart
  generateKPIChart(kpis: any) {
    const data = [
      { label: 'Total Projects', value: kpis.totalProjects },
      { label: 'Active Projects', value: kpis.activeProjects },
      { label: 'Completed Projects', value: kpis.completedProjects }
    ];

    return this.generateChartConfig({
      type: 'doughnut',
      title: 'Project Status Distribution',
      data
    });
  }

  // Generate expense breakdown chart
  generateExpenseChart(expenses: any[]) {
    return this.generateChartConfig({
      type: 'pie',
      title: 'Expense Breakdown by Category',
      data: expenses.map(exp => ({
        label: exp.category,
        value: exp.amount
      }))
    });
  }

  // Generate task status distribution
  generateTaskStatusChart(taskStatus: any[]) {
    return this.generateChartConfig({
      type: 'bar',
      title: 'Task Status Distribution',
      data: taskStatus,
      xField: 'status',
      yField: 'count'
    });
  }

  private getColors(count: number): string[] {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];
    return colors.slice(0, count);
  }

  private getBorderColors(count: number): string[] {
    const borderColors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];
    return borderColors.slice(0, count);
  }
}