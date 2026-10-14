import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Camera, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  Clock, 
  UploadCloud, 
  Sparkles, 
  Info, 
  Check, 
  X,
  FileQuestion,
  Building2,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActivityTask, Category } from '../types';
import { UNEXECUTED_REASONS } from '../data/initialTasks';

interface TaskCardProps {
  task: ActivityTask;
  onUpdateStatus: (taskId: string, status: 'completed' | 'not_executed' | 'pending', reason?: string, notes?: string) => void;
  onEditTask: (task: ActivityTask) => void;
  onDeleteTask: (taskId: string) => void;
  onAddPhoto: (taskId: string, photoUrl: string) => void;
  onScheduleDate?: (taskId: string, date: string, customerId?: string) => void;
}

const CATEGORY_THEMES: Record<Category, {
  headerBg: string;
  headerText: string;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
  completedBg: string;
  completedBorder: string;
}> = {
  '簽約提報': {
    headerBg: 'bg-blue-600',
    headerText: 'text-white',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    accentBorder: 'border-blue-300',
    completedBg: 'bg-emerald-50/80',
    completedBorder: 'border-emerald-300'
  },
  '陳列輔銷': {
    headerBg: 'bg-pink-600',
    headerText: 'text-white',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-800',
    accentBorder: 'border-pink-300',
    completedBg: 'bg-emerald-50/80',
    completedBorder: 'border-emerald-300'
  },
  '盤點退轉': {
    headerBg: 'bg-sky-600',
    headerText: 'text-white',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    accentBorder: 'border-sky-300',
    completedBg: 'bg-emerald-50/80',
    completedBorder: 'border-emerald-300'
  },
  '寄單收款': {
    headerBg: 'bg-emerald-600',
    headerText: 'text-white',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    accentBorder: 'border-emerald-300',
    completedBg: 'bg-emerald-50/80',
    completedBorder: 'border-emerald-300'
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdateStatus,
  onEditTask,
  onDeleteTask,
  onAddPhoto,
  onScheduleDate
}) => {
  // If task is completed or not_executed, default to collapsed/minimized ended state
  const isEnded = task.status === 'completed' || task.status === 'not_executed';
  const [isExpanded, setIsExpanded] = useState<boolean>(!isEnded);
  const [showTableDetails, setShowTableDetails] = useState<boolean>(false);
  
  // Mandatory Reason Modal State for "未執行"
  const [showReasonModal, setShowReasonModal] = useState<boolean>(false);
  const [selectedPresetReason, setSelectedPresetReason] = useState<string>(task.unexecutedReason || UNEXECUTED_REASONS[0]);
  const [reasonDetail, setReasonDetail] = useState<string>('');
  const [reasonError, setReasonError] = useState<string>('');
  const [notesText, setNotesText] = useState<string>(task.executionNotes || '');

  const theme = CATEGORY_THEMES[task.category] || CATEGORY_THEMES['陳列輔銷'];
  const isCompleted = task.status === 'completed';
  const isNotExecuted = task.status === 'not_executed';

  // Mark Completed -> Smooth Direct End & Minimize
  const handleMarkCompleted = () => {
    setShowReasonModal(false);
    onUpdateStatus(task.id, 'completed', undefined, notesText);
    setIsExpanded(false);
  };

  // Open Mandatory Reason Modal for Not Executed
  const handleOpenNotExecutedModal = () => {
    setSelectedPresetReason(task.unexecutedReason ? task.unexecutedReason.split(' - ')[0] : UNEXECUTED_REASONS[0]);
    setReasonDetail(task.unexecutedReason && task.unexecutedReason.includes(' - ') ? task.unexecutedReason.split(' - ')[1] : '');
    setReasonError('');
    setShowReasonModal(true);
  };

  // Submit & Enforce Mandatory Reason Validation
  const handleConfirmNotExecuted = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const combinedReason = reasonDetail.trim() 
      ? `${selectedPresetReason} - ${reasonDetail.trim()}`
      : selectedPresetReason;

    if (!combinedReason || !combinedReason.trim()) {
      setReasonError('請選擇或填寫未執行原因（必填）');
      return;
    }

    setReasonError('');
    onUpdateStatus(task.id, 'not_executed', combinedReason.trim(), notesText);
    setShowReasonModal(false);
    setIsExpanded(false);
  };

  // Reopen task back to pending
  const handleReopenTask = () => {
    onUpdateStatus(task.id, 'pending', undefined, notesText);
    setIsExpanded(true);
  };

  const handleSimulatePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onAddPhoto(task.id, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSamplePhoto = () => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80'
    ];
    const randomPhoto = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    onAddPhoto(task.id, randomPhoto);
  };

  /* =========================================================================
     COMPACT / MINIMIZED STATE FOR [已完成]
     ========================================================================= */
  if (isCompleted && !isExpanded) {
    return (
      <div
        className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-colors hover:bg-slate-50/80"
      >
        {/* Compact Bar (Top row) */}
        <div 
          onClick={() => setIsExpanded(true)}
          className="bg-slate-100/90 text-slate-700 px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none border-b border-slate-200"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Behavior as Title + Title in Gray */}
            <span className="font-bold text-xs tracking-wide text-slate-400 truncate">
              【{task.category}】{task.title}
            </span>
            {task.customerName && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/90 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                <Building2 size={10} className="text-slate-400" />
                <span>{task.customerName}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0">
            {/* Badge */}
            <span className="text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
              <Check size={11} strokeWidth={3} />
              <span>已完成</span>
            </span>
            <ChevronDown size={14} className="text-slate-400 ml-0.5" />
          </div>
        </div>

        {/* Compact Body preview */}
        <div 
          onClick={() => setIsExpanded(true)}
          className="px-3.5 py-2 flex items-center justify-between gap-3 text-xs text-slate-600 cursor-pointer"
        >
          <p className="truncate text-slate-400 text-[11px] flex-1">
            {task.description}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-slate-400">
              {task.startDate} ~ {task.endDate}
            </span>
            <span className="text-[10px] text-blue-600 font-bold hover:underline">
              展開
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     COMPACT / MINIMIZED STATE FOR [未執行 (直接結束並標示)]
     ========================================================================= */
  if (isNotExecuted && !isExpanded) {
    return (
      <div
        className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-colors hover:bg-slate-50/80"
      >
        {/* Compact Bar (Top row) */}
        <div 
          onClick={() => setIsExpanded(true)}
          className="bg-slate-100/90 text-slate-700 px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none border-b border-slate-200"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Behavior as Title + Title in Gray with line-through */}
            <span className="line-through font-bold text-xs tracking-wide text-slate-400 truncate">
              【{task.category}】{task.title}
            </span>
            {task.customerName && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/90 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                <Building2 size={10} className="text-slate-400" />
                <span>{task.customerName}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0">
            {/* Badge */}
            <span className="text-[11px] font-bold bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
              <XCircle size={11} />
              <span>已取消</span>
            </span>
            <ChevronDown size={14} className="text-slate-400 ml-0.5" />
          </div>
        </div>

        {/* Compact Body preview */}
        <div 
          onClick={() => setIsExpanded(true)}
          className="px-3.5 py-2 flex items-center justify-between gap-3 text-xs text-slate-600 cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate flex-1">
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded shrink-0">
              原因：{task.unexecutedReason || '未標註原因'}
            </span>
            <p className="truncate text-slate-400 text-[11px]">
              {task.description}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-blue-600 font-bold hover:underline">
              展開查看/重啟
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     EXPANDED STATE (待辦活動完整卡片)
     ========================================================================= */
  return (
    <div
      className={`rounded-2xl border ${
        isCompleted || isNotExecuted
          ? 'border-slate-200 bg-white' 
          : theme.accentBorder + ' bg-white'
      } shadow-2xs overflow-hidden transition-all duration-150`}
    >
      {/* 1. Activity Header Banner */}
      <div className={`
        ${isCompleted || isNotExecuted 
          ? 'bg-slate-100 text-slate-700 border-b border-slate-200' 
          : `${theme.headerBg} text-white`} 
        px-3.5 py-2.5 flex items-center justify-between
      `}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {task.status === 'completed' ? (
            <span className="bg-emerald-600 p-0.5 rounded-full text-white">
              <CheckCircle2 size={15} />
            </span>
          ) : task.status === 'not_executed' ? (
            <span className="bg-rose-600 p-0.5 rounded-full text-white">
              <XCircle size={15} />
            </span>
          ) : (
            <span className="bg-white/20 p-0.5 rounded-full text-white">
              <Check size={14} strokeWidth={3} />
            </span>
          )}

          {/* Behavior as Title: 【行為】活動主旨, Title rendered in gray when completed or canceled */}
          <h4 className={`font-bold text-xs sm:text-sm tracking-wide truncate ${
            isCompleted 
              ? 'text-slate-400' 
              : isNotExecuted 
                ? 'line-through text-slate-400' 
                : 'text-white'
          }`}>
            【{task.category}】{task.title}
          </h4>

          {/* Badge */}
          {isCompleted && (
            <span className="text-[11px] bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
              <Check size={11} strokeWidth={3} />
              <span>已完成</span>
            </span>
          )}
          {isNotExecuted && (
            <span className="text-[11px] bg-rose-600 text-white font-bold px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
              <XCircle size={11} />
              <span>已取消</span>
            </span>
          )}
          {!isEnded && (
            <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
              進行中
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {task.requirePhoto && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isEnded ? 'bg-slate-300 text-slate-700' : 'bg-white/20 text-white'
            }`}>
              <Camera size={11} />
              <span>需拍照</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => onEditTask(task)}
            title="編輯活動內容"
            className={`p-1 rounded hover:bg-slate-300/60 transition-colors ${
              isEnded ? 'text-slate-600' : 'text-white hover:bg-white/20'
            }`}
          >
            <Edit3 size={14} />
          </button>

          {(isCompleted || isNotExecuted) && (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              title="收合縮小"
              className="p-1 rounded hover:bg-white/20 transition-colors text-white flex items-center gap-0.5 text-[11px]"
            >
              <ChevronUp size={14} />
              <span className="hidden sm:inline">縮小</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice Banner if Marked as Not Executed */}
      {isNotExecuted && (
        <div className="bg-rose-100/90 border-b border-rose-200 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-rose-950">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle size={14} className="text-rose-600 shrink-0" />
            <span>【未執行結束】原因：<span className="underline font-semibold">{task.unexecutedReason || '未標註原因'}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenNotExecutedModal}
              className="text-[11px] font-bold text-rose-700 bg-white hover:bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 transition-colors"
            >
              修改原因
            </button>
            <button
              type="button"
              onClick={handleReopenTask}
              className="text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 transition-colors"
            >
              重新開啟活動
            </button>
          </div>
        </div>
      )}

      {/* Customer & Scheduled Date Banner */}
      {(task.customerName || task.scheduledDate) && (
        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {task.customerName ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-blue-900 bg-blue-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Building2 size={12} className="text-blue-700" />
                  <span>拜訪客戶：{task.customerName}</span>
                </span>
                {task.customerCode && (
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">[{task.customerCode}]</span>
                )}
                {task.customerTier && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-blue-600 text-white rounded">
                    {task.customerTier}級
                  </span>
                )}
                {task.customerRegion && (
                  <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                    <MapPin size={10} className="text-slate-400" />
                    {task.customerRegion}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                <Building2 size={12} className="text-slate-400" />
                <span>多門市關聯活動</span>
              </span>
            )}
          </div>

          {/* Completion Date or Status Display */}
          <div className="flex items-center gap-1.5 shrink-0">
            {task.status === 'completed' ? (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Calendar size={12} className="text-emerald-600" />
                <span>完成日期：{task.completedDate || task.reportedDate || task.scheduledDate || '今日'}</span>
              </span>
            ) : task.scheduledDate ? (
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Calendar size={12} className="text-blue-600" />
                <span>日期：{task.scheduledDate}</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Clock size={12} className="text-amber-600" />
                <span>待完成 (完成自動壓今天)</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Main Activity Body */}
      <div className="p-3.5 space-y-3">
        {/* Date Row */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 pb-1 border-b border-slate-100">
          <div className="flex items-center gap-1 text-slate-600 font-medium text-[11px]">
            <Calendar size={12} className="text-slate-400" />
            <span>時間起迄：</span>
            <span className="text-slate-800 font-bold">{task.startDate}</span>
            <span>~</span>
            <span className="text-slate-800 font-bold">{task.endDate}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {task.status === 'completed' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 size={11} /> 已完成 (已結束)
              </span>
            )}
            {task.status === 'not_executed' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                <XCircle size={11} /> 未執行 (已結束)
              </span>
            )}
            {task.status === 'pending' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <Clock size={11} /> 待辦進行中
              </span>
            )}
          </div>
        </div>

        {/* Activity Description */}
        <p className="text-xs text-slate-700 leading-relaxed font-normal">
          {task.description}
        </p>

        {/* 3. Detailed Specification Table */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => setShowTableDetails(!showTableDetails)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
          >
            <Info size={12} />
            <span>{showTableDetails ? '收合活動格式明細表' : '查看完整活動格式欄位表 (起迄/類別/拍照/描述)'}</span>
            {showTableDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showTableDetails && (
            <div className="overflow-hidden mt-2 transition-all">
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 text-xs">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-3 font-bold text-slate-600 bg-slate-100 w-28">1. 主旨</td>
                      <td className="py-1.5 px-3 text-slate-900 font-semibold">{task.title}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-3 font-bold text-slate-600 bg-slate-100">2. 類別</td>
                      <td className="py-1.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${theme.badgeBg} ${theme.badgeText}`}>
                          {task.category}
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-3 font-bold text-slate-600 bg-slate-100">3. 開始日期</td>
                      <td className="py-1.5 px-3 text-slate-700">{task.startDate}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-3 font-bold text-slate-600 bg-slate-100">4. 結束日期</td>
                      <td className="py-1.5 px-3 text-slate-700">{task.endDate}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-3 font-bold text-slate-600 bg-slate-100">5. 是否需拍照</td>
                      <td className="py-1.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${task.requirePhoto ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                          {task.requirePhoto ? '是 (需拍照存證)' : '否 (不需拍照)'}
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-3 font-bold text-slate-600 bg-slate-100 align-top">6. 活動描述</td>
                      <td className="py-1.5 px-3 text-slate-700 leading-relaxed text-[11px]">{task.description}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-bold text-slate-600 bg-slate-100 align-top">7. 關聯客戶</td>
                      <td className="py-1.5 px-3 text-slate-700 text-[11px]">
                        {task.customerName ? (
                          <span className="font-semibold text-blue-700">
                            {task.customerName} [{task.customerCode}]
                          </span>
                        ) : task.targetCustomers ? (
                          <span>共綁定 {task.targetCustomers.length} 家門市</span>
                        ) : (
                          '尚未關聯客戶'
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 3.5 Target Customers Schedule Status (If multi-customer task) */}
        {task.targetCustomers && task.targetCustomers.length > 1 && (
          <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Building2 size={13} className="text-blue-600" />
                <span>各門市客戶排程狀況 ({task.targetCustomers.length} 家)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                已排程 {task.targetCustomers.filter(c => c.scheduledDate).length} / 未排程 {task.targetCustomers.filter(c => !c.scheduledDate).length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {task.targetCustomers.map((cust) => (
                <div 
                  key={cust.customerId}
                  className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                      <span>{cust.customerName}</span>
                      {cust.customerTier && (
                        <span className="text-[9px] font-extrabold px-1 bg-slate-100 text-slate-600 rounded">
                          {cust.customerTier}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      [{cust.customerCode}]
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="date"
                      value={cust.scheduledDate || ''}
                      onChange={(e) => onScheduleDate?.(task.id, e.target.value, cust.customerId)}
                      className={`text-[10px] font-bold rounded px-1.5 py-0.5 border cursor-pointer focus:outline-none ${
                        cust.scheduledDate 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                      title={cust.scheduledDate ? '點擊變更排程日期' : '點擊選擇排程日期'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Photo Evidence (If required or has photos) */}
        {((task.photos && task.photos.length > 0) || task.requirePhoto) && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Camera size={13} className="text-blue-500" />
                現場拍照存證 {task.requirePhoto && <span className="text-rose-500">*</span>}
              </span>
              <div className="flex items-center gap-1.5">
                <label className="cursor-pointer text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 transition-colors flex items-center gap-1">
                  <UploadCloud size={12} />
                  <span>上傳照片</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSimulatePhotoUpload}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSamplePhoto}
                  className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Sparkles size={12} className="text-amber-500" />
                  <span>模擬拍照</span>
                </button>
              </div>
            </div>

            {task.photos && task.photos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {task.photos.map((imgUrl, index) => (
                  <div key={index} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                    <img
                      src={imgUrl}
                      alt={`存證照片 ${index + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-[11px] text-slate-400">
                尚未拍攝現場陳列照片 (請點擊上方拍照或上傳)
              </div>
            )}
          </div>
        )}

        {/* 5. Execution Buttons: [未執行] and [完成] */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            type="button"
            onClick={() => onDeleteTask(task.id)}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
            title="刪除此活動"
          >
            <Trash2 size={15} />
          </button>

          <div className="flex items-center gap-2">
            {/* 未執行按鈕 (開啟必填原因視窗) */}
            <button
              type="button"
              onClick={handleOpenNotExecutedModal}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 shadow-2xs ${
                task.status === 'not_executed'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
              }`}
            >
              <XCircle size={14} />
              <span>{task.status === 'not_executed' ? '未執行 (已結束)' : '未執行 (結束活動)'}</span>
            </button>

            {/* 完成按鈕 (點擊後自動結束並縮小) */}
            <button
              type="button"
              onClick={handleMarkCompleted}
              className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                task.status === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>{task.status === 'completed' ? '已完成 (縮小)' : '完成'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Mandatory Reason Modal for Not Executed (平順簡潔，必填驗證) */}
      <AnimatePresence>
        {showReasonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-rose-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-5 py-3.5 bg-rose-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} />
                  <h3 className="font-bold text-sm tracking-wide">
                    填寫未執行原因（必填）
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReasonModal(false)}
                  className="p-1 rounded-lg text-rose-100 hover:text-white hover:bg-rose-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleConfirmNotExecuted} className="p-5 space-y-4">
                <div>
                  <p className="text-xs text-slate-600 mb-2">
                    活動項目：<span className="font-bold text-slate-800">{task.title}</span>
                  </p>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    請選擇主要原因 <span className="text-rose-500">*</span>
                  </label>
                  
                  {/* Preset Reasons Chips */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {UNEXECUTED_REASONS.map((reason) => {
                      const isSelected = selectedPresetReason === reason;
                      return (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => {
                            setSelectedPresetReason(reason);
                            setReasonError('');
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold text-left transition-colors border ${
                            isSelected
                              ? 'bg-rose-50 border-rose-500 text-rose-800 font-bold shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {reason}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional/Detailed Reason Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    補充說明或備註 (選填)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="例如：店長表示需待下週總公司評估後再行安排..."
                    value={reasonDetail}
                    onChange={(e) => setReasonDetail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-colors resize-none"
                  />
                </div>

                {/* Error Message if empty */}
                {reasonError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700 flex items-center gap-1.5">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{reasonError}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowReasonModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <XCircle size={14} />
                    <span>確認並直接結束活動</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

