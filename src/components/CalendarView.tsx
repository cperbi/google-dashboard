import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Building2
} from 'lucide-react';
import { ActivityTask, Customer, TaskStatus } from '../types';

interface CalendarViewProps {
  selectedDate: string; // e.g. '2026-09-23'
  onSelectDate: (date: string) => void;
  onOpenDayDetails: (date: string, customerId?: string) => void;
  onScheduleTask?: (taskId: string, date: string, customerId?: string) => void;
  onUpdateStatus?: (taskId: string, status: 'completed' | 'not_executed' | 'pending', reason?: string, notes?: string, reportDate?: string) => void;
  tasks: ActivityTask[];
  customers: Customer[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onSelectDate,
  onOpenDayDetails,
  onScheduleTask,
  onUpdateStatus,
  tasks,
  customers
}) => {
  // Calendar view mode: 'month' (月) | 'week' (週)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Year & Month: default to 2026 / 09 as in Screenshot 4
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 1-12

  // Modal to schedule unscheduled customer tasks
  const [showUnscheduledModal, setShowUnscheduledModal] = useState<boolean>(false);
  const [targetScheduleDate, setTargetScheduleDate] = useState<string>(selectedDate || '2026-09-23');

  const daysOfWeek = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(9);
    onSelectDate('2026-09-23');
  };

  // Generate calendar grid for current year and month (42 cells: 6 weeks x 7 days, starting Monday)
  const getCalendarCells = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // In JS, getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
    let startDayOfWeek = firstDayOfMonth.getDay();
    // Shift so Monday is 0, Sunday is 6
    let mondayShift = (startDayOfWeek + 6) % 7;

    // Previous month filler days
    const prevMonthLastDate = new Date(currentYear, currentMonth - 1, 0).getDate();

    const cells: {
      dateString: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    // Prev month days
    for (let i = mondayShift - 1; i >= 0; i--) {
      const day = prevMonthLastDate - i;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dateString: dateStr,
        dayNum: day,
        isCurrentMonth: false,
        isToday: dateStr === '2026-09-23',
        isSelected: dateStr === selectedDate
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dateString: dateStr,
        dayNum: day,
        isCurrentMonth: true,
        isToday: dateStr === '2026-09-23',
        isSelected: dateStr === selectedDate
      });
    }

    // Next month days to fill 35 or 42 cells
    const remaining = 35 - cells.length > 0 ? 35 - cells.length : 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dateString: dateStr,
        dayNum: day,
        isCurrentMonth: false,
        isToday: dateStr === '2026-09-23',
        isSelected: dateStr === selectedDate
      });
    }

    return cells;
  };

  const calendarCells = getCalendarCells();

  // Get customers scheduled for a date (from customers list)
  const getCustomersForDate = (dateStr: string) => {
    const normalized = dateStr.replace(/-/g, '/');
    const monthDay = dateStr.slice(5).replace('-', '/');
    return customers.filter(c => c.scheduledDate && (
      c.scheduledDate === dateStr || 
      c.scheduledDate === normalized || 
      c.scheduledDate === monthDay
    ));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* 1. Calendar Header Bar matching Screenshot 4 */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-2xs">
        {/* Left: 月 / 週 切換按鈕 */}
        <div className="flex items-center gap-1">
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'month' 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              月
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'week' 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              週
            </button>
          </div>
        </div>

        {/* Center: Month Selector < 2026/09 > */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="w-7 h-7 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-2xs"
            title="上個月"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="font-bold text-base text-slate-800 tracking-wide px-2">
            {currentYear}/{String(currentMonth).padStart(2, '0')}
          </span>

          <button
            onClick={handleNextMonth}
            className="w-7 h-7 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-2xs"
            title="下個月"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right Action Buttons: 重新整理 | 今天 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {}}
            className="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <RotateCw size={12} />
            <span className="hidden sm:inline">重新整理</span>
          </button>

          <button
            onClick={handleGoToday}
            className="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            今天
          </button>
        </div>
      </div>

      {/* 2. Calendar Grid Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-white text-center text-xs font-bold text-slate-700">
        {daysOfWeek.map((day, idx) => (
          <div 
            key={day} 
            className={`py-2 border-r border-slate-100 last:border-r-0 ${
              idx >= 5 ? 'text-slate-500 bg-slate-50/50' : ''
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 3. Calendar Grid Body */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-white divide-x divide-y divide-slate-100 overflow-y-auto">
        {calendarCells.map((cell) => {
          // 依要求：代辦事項不用產生在行事曆上，僅呈現已排程之客戶拜訪
          const dayCustomers = getCustomersForDate(cell.dateString);
          const hasEvents = dayCustomers.length > 0;
          const isTodayHighlight = cell.dateString === '2026-09-23';

          return (
            <div
              key={cell.dateString}
              onClick={() => {
                onSelectDate(cell.dateString);
              }}
              onDoubleClick={() => {
                onOpenDayDetails(cell.dateString);
              }}
              className={`
                min-h-[85px] sm:min-h-[95px] p-1.5 flex flex-col justify-between cursor-pointer transition-colors relative group
                ${!cell.isCurrentMonth ? 'bg-slate-50/60 text-slate-400' : 'bg-white text-slate-700'}
                ${isTodayHighlight ? 'bg-amber-50/70 ring-1 ring-amber-300' : ''}
                ${cell.isSelected ? 'ring-2 ring-blue-500 z-10' : 'hover:bg-blue-50/40'}
              `}
            >
              {/* Day Number and Add Button */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${
                  isTodayHighlight 
                    ? 'text-amber-900 bg-amber-200/70 px-1.5 py-0.2 rounded' 
                    : cell.isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  {cell.dayNum}日
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDayDetails(cell.dateString);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded font-bold transition-opacity cursor-pointer"
                  title="進入當日日誌"
                >
                  排行程
                </button>
              </div>

              {/* Scheduled Customer Visits (僅顯示客戶拜訪，不產生待辦事項) */}
              <div className="flex-1 mt-1 space-y-1 overflow-hidden">
                {dayCustomers.map(cust => (
                  <div
                    key={cust.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDayDetails(cell.dateString, cust.id);
                    }}
                    className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold truncate flex items-center gap-1 hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs"
                    title={`拜訪 ${cust.name} [${cust.code}] - 點擊填寫此客戶行程與4宮格`}
                  >
                    <Building2 size={10} className="shrink-0 text-blue-600" />
                    <span className="truncate">{cust.name}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Quick Count if has customer visits */}
              {hasEvents && (
                <div className="pt-0.5 text-[9px] text-blue-700 font-bold text-right">
                  {dayCustomers.length} 家拜訪
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
