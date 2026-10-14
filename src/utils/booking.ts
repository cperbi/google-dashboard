import { ActivityTask, Customer } from '../types';

/**
 * 標準化日期格式為 YYYY-MM-DD
 */
export function normalizeDate(dateStr?: string, defaultYear = '2026'): string {
  if (!dateStr) return '';
  const cleaned = dateStr.trim().replace(/\//g, '-');
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^\d{2}-\d{2}$/.test(cleaned)) {
    return `${defaultYear}-${cleaned}`;
  }
  return cleaned;
}

export interface CustomerBookingResult {
  isBooked: boolean;
  bookedDates: string[];
}

export interface TaskBookingInfo {
  bookingRate: number; // 0 ~ 100
  bookedCount: number;
  totalCount: number;
  endDate: string;
  customerBookingMap: Record<string, CustomerBookingResult>;
}

/**
 * 檢查某客戶是否在 [fromDate, toDate] (從今天往後到活動最終天) 的行事曆上
 * @param customerId 客戶 ID
 * @param fromDate 今天 (例如 '2026-09-23')
 * @param toDate 活動最終天 (例如 '2026-09-30')
 * @param customers 客戶清單 (有 scheduledDate)
 * @param allTasks 所有活動任務 (可能已有排程或回報日期)
 */
export function checkCustomerBookingOnCalendar(
  customerId: string,
  fromDate: string,
  toDate: string,
  customers: Customer[],
  allTasks: ActivityTask[]
): CustomerBookingResult {
  const dates = new Set<string>();
  const normalizedFrom = normalizeDate(fromDate);
  const normalizedTo = normalizeDate(toDate);

  // 1. 檢查 customers 表中該客戶的 scheduledDate
  const cust = customers.find(c => c.id === customerId);
  if (cust?.scheduledDate) {
    const norm = normalizeDate(cust.scheduledDate);
    if (norm && norm >= normalizedFrom && norm <= normalizedTo) {
      dates.add(norm);
    }
  }

  // 2. 檢查所有任務 (allTasks) 中，該客戶是否有排程在區間內的紀錄
  allTasks.forEach(t => {
    if (t.targetCustomers && t.targetCustomers.length > 0) {
      t.targetCustomers.forEach(tc => {
        if (tc.customerId === customerId) {
          [tc.scheduledDate, tc.reportedDate, tc.completedDate].forEach(d => {
            if (d) {
              const norm = normalizeDate(d);
              if (norm && norm >= normalizedFrom && norm <= normalizedTo) {
                dates.add(norm);
              }
            }
          });
        }
      });
    } else if (t.customerId === customerId) {
      [t.scheduledDate, t.reportedDate, t.completedDate].forEach(d => {
        if (d) {
          const norm = normalizeDate(d);
          if (norm && norm >= normalizedFrom && norm <= normalizedTo) {
            dates.add(norm);
          }
        }
      });
    }
  });

  const bookedDates = Array.from(dates).sort();
  return {
    isBooked: bookedDates.length > 0,
    bookedDates
  };
}

/**
 * 計算單一活動任務的 Booking 率
 * 依使用者規範：從今天往後到活動最終天 是否有同樣客戶ID的客戶在行事曆上
 */
export function calculateTaskBookingRate(
  task: ActivityTask,
  currentDate: string,
  customers: Customer[],
  allTasks: ActivityTask[]
): TaskBookingInfo {
  const endDate = normalizeDate(task.endDate || task.scheduledDate || currentDate);
  const targetCusts = task.targetCustomers || [];
  const customerBookingMap: Record<string, CustomerBookingResult> = {};

  if (targetCusts.length > 0) {
    let bookedCount = 0;
    targetCusts.forEach(c => {
      const res = checkCustomerBookingOnCalendar(c.customerId, currentDate, endDate, customers, allTasks);
      customerBookingMap[c.customerId] = res;
      if (res.isBooked) {
        bookedCount++;
      }
    });

    const bookingRate = targetCusts.length > 0 
      ? Math.round((bookedCount / targetCusts.length) * 100) 
      : 0;

    return {
      bookingRate,
      bookedCount,
      totalCount: targetCusts.length,
      endDate,
      customerBookingMap
    };
  } else if (task.customerId) {
    const res = checkCustomerBookingOnCalendar(task.customerId, currentDate, endDate, customers, allTasks);
    customerBookingMap[task.customerId] = res;
    return {
      bookingRate: res.isBooked ? 100 : 0,
      bookedCount: res.isBooked ? 1 : 0,
      totalCount: 1,
      endDate,
      customerBookingMap
    };
  } else {
    // 無特定客戶活動
    const norm = normalizeDate(task.scheduledDate || '');
    const isBooked = norm ? (norm >= normalizeDate(currentDate) && norm <= endDate) : false;
    return {
      bookingRate: isBooked ? 100 : 0,
      bookedCount: isBooked ? 1 : 0,
      totalCount: 1,
      endDate,
      customerBookingMap: {}
    };
  }
}
