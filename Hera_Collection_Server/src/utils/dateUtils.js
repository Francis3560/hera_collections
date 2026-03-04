import { 
  startOfDay, 
  subDays, 
  subMonths, 
  subYears, 
  startOfMonth,
  endOfMonth,
} from 'date-fns';

export const getDatesFromTimeframe = (timeframe) => {
  const now = new Date();
  let startDate;
  let endDate = now;

  switch (String(timeframe).toLowerCase()) {
    case 'today':
    case 'daily':
      startDate = startOfDay(now);
      break;
    case 'yesterday':
      startDate = startOfDay(subDays(now, 1));
      endDate = startOfDay(now);
      break;
    case 'week':
    case 'weekly':
      startDate = subDays(now, 7);
      break;
    case 'month':
    case 'monthly':
      startDate = subMonths(now, 1);
      break;
    case 'quarter':
      startDate = subMonths(now, 3);
      break;
    case 'year':
    case 'yearly':
      startDate = subYears(now, 1);
      break;
    case 'last-month':
      startDate = startOfMonth(subMonths(now, 1));
      endDate = endOfMonth(subMonths(now, 1));
      break;
    default:
      startDate = subMonths(now, 1); 
  }

  return { startDate, endDate };
};
