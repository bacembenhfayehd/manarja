import { Injectable } from '@nestjs/common';

@Injectable()
export class DateRangeUtil {

  // Get predefined date ranges
  getDateRange(range: string): { from: Date; to: Date } {
    const now = new Date();
    const ranges = {
      today: {
        from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      },
      yesterday: {
        from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        to: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
      },
      thisWeek: {
        from: this.getStartOfWeek(now),
        to: this.getEndOfWeek(now)
      },
      lastWeek: {
        from: this.getStartOfWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
        to: this.getEndOfWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
      },
      thisMonth: {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      },
      lastMonth: {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      },
      thisYear: {
        from: new Date(now.getFullYear(), 0, 1),
        to: new Date(now.getFullYear(), 11, 31, 23, 59, 59)
      },
      lastYear: {
        from: new Date(now.getFullYear() - 1, 0, 1),
        to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
      }
    };

    return ranges[range] || ranges.thisMonth;
  }

  // Generate date intervals for charts
  generateDateIntervals(from: Date, to: Date, interval: 'day' | 'week' | 'month'): Date[] {
    const dates: Date[] = [];
    const current = new Date(from);

    while (current <= to) {
      dates.push(new Date(current));
      
      switch (interval) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }

    return dates;
  }

  // Format date for different contexts
  formatDate(date: Date, format: 'short' | 'long' | 'iso'): string {
    switch (format) {
      case 'short':
        return date.toLocaleDateString();
      case 'long':
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'iso':
        return date.toISOString().split('T')[0];
      default:
        return date.toLocaleDateString();
    }
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  private getEndOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? 0 : 7);
    return new Date(d.setDate(diff));
  }
}