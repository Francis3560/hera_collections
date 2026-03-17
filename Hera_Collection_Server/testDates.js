
import { 
  subDays, 
  subMonths, 
  subYears, 
  startOfDay, 
  startOfMonth, 
  startOfYear, 
  endOfYear, 
  endOfMonth, 
  eachMonthOfInterval,
  addDays 
} from 'date-fns';

const now = new Date();
const timeframe = 'month';
let startDate = subMonths(now, 1);
let endDate = now;

const periodDuration = endDate.getTime() - startDate.getTime();
const prevStartDate = new Date(startDate.getTime() - periodDuration);
const prevEndDate = new Date(startDate.getTime());

console.log('startDate:', startDate);
console.log('endDate:', endDate);
console.log('prevStartDate:', prevStartDate);
console.log('prevEndDate:', prevEndDate);
