/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Layers, 
  CheckCircle,
  CheckCircle2
} from 'lucide-react';
import { Category, ActivityTask, Customer, PotentialCustomer, TaskStatus } from './types';
import { initialTasks, initialCustomers, initialPotentialCustomers } from './data/initialTasks';
import { TaskModal } from './components/TaskModal';
import { Sidebar } from './components/Sidebar';
import { CalendarView } from './components/CalendarView';
import { DayDetailView } from './components/DayDetailView';

export default function App() {
  // Navigation State: 'calendar' (月曆主畫面) | 'day_detail' (排行程 / 拜訪填報)
  const [currentView, setCurrentView] = useState<'calendar' | 'day_detail'>('calendar');

  // Mobile navigation state when in 'calendar' view: 'calendar' (月曆) | 'sidebar' (側邊清單)
  const [mobileMainTab, setMobileMainTab] = useState<'calendar' | 'sidebar'>('calendar');

  // Selected date on calendar / day detail
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-23');

  // Selected customer for Day Detail (依要求：點進去後能選擇客戶；未選則為其他欄；選了才出現代辦與4宮格)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Visit Form State
  const [visitSubject, setVisitSubject] = useState<string>('內部作業/其他');
  const [visitType, setVisitType] = useState<string>('內部作業/其他');
  const [customerName, setCustomerName] = useState<string>('');

  // Data states
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [potentialCustomers, setPotentialCustomers] = useState<PotentialCustomer[]>(initialPotentialCustomers);
  const [tasks, setTasks] = useState<ActivityTask[]>(initialTasks);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalDefaultCategory, setModalDefaultCategory] = useState<Category>('陳列輔銷');
  const [editingTask, setEditingTask] = useState<ActivityTask | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Update task status (壓今天完成 / 未執行 / 重啟)
  const handleUpdateTaskStatus = (
    taskId: string, 
    status: TaskStatus, 
    reason?: string, 
    notes?: string, 
    reportDate?: string
  ) => {
    const realTaskId = taskId.includes('__') ? taskId.split('__')[0] : taskId;
    const realCustomerId = taskId.includes('__') ? taskId.split('__')[1] : undefined;
    
    // 依使用者需求：待辦平時不給時間，若業務今天回報，那就算今天！
    const effectiveReportDate = reportDate || selectedDate || '2026-09-23';
    const isReporting = status === 'completed' || status === 'not_executed';
    const stageForStatus = status === 'completed' ? '完成' : (status === 'not_executed' ? '未執行' : '待執行');

    let affectedCustomerName = '';

    setTasks(prev => prev.map(t => {
      if (t.id === realTaskId) {
        let updatedCustomers = t.targetCustomers;
        if (realCustomerId && updatedCustomers) {
          updatedCustomers = updatedCustomers.map(c => {
            if (c.customerId === realCustomerId) {
              affectedCustomerName = c.customerName;
              return {
                ...c,
                status,
                currentStage: stageForStatus,
                unexecutedReason: reason !== undefined ? reason : c.unexecutedReason,
                executionNotes: notes !== undefined ? notes : c.executionNotes,
                // 依使用者需求：不需要有指派，只要完成就壓今天！
                completedDate: status === 'completed' ? effectiveReportDate : (status === 'pending' ? undefined : c.completedDate),
                scheduledDate: isReporting ? (c.scheduledDate || effectiveReportDate) : c.scheduledDate,
                reportedDate: isReporting ? effectiveReportDate : (status === 'pending' ? undefined : c.reportedDate)
              };
            }
            return c;
          });
        }

        return {
          ...t,
          status: realCustomerId ? t.status : status,
          currentStage: realCustomerId ? t.currentStage : stageForStatus,
          unexecutedReason: reason !== undefined ? reason : t.unexecutedReason,
          executionNotes: notes !== undefined ? notes : t.executionNotes,
          completedDate: status === 'completed' ? effectiveReportDate : (status === 'pending' ? undefined : t.completedDate),
          scheduledDate: isReporting ? (t.scheduledDate || effectiveReportDate) : t.scheduledDate,
          reportedDate: isReporting ? effectiveReportDate : (status === 'pending' ? undefined : t.reportedDate),
          targetCustomers: updatedCustomers,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));

    if (isReporting) {
      const targetText = affectedCustomerName ? `「${affectedCustomerName}」` : '';
      setToastMessage(status === 'completed' 
        ? `✅ 已壓今日 (${effectiveReportDate}) 完成${targetText}！` 
        : `✅ 已回報${targetText}為未執行結案！`
      );
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  // 依要求：未完成到完成中間有階段（第一階段、第二階段、第三階段、完成），階段是可以任意跳躍的，每一階段能填寫階段原因，完成亦能選填原因
  const handleUpdateTaskStage = (
    taskId: string,
    stage: string,
    notes?: string,
    reportDate?: string,
    stageReason?: string,
    completionReason?: string
  ) => {
    const realTaskId = taskId.includes('__') ? taskId.split('__')[0] : taskId;
    const realCustomerId = taskId.includes('__') ? taskId.split('__')[1] : undefined;
    const effectiveReportDate = reportDate || selectedDate || '2026-09-23';

    const isCompleted = stage === '完成';
    const isResetPending = stage === '待執行' || stage === '未開始';
    const newStatus: TaskStatus = isCompleted ? 'completed' : 'pending';

    let affectedCustomerName = '';

    setTasks(prev => prev.map(t => {
      if (t.id === realTaskId) {
        let updatedCustomers = t.targetCustomers;
        if (realCustomerId && updatedCustomers) {
          updatedCustomers = updatedCustomers.map(c => {
            if (c.customerId === realCustomerId) {
              affectedCustomerName = c.customerName;
              const existingReasons = c.stageReasons || {};
              const updatedReasons = stageReason !== undefined 
                ? { ...existingReasons, [stage]: stageReason } 
                : existingReasons;

              return {
                ...c,
                currentStage: stage,
                status: newStatus,
                stageReasons: updatedReasons,
                completionReason: completionReason !== undefined ? completionReason : (isCompleted ? c.completionReason : undefined),
                executionNotes: notes !== undefined ? notes : c.executionNotes,
                completedDate: isCompleted ? effectiveReportDate : (isResetPending ? undefined : c.completedDate),
                scheduledDate: c.scheduledDate || effectiveReportDate,
                reportedDate: effectiveReportDate
              };
            }
            return c;
          });
        }

        const existingTaskReasons = t.stageReasons || {};
        const updatedTaskReasons = stageReason !== undefined
          ? { ...existingTaskReasons, [stage]: stageReason }
          : existingTaskReasons;

        return {
          ...t,
          currentStage: stage,
          status: realCustomerId ? t.status : newStatus,
          stageReasons: updatedTaskReasons,
          completionReason: completionReason !== undefined ? completionReason : (isCompleted ? t.completionReason : undefined),
          executionNotes: notes !== undefined ? notes : t.executionNotes,
          completedDate: isCompleted ? effectiveReportDate : (isResetPending ? undefined : t.completedDate),
          scheduledDate: t.scheduledDate || effectiveReportDate,
          reportedDate: effectiveReportDate,
          targetCustomers: updatedCustomers,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));

    const targetText = affectedCustomerName ? `「${affectedCustomerName}」` : '';
    setToastMessage(isCompleted
      ? `✅ 已將${targetText}推進至【完成】並壓今日 (${effectiveReportDate})！`
      : `🚀 已跳躍至【${stage}】${targetText}！`
    );
    setTimeout(() => setToastMessage(''), 3000);
  };

  // 每一階段單獨更新原因
  const handleUpdateStageReason = (
    taskId: string,
    stage: string,
    reason: string
  ) => {
    const realTaskId = taskId.includes('__') ? taskId.split('__')[0] : taskId;
    const realCustomerId = taskId.includes('__') ? taskId.split('__')[1] : undefined;

    setTasks(prev => prev.map(t => {
      if (t.id === realTaskId) {
        let updatedCustomers = t.targetCustomers;
        if (realCustomerId && updatedCustomers) {
          updatedCustomers = updatedCustomers.map(c => {
            if (c.customerId === realCustomerId) {
              return {
                ...c,
                stageReasons: { ...(c.stageReasons || {}), [stage]: reason }
              };
            }
            return c;
          });
        }

        return {
          ...t,
          stageReasons: { ...(t.stageReasons || {}), [stage]: reason },
          targetCustomers: updatedCustomers,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));
  };

  // 依要求：使用者可以自己新增一個階段
  const handleAddCustomStage = (taskId: string, newStageName: string) => {
    if (!newStageName.trim()) return;
    const cleanStage = newStageName.trim();
    const realTaskId = taskId.includes('__') ? taskId.split('__')[0] : taskId;
    const realCustomerId = taskId.includes('__') ? taskId.split('__')[1] : undefined;

    setTasks(prev => prev.map(t => {
      if (t.id === realTaskId) {
        const defaultStages = ['第一階段', '第二階段', '第三階段'];
        const existingStages = t.stages || defaultStages;
        const updatedStages = existingStages.includes(cleanStage) ? existingStages : [...existingStages, cleanStage];

        let updatedCustomers = t.targetCustomers;
        if (updatedCustomers) {
          updatedCustomers = updatedCustomers.map(c => {
            if (!realCustomerId || c.customerId === realCustomerId) {
              const custStages = c.stages || defaultStages;
              return {
                ...c,
                stages: custStages.includes(cleanStage) ? custStages : [...custStages, cleanStage]
              };
            }
            return c;
          });
        }

        return {
          ...t,
          stages: updatedStages,
          targetCustomers: updatedCustomers,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));

    setToastMessage(`✨ 已成功新增自訂階段「${cleanStage}」！`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSaveTask = (task: ActivityTask) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    } else {
      setTasks(prev => [task, ...prev]);
    }
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    const realTaskId = taskId.includes('__') ? taskId.split('__')[0] : taskId;
    setTasks(prev => prev.filter(t => t.id !== realTaskId));
  };

  const handleAddPhotoToTask = (taskId: string, photoUrl: string) => {
    const realTaskId = taskId.includes('__') ? taskId.split('__')[0] : taskId;
    setTasks(prev => prev.map(t => {
      if (t.id === realTaskId) {
        return {
          ...t,
          photos: [...(t.photos || []), photoUrl]
        };
      }
      return t;
    }));
  };

  // Schedule task or customer of task to specific date
  const handleScheduleTask = (taskId: string, date: string, customerId?: string) => {
    const realTaskId = taskId.includes('__') ? taskId.split('__')[0] : taskId;
    const realCustomerId = customerId || (taskId.includes('__') ? taskId.split('__')[1] : undefined);

    setTasks(prev => prev.map(t => {
      if (t.id === realTaskId) {
        let updatedCustomers = t.targetCustomers;
        if (realCustomerId && updatedCustomers) {
          updatedCustomers = updatedCustomers.map(c => 
            c.customerId === realCustomerId ? { ...c, scheduledDate: date } : c
          );
        } else if (updatedCustomers) {
          updatedCustomers = updatedCustomers.map(c => ({ ...c, scheduledDate: date }));
        }

        return {
          ...t,
          scheduledDate: date || t.scheduledDate,
          targetCustomers: updatedCustomers,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));
  };

  // Select customer for visit from sidebar
  const handleSelectCustomerForVisit = (name: string, code?: string) => {
    const cust = customers.find(c => c.name === name || (code && c.code === code));
    setSelectedCustomerId(cust ? cust.id : '');
    setCustomerName(name);
    setVisitSubject(`拜訪 ${name}${code ? ` [${code}]` : ''}`);
    setVisitType('客戶拜訪');
    setCurrentView('day_detail');
  };

  // Switch to day detail view for a specific date (前往該天日誌)
  const handleOpenDayDetails = (date: string, customerId?: string) => {
    setSelectedDate(date);
    if (customerId) {
      const cust = customers.find(c => c.id === customerId);
      setSelectedCustomerId(customerId);
      if (cust) {
        setCustomerName(cust.name);
        setVisitSubject(`拜訪 ${cust.name} [${cust.code}]`);
        setVisitType('客戶拜訪');
      }
    } else {
      setSelectedCustomerId('');
      setCustomerName('');
      setVisitSubject('內部作業/其他');
      setVisitType('內部作業/其他');
    }
    setCurrentView('day_detail');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      {/* On mobile screens, when in calendar view, provide bottom tab switcher between Calendar and Sidebar */}
      {currentView === 'calendar' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around py-2 px-4 shadow-lg">
          <button
            type="button"
            onClick={() => setMobileMainTab('calendar')}
            className={`flex flex-col items-center gap-0.5 text-xs font-bold ${
              mobileMainTab === 'calendar' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <CalendarIcon size={18} />
            <span>行事曆月曆</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileMainTab('sidebar')}
            className={`flex flex-col items-center gap-0.5 text-xs font-bold ${
              mobileMainTab === 'sidebar' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <Layers size={18} />
            <span>清單與活動 ({tasks.length})</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          LEFT SIDEBAR: 客戶(92) | 潛客(3) | 待辦事項 (圖 1, 2, 3, 4 左邊欄)
         ========================================================================= */}
      <div className={`h-full shrink-0 ${
        currentView === 'calendar' 
          ? (mobileMainTab === 'sidebar' ? 'w-full block pb-14 md:pb-0' : 'hidden md:block')
          : 'hidden md:block'
      }`}>
        <Sidebar
          customers={customers}
          potentialCustomers={potentialCustomers}
          tasks={tasks}
          currentDate={selectedDate}
          onSelectDate={handleOpenDayDetails}
          onScheduleTask={handleScheduleTask}
          onUpdateStatus={handleUpdateTaskStatus}
          onSelectCustomerForVisit={handleSelectCustomerForVisit}
        />
      </div>

      {/* =========================================================================
          RIGHT MAIN AREA: 月曆畫面 (圖 4) OR 單日拜訪行程填寫 (圖 1, 2)
         ========================================================================= */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden bg-white ${
        currentView === 'calendar' && mobileMainTab === 'sidebar' ? 'hidden md:flex' : 'flex'
      }`}>
        {currentView === 'calendar' ? (
          /* Calendar View */
          <CalendarView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onOpenDayDetails={handleOpenDayDetails}
            onScheduleTask={handleScheduleTask}
            onUpdateStatus={handleUpdateTaskStatus}
            tasks={tasks}
            customers={customers}
          />
        ) : (
          /* Day Detail & Visit Execution View (依要求：選擇客戶才出現對應代辦與4宮格；未選擇則只能其他欄) */
          <DayDetailView
            selectedDate={selectedDate}
            selectedCustomerId={selectedCustomerId}
            onSelectCustomerId={(id) => {
              setSelectedCustomerId(id);
              const cust = customers.find(c => c.id === id);
              if (cust) {
                setCustomerName(cust.name);
                setVisitSubject(`拜訪 ${cust.name} [${cust.code}]`);
                setVisitType('客戶拜訪');
              }
            }}
            onClearCustomer={() => {
              setSelectedCustomerId('');
              setCustomerName('');
              setVisitSubject('內部作業/其他');
              setVisitType('內部作業/其他');
            }}
            onBackToCalendar={() => setCurrentView('calendar')}
            customers={customers}
            tasks={tasks}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onUpdateTaskStage={handleUpdateTaskStage}
            onUpdateStageReason={handleUpdateStageReason}
            onAddCustomStage={handleAddCustomStage}
            onAddPhotoToTask={handleAddPhotoToTask}
            onSaveDayLog={(log) => {
              setToastMessage(
                log.customerId 
                  ? `✅ 已儲存客戶「${log.customerName}」本日拜訪紀錄與4宮格！` 
                  : `✅ 已成功儲存本日 (${selectedDate}) 其他欄日誌！`
              );
              setTimeout(() => setToastMessage(''), 3000);
            }}
            onSelectDate={setSelectedDate}
          />
        )}
      </div>

      {/* Task Modal (新增/編輯活動) */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        editingTask={editingTask}
        defaultCategory={modalDefaultCategory}
      />

      {/* Auto-Today Report Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
