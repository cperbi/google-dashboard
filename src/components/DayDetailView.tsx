import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  Building2, 
  Search, 
  X, 
  CheckCircle2, 
  XCircle, 
  Camera, 
  Calendar, 
  MapPin, 
  Phone, 
  FileText, 
  LayoutGrid, 
  PackageSearch, 
  Receipt, 
  Clock, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  Check,
  AlertCircle,
  Sparkles,
  Edit3,
  Plus
} from 'lucide-react';
import { Customer, ActivityTask, Category, TaskStatus, TaskCustomerAssignment } from '../types';

interface DayDetailViewProps {
  selectedDate: string;
  selectedCustomerId: string;
  onSelectCustomerId: (customerId: string) => void;
  onClearCustomer: () => void;
  onBackToCalendar: () => void;
  customers: Customer[];
  tasks: ActivityTask[];
  onUpdateTaskStatus: (
    taskId: string, 
    status: TaskStatus, 
    reason?: string, 
    notes?: string, 
    reportDate?: string
  ) => void;
  onUpdateTaskStage?: (
    taskId: string,
    stage: string,
    notes?: string,
    reportDate?: string,
    stageReason?: string,
    completionReason?: string
  ) => void;
  onUpdateStageReason?: (
    taskId: string,
    stage: string,
    reason: string
  ) => void;
  onAddCustomStage?: (
    taskId: string,
    stageName: string
  ) => void;
  onAddPhotoToTask?: (taskId: string, photoUrl: string) => void;
  onSaveDayLog?: (logData: {
    date: string;
    customerId?: string;
    customerName?: string;
    subject: string;
    visitType: string;
    generalResult: string;
    categoryResults: Record<Category, string>;
    selectedCategories: Category[];
  }) => void;
  onSelectDate?: (date: string) => void;
}

export const DayDetailView: React.FC<DayDetailViewProps> = ({
  selectedDate,
  selectedCustomerId,
  onSelectCustomerId,
  onClearCustomer,
  onBackToCalendar,
  customers,
  tasks,
  onUpdateTaskStatus,
  onUpdateTaskStage,
  onUpdateStageReason,
  onAddCustomStage,
  onAddPhotoToTask,
  onSaveDayLog
}) => {
  // 依要求：手機板的拜訪不用全部檢視，只分四宮格（預設）與代辦事項
  const [activeCustomerTab, setActiveCustomerTab] = useState<'behaviors' | 'tasks'>('behaviors');

  // Customer search & dropdown state
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);

  // 拜訪主旨與客戶輸入框（放一起，輸入客戶即為客戶，未找到客戶即為其他）
  const [subjectInputValue, setSubjectInputValue] = useState<string>('');

  // 依要求：手機板的進度用直立的，且預設收合 (map of compositeId -> boolean)
  const [expandedProgressMap, setExpandedProgressMap] = useState<Record<string, boolean>>({});

  // 階段自訂新增狀態 (taskId of task being edited)
  const [addingStageTaskId, setAddingStageTaskId] = useState<string | null>(null);
  const [newStageNameInput, setNewStageNameInput] = useState<string>('');

  // 依要求：每一階段都能填寫階段原因
  const [editingStageReason, setEditingStageReason] = useState<{
    compositeId: string;
    stage: string;
  } | null>(null);
  const [stageReasonInputText, setStageReasonInputText] = useState<string>('');

  // 依要求：完成也可以選填原因 可選擇或其他自填
  const [completionModal, setCompletionModal] = useState<{
    compositeId: string;
    taskTitle: string;
    customerName: string;
    currentNotes?: string;
    existingReason?: string;
  } | null>(null);
  const [completionReasonChoice, setCompletionReasonChoice] = useState<string>('合約提報核准簽署');
  const [customCompletionReason, setCustomCompletionReason] = useState<string>('');

  // General log state (其他欄模式)
  const [generalCategory, setGeneralCategory] = useState<string>('內部作業/其他');
  const [generalResultText, setGeneralResultText] = useState<string>('');
  const [generalPhotos, setGeneralPhotos] = useState<string[]>([]);

  // 4-Quadrant behavior categories state
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([
    '簽約提報',
    '陳列輔銷'
  ]);
  const [categoryResults, setCategoryResults] = useState<Record<Category, string>>({
    '簽約提報': '已向店長確認專案合作提報內容，預計下週安排合約簽署。',
    '陳列輔銷': '已完成端架專屬陳列與最新促銷POP張貼，排面擴充飽滿。',
    '盤點退轉': '',
    '寄單收款': ''
  });
  const [categoryPhotos, setCategoryPhotos] = useState<Record<Category, string[]>>({
    '簽約提報': [],
    '陳列輔銷': [],
    '盤點退轉': [],
    '寄單收款': []
  });

  // State for unexecuted reason modal
  const [unexecutedModalTaskId, setUnexecutedModalTaskId] = useState<string | null>(null);
  const [unexecutedReasonText, setUnexecutedReasonText] = useState<string>('店長不在 / 改期拜訪');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Find selected customer object if any
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId, customers]);

  // Sync input value when selected customer changes
  useEffect(() => {
    if (selectedCustomer) {
      setSubjectInputValue(`拜訪 ${selectedCustomer.name} [${selectedCustomer.code}]`);
    } else {
      if (!subjectInputValue || subjectInputValue.startsWith('拜訪 ')) {
        setSubjectInputValue('內部作業/其他事項');
      }
    }
  }, [selectedCustomer]);

  // Dynamic search matching based on subjectInputValue
  const matchedCustomerFromInput = useMemo(() => {
    if (!subjectInputValue.trim()) return null;
    const cleanText = subjectInputValue
      .replace(/^拜訪\s*/, '')
      .replace(/\[.*?\]/, '')
      .trim()
      .toLowerCase();

    if (!cleanText) return null;

    return customers.find(c => 
      c.name.toLowerCase() === cleanText || 
      c.code.toLowerCase() === cleanText ||
      c.name.toLowerCase().includes(cleanText) ||
      cleanText.includes(c.name.toLowerCase()) ||
      (cleanText.length >= 3 && c.code.toLowerCase().includes(cleanText))
    ) || null;
  }, [subjectInputValue, customers]);

  // Dropdown filtered customers list based on input
  const filteredCustomerList = useMemo(() => {
    const q = subjectInputValue.replace(/^拜訪\s*/, '').trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.code.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, subjectInputValue]);

  // Today's scheduled customers
  const todayScheduledCustomers = useMemo(() => {
    const normalized = selectedDate.replace(/-/g, '/');
    const monthDay = selectedDate.slice(5).replace('-', '/');
    return customers.filter(c => c.scheduledDate && (
      c.scheduledDate === selectedDate || 
      c.scheduledDate === normalized || 
      c.scheduledDate === monthDay
    ));
  }, [customers, selectedDate]);

  // Tasks corresponding to the selected customer
  const customerTasks = useMemo(() => {
    if (!selectedCustomer) return [];

    return tasks.flatMap(task => {
      if (task.targetCustomers && task.targetCustomers.length > 0) {
        const assignment = task.targetCustomers.find(c => 
          c.customerId === selectedCustomer.id || 
          c.customerName === selectedCustomer.name ||
          (c.customerCode && c.customerCode === selectedCustomer.code)
        );

        if (assignment) {
          return [{
            task,
            assignment: {
              ...assignment,
              currentStage: assignment.currentStage || (assignment.status === 'completed' ? '完成' : '待執行'),
              stages: assignment.stages || task.stages || ['第一階段', '第二階段', '第三階段'],
              stageReasons: assignment.stageReasons || task.stageReasons || {},
              completionReason: assignment.completionReason || task.completionReason || ''
            },
            compositeId: `${task.id}__${assignment.customerId}`
          }];
        }
      }

      if (task.customerId === selectedCustomer.id || task.customerName === selectedCustomer.name) {
        const assignment: TaskCustomerAssignment = {
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerCode: selectedCustomer.code,
          customerTier: selectedCustomer.tier,
          customerRegion: selectedCustomer.region,
          scheduledDate: task.scheduledDate,
          reportedDate: task.reportedDate,
          completedDate: task.completedDate,
          status: task.status,
          currentStage: task.currentStage || (task.status === 'completed' ? '完成' : '待執行'),
          stages: task.stages || ['第一階段', '第二階段', '第三階段'],
          stageReasons: task.stageReasons || {},
          completionReason: task.completionReason || '',
          unexecutedReason: task.unexecutedReason,
          executionNotes: task.executionNotes,
          photos: task.photos
        };
        return [{
          task,
          assignment,
          compositeId: `${task.id}__${selectedCustomer.id}`
        }];
      }

      return [];
    });
  }, [tasks, selectedCustomer]);

  // Toggle behavior category in 4-quadrant grid
  const toggleCategory = (cat: Category) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(prev => prev.filter(c => c !== cat));
    } else {
      setSelectedCategories(prev => [...prev, cat]);
    }
  };

  // Update specific category text in 4-quadrant grid
  const updateCategoryResult = (cat: Category, text: string) => {
    setCategoryResults(prev => ({
      ...prev,
      [cat]: text
    }));
  };

  // Add dummy photo simulation
  const handleSimulatePhotoUpload = (type: 'general' | Category) => {
    const dummyPhoto = `https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80`;
    if (type === 'general') {
      setGeneralPhotos(prev => [...prev, dummyPhoto]);
      triggerToast('📷 已附加拍照存證照片！');
    } else {
      setCategoryPhotos(prev => ({
        ...prev,
        [type]: [...(prev[type] || []), dummyPhoto]
      }));
      triggerToast(`📷 已為【${type}】附加現場照片！`);
    }
  };

  // Save full log
  const handleSaveAll = () => {
    if (onSaveDayLog) {
      onSaveDayLog({
        date: selectedDate,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        subject: subjectInputValue,
        visitType: selectedCustomer ? '客戶拜訪' : generalCategory,
        generalResult: generalResultText,
        categoryResults,
        selectedCategories
      });
    }
    triggerToast(
      selectedCustomer 
        ? `✅ 已儲存客戶「${selectedCustomer.name}」本日拜訪紀錄與4宮格！` 
        : `✅ 已成功儲存本日 (${selectedDate}) 其他欄工作日誌！`
    );
  };

  // Preset completion reasons
  const completionPresets = [
    '合約提報核准簽署',
    '促銷活動端架陳列落實',
    '常態庫存盤點與退貨完成',
    '帳款已核銷結案',
    '門市主管核准配合',
    '客戶高度滿意並下單',
    '例行巡店檢核通過'
  ];

  // Stage reason preset suggestions
  const getStageReasonPresets = (stg: string): string[] => {
    if (stg === '第一階段') {
      return ['已聯繫窗口店長', '報價單送審評估中', '初次提案溝通', '等待主管核決'];
    }
    if (stg === '第二階段') {
      return ['樣品交付試用中', '店長口頭允諾', '合約細節校訂', '排期陳列確認'];
    }
    if (stg === '第三階段') {
      return ['門市排面預留完畢', '訂單已建檔', '等待總部核章', '宣傳物料備便'];
    }
    if (stg === '待執行') {
      return ['已排入拜訪行程', '待與店長預約', '等待促銷檔期開跑'];
    }
    return ['進度符合預期', '需進一步協調', '店長反饋正面', '等待對方回覆'];
  };

  // Save stage reason
  const handleSaveStageReason = (compositeId: string, stage: string, reasonText: string) => {
    if (onUpdateStageReason) {
      onUpdateStageReason(compositeId, stage, reasonText.trim());
    } else if (onUpdateTaskStage) {
      onUpdateTaskStage(compositeId, stage, undefined, selectedDate, reasonText.trim());
    }
    triggerToast(`✅ 已更新【${stage}】原因：${reasonText.trim() || '（已清除）'}`);
    setEditingStageReason(null);
    setStageReasonInputText('');
  };

  // Four Behavior Quadrants configuration (不用快捷詞彙)
  const quadrantConfig: {
    id: Category;
    quadrantNum: number;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    bgAccent: string;
    borderAccent: string;
    headerBg: string;
    placeholder: string;
  }[] = [
    {
      id: '簽約提報',
      quadrantNum: 1,
      title: '簽約提報',
      subtitle: '合約用印 · 新合約送審 · 檔期提報',
      icon: <FileText size={17} className="text-blue-600" />,
      color: 'text-blue-700',
      bgAccent: 'bg-blue-50/60',
      borderAccent: 'border-blue-200',
      headerBg: 'bg-blue-600',
      placeholder: '請輸入【簽約提報】之洽談進度、店長意見或待用印項目...'
    },
    {
      id: '陳列輔銷',
      quadrantNum: 2,
      title: '陳列輔銷',
      subtitle: '端架陳列 · POP海報 · 排面擴充',
      icon: <LayoutGrid size={17} className="text-pink-600" />,
      color: 'text-pink-700',
      bgAccent: 'bg-pink-50/60',
      borderAccent: 'border-pink-200',
      headerBg: 'bg-pink-600',
      placeholder: '請輸入【陳列輔銷】之端架位置、排面數量及現場陳列成效...'
    },
    {
      id: '盤點退轉',
      quadrantNum: 3,
      title: '盤點退轉',
      subtitle: '庫存盤點 · 即期品管理 · 調撥退貨',
      icon: <PackageSearch size={17} className="text-sky-600" />,
      color: 'text-sky-700',
      bgAccent: 'bg-sky-50/60',
      borderAccent: 'border-sky-200',
      headerBg: 'bg-sky-600',
      placeholder: '請輸入【盤點退轉】之盤點數字、即期品處理或退換貨明細...'
    },
    {
      id: '寄單收款',
      quadrantNum: 4,
      title: '寄單收款',
      subtitle: '發票寄送 · 貨款支票 · 對帳單簽收',
      icon: <Receipt size={17} className="text-emerald-600" />,
      color: 'text-emerald-700',
      bgAccent: 'bg-emerald-50/60',
      borderAccent: 'border-emerald-200',
      headerBg: 'bg-emerald-600',
      placeholder: '請輸入【寄單收款】之帳務確認金額、支票號碼或付款跟進...'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden bg-slate-100/90 relative w-full">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-3.5 py-2 rounded-xl shadow-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 max-w-[90vw] animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          1. STICKY TOP BAR (手機防跑版優化：安全間距、不溢出)
         ========================================================================= */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-2.5 sm:px-6 py-2 flex items-center justify-between gap-1.5 shadow-2xs w-full">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          <button 
            type="button"
            onClick={onBackToCalendar}
            className="p-1 sm:px-2.5 sm:py-1.5 hover:bg-slate-100 active:bg-slate-200 rounded-lg text-slate-700 transition-colors flex items-center gap-0.5 cursor-pointer font-bold text-xs shrink-0"
            title="返回行事曆"
          >
            <ChevronLeft size={18} className="shrink-0" />
            <span className="text-xs">返回</span>
          </button>

          <div className="h-4 w-px bg-slate-200 shrink-0 hidden xs:block" />

          {/* Date Badge */}
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg text-slate-800 font-mono text-[11px] sm:text-xs font-bold shrink-0">
            <Calendar size={12} className="text-blue-600 shrink-0" />
            <span>{selectedDate.replace(/-/g, '/').slice(5)}</span>
          </div>

          {/* Mode Badge */}
          <span className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-md truncate max-w-[90px] sm:max-w-none ${
            selectedCustomer 
              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {selectedCustomer ? '客戶拜訪' : '其他欄'}
          </span>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <Check size={14} strokeWidth={2.5} />
            <span>儲存</span>
          </button>
        </div>
      </div>

      {/* Main Container - 防跑版：w-full, max-w-full, overflow-x-hidden */}
      <div className="p-2.5 sm:p-5 max-w-5xl mx-auto w-full space-y-3 box-border">

        {/* =========================================================================
            2. 拜訪主旨與拜訪客戶放一起 (手機友善垂直排版防擠壓)
           ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-2.5 w-full box-border">
          <div className="space-y-1.5 relative w-full">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Edit3 size={13} className="text-blue-600 shrink-0" />
                <span>拜訪主旨 / 拜訪客戶</span>
              </label>

              {/* Status Indicator */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedCustomer ? (
                  <span className="text-[10px] sm:text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 truncate max-w-[200px]">
                    ✓ {selectedCustomer.name} [{selectedCustomer.code}]
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-200">
                    未配對客戶（其他欄）
                  </span>
                )}

                {selectedCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearCustomer();
                      setSubjectInputValue('內部作業/其他事項');
                      triggerToast('已清除客戶，切換為其他欄！');
                    }}
                    className="text-[10px] sm:text-[11px] font-bold text-slate-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer bg-slate-100 px-1.5 py-0.5 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                    title="切換回其他欄"
                  >
                    <X size={10} />
                    <span>清除</span>
                  </button>
                )}
              </div>
            </div>

            {/* Input + Dropdown selector: 手機版全寬不橫擠 */}
            <div className="relative w-full">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 w-full">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    value={subjectInputValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSubjectInputValue(val);
                      
                      const clean = val.replace(/^拜訪\s*/, '').replace(/\[.*?\]/, '').trim().toLowerCase();
                      if (clean) {
                        const matched = customers.find(c => 
                          c.name.toLowerCase() === clean || 
                          c.code.toLowerCase() === clean
                        );
                        if (matched) {
                          onSelectCustomerId(matched.id);
                        } else if (selectedCustomerId) {
                          onClearCustomer();
                        }
                      } else {
                        onClearCustomer();
                      }
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    placeholder="輸入拜訪主旨或搜尋客戶（輸入客戶即為客戶，未找到為其他）..."
                    className={`w-full pl-3 pr-8 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all focus:outline-none focus:ring-2 box-border ${
                      selectedCustomer 
                        ? 'bg-blue-50/70 border-2 border-blue-400 text-blue-950 focus:ring-blue-500' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 focus:ring-amber-500 focus:bg-white'
                    }`}
                  />
                  {subjectInputValue && (
                    <button
                      type="button"
                      onClick={() => {
                        setSubjectInputValue('');
                        onClearCustomer();
                      }}
                      className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Dropdown Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                  className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all shrink-0 cursor-pointer ${
                    isCustomerDropdownOpen
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Search size={14} />
                  <span>挑選客戶選單</span>
                  {isCustomerDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Dynamic Customer Match Warning or Confirmation */}
              {matchedCustomerFromInput && matchedCustomerFromInput.id !== selectedCustomerId && (
                <div className="mt-1.5 p-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150">
                  <span className="text-blue-900 font-medium">
                    找到符合客戶：<strong>{matchedCustomerFromInput.name}</strong> [{matchedCustomerFromInput.code}]
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCustomerId(matchedCustomerFromInput.id);
                      setSubjectInputValue(`拜訪 ${matchedCustomerFromInput.name} [${matchedCustomerFromInput.code}]`);
                      triggerToast(`已自動鎖定「${matchedCustomerFromInput.name}」，展開四宮格與代辦！`);
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shrink-0"
                  >
                    確認鎖定此客戶
                  </button>
                </div>
              )}

              {/* Dropdown Menu Modal/Overlay */}
              {isCustomerDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2.5 space-y-2 max-h-72 overflow-y-auto animate-in fade-in duration-100">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 px-1">
                    <span className="text-[11px] font-extrabold text-slate-500">
                      點選客戶立即套用（共 {filteredCustomerList.length} 位客戶）
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCustomerDropdownOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Quick Select Today's Scheduled Customers */}
                  {todayScheduledCustomers.length > 0 && (
                    <div className="space-y-1 bg-amber-50/70 p-2 rounded-xl border border-amber-200/60">
                      <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                        <Calendar size={11} />
                        <span>本日 ({selectedDate.slice(5)}) 排程客戶：</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {todayScheduledCustomers.map(cust => (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => {
                              onSelectCustomerId(cust.id);
                              setSubjectInputValue(`拜訪 ${cust.name} [${cust.code}]`);
                              setIsCustomerDropdownOpen(false);
                              triggerToast(`已選擇「${cust.name}」！`);
                            }}
                            className="text-xs font-bold px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                          >
                            {cust.name} [{cust.code}]
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customer items */}
                  <div className="space-y-1">
                    {filteredCustomerList.slice(0, 30).map(cust => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => {
                          onSelectCustomerId(cust.id);
                          setSubjectInputValue(`拜訪 ${cust.name} [${cust.code}]`);
                          setIsCustomerDropdownOpen(false);
                          triggerToast(`已選擇客戶「${cust.name}」，展開四宮格與代辦！`);
                        }}
                        className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          selectedCustomerId === cust.id 
                            ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200' 
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] text-slate-400 shrink-0">{cust.code}</span>
                          <span className="font-bold text-slate-800 truncate">{cust.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 shrink-0">{cust.tier}級</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{cust.region}</span>
                      </button>
                    ))}
                    {filteredCustomerList.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400">
                        查無相符客戶，將作為其他欄/內部作業事項處理
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Customer Detail info bar if selected */}
            {selectedCustomer && (
              <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                <span className="font-bold text-slate-700">{selectedCustomer.tier}級客戶</span>
                <span className="text-slate-300">·</span>
                <span>{selectedCustomer.region}</span>
                {selectedCustomer.address && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="truncate max-w-[200px]">{selectedCustomer.address}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            3. CONDITION A: 沒有找到客戶 -> 「就是其他」
           ========================================================================= */}
        {!selectedCustomer && (
          <div className="space-y-3 animate-in fade-in duration-200 w-full">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-0.5">
                <p className="font-bold text-xs">
                  目前模式：其他欄（未找到客戶 / 內部作業）
                </p>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  目前未配對到任何客戶，自動歸為<strong>「其他欄」</strong>。專屬代辦事項與4宮格已自動隱藏。若欲填報客戶成果，請於上方輸入客戶名稱或由選單挑選。
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden w-full">
              <div className="bg-amber-600 text-white px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText size={15} />
                  <h3 className="font-bold text-xs sm:text-sm tracking-wide truncate">
                    工作日誌 — 其他欄 / 內部作業
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleSimulatePhotoUpload('general')}
                  className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Camera size={12} />
                  <span>拍照存證</span>
                </button>
              </div>

              <div className="p-3.5 sm:p-4 space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    工作類別
                  </label>
                  <div className="relative">
                    <select
                      value={generalCategory}
                      onChange={(e) => setGeneralCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="內部作業/其他">內部作業/其他</option>
                      <option value="總部例行會議">總部例行會議</option>
                      <option value="業務教育訓練">業務教育訓練</option>
                      <option value="單據帳務結算">單據帳務結算</option>
                      <option value="門市行政庶務">門市行政庶務</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    日誌內容與成效說明
                  </label>
                  <textarea
                    rows={4}
                    value={generalResultText}
                    onChange={(e) => setGeneralResultText(e.target.value)}
                    placeholder="請在此輸入今日內部作業內容、跨部門協調事項或主管交辦項目..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none box-border"
                  />
                </div>

                {generalPhotos.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <label className="block text-xs font-bold text-slate-700">
                      附加照片 ({generalPhotos.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {generalPhotos.map((p, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 group">
                          <img src={p} alt="日誌存證" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setGeneralPhotos(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 px-3.5 py-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 truncate">
                  歸檔於 {selectedDate} 工作日誌
                </span>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Check size={13} strokeWidth={2.5} />
                  <span>儲存其他日誌</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            4. CONDITION B: 輸入/找到客戶 -> 「就是客戶」
               (依要求：手機板的拜訪不用全部檢視，只分四宮格與代辦事項)
           ========================================================================= */}
        {selectedCustomer && (
          <div className="space-y-3 animate-in fade-in duration-200 w-full">

            {/* Sub-Tabs: 依要求嚴格只分四宮格與代辦事項，不包含全部檢視 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs gap-2 w-full">
              <div className="grid grid-cols-2 gap-1.5 w-full sm:w-72">
                <button
                  type="button"
                  onClick={() => setActiveCustomerTab('behaviors')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeCustomerTab === 'behaviors'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 bg-slate-50'
                  }`}
                >
                  <Layers size={14} />
                  <span>四宮格 (預設)</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeCustomerTab === 'behaviors' ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedCategories.length}/4
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCustomerTab('tasks')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeCustomerTab === 'tasks'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 bg-slate-50'
                  }`}
                >
                  <Building2 size={14} />
                  <span>代辦事項</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeCustomerTab === 'tasks' ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {customerTasks.length}
                  </span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-semibold pr-2">
                <span>目前拜訪：</span>
                <span className="text-blue-700 font-bold truncate">{selectedCustomer.name} [{selectedCustomer.code}]</span>
              </div>
            </div>

            {/* ---------------------------------------------------------------------
                TAB 1: 行為 4 宮格 (四宮格(預設))
               --------------------------------------------------------------------- */}
            {activeCustomerTab === 'behaviors' && (
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 bg-pink-100 text-pink-700 rounded-md">
                      <LayoutGrid size={14} />
                    </span>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800">
                      業務行為 4 宮格（{selectedCustomer.name}）
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    點擊啟用各宮格，填寫執行成效
                  </span>
                </div>

                {/* 2x2 Grid / Mobile 1 Column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  {quadrantConfig.map((quadrant) => {
                    const isChecked = selectedCategories.includes(quadrant.id);
                    const currentResult = categoryResults[quadrant.id] || '';
                    const currentPhotos = categoryPhotos[quadrant.id] || [];

                    return (
                      <div
                        key={quadrant.id}
                        className={`rounded-2xl border-2 transition-all overflow-hidden flex flex-col bg-white shadow-2xs w-full box-border ${
                          isChecked 
                            ? `${quadrant.borderAccent} ring-1 ring-blue-500/10` 
                            : 'border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        {/* Header of Quadrant */}
                        <div className={`p-3 flex items-center justify-between border-b ${
                          isChecked ? quadrant.bgAccent : 'bg-slate-50/70 border-slate-100'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              id={`quad-${quadrant.id}`}
                              checked={isChecked}
                              onChange={() => toggleCategory(quadrant.id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer shrink-0"
                            />
                            <div className="min-w-0">
                              <label
                                htmlFor={`quad-${quadrant.id}`}
                                className="font-extrabold text-xs sm:text-sm text-slate-900 cursor-pointer flex items-center gap-1 truncate"
                              >
                                {quadrant.icon}
                                <span>{quadrant.title}</span>
                              </label>
                              <p className="text-[10px] text-slate-500 truncate">
                                {quadrant.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {isChecked && (
                              <button
                                type="button"
                                onClick={() => handleSimulatePhotoUpload(quadrant.id)}
                                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Camera size={11} />
                                <span className="hidden xs:inline">拍照</span>
                              </button>
                            )}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              isChecked ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {isChecked ? '已啟用' : '未勾選'}
                            </span>
                          </div>
                        </div>

                        {/* Body of Quadrant */}
                        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                          <div className="space-y-1.5 flex-1">
                            <label className="text-[11px] font-bold text-slate-600 block">
                              拜訪成效與溝通紀錄：
                            </label>
                            <textarea
                              rows={3}
                              disabled={!isChecked}
                              value={currentResult}
                              onChange={(e) => updateCategoryResult(quadrant.id, e.target.value)}
                              placeholder={isChecked ? quadrant.placeholder : '請先勾選上方啟用此象限...'}
                              className={`w-full p-2.5 rounded-xl text-xs leading-relaxed resize-none transition-all box-border ${
                                isChecked
                                  ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white'
                                  : 'bg-slate-100/70 border border-slate-200/50 text-slate-400 cursor-not-allowed'
                              }`}
                            />
                          </div>

                          {/* Photos Thumbnail Bar */}
                          {isChecked && currentPhotos.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400">存證：</span>
                              {currentPhotos.map((p, idx) => (
                                <div key={idx} className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-200 group">
                                  <img src={p} alt="存證" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setCategoryPhotos(prev => ({
                                      ...prev,
                                      [quadrant.id]: prev[quadrant.id].filter((_, i) => i !== idx)
                                    }))}
                                    className="absolute top-0 right-0 bg-black/60 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100"
                                  >
                                    <X size={8} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------------
                TAB 2: 代辦事項 (手機進度用直立的，且預設收合)
               --------------------------------------------------------------------- */}
            {activeCustomerTab === 'tasks' && (
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 bg-blue-100 text-blue-700 rounded-md">
                      <Building2 size={14} />
                    </span>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800">
                      「{selectedCustomer.name}」專屬代辦 ({customerTasks.length} 項)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    完成即壓今日 ({selectedDate.slice(5)})
                  </span>
                </div>

                {customerTasks.map(({ task, assignment, compositeId }) => {
                  const isCompleted = assignment.status === 'completed';
                  const isNotExecuted = assignment.status === 'not_executed';

                  // Stages sequence
                  const stagesList: string[] = assignment.stages || task.stages || ['第一階段', '第二階段', '第三階段'];
                  const fullStages: string[] = ['待執行', ...stagesList, '完成'];
                  
                  const currentStageLabel = isCompleted 
                    ? '完成' 
                    : isNotExecuted 
                      ? '未執行' 
                      : (assignment.currentStage || '待執行');

                  // 依要求：手機板的進度用直立的 且預設收合
                  const isProgressOpen = !!expandedProgressMap[compositeId];

                  return (
                    <div 
                      key={compositeId}
                      className={`bg-white rounded-2xl border transition-all shadow-2xs overflow-hidden w-full box-border ${
                        isCompleted ? 'border-emerald-200' : isNotExecuted ? 'border-rose-200' : 'border-slate-200'
                      }`}
                    >
                      {/* Top Header of Task */}
                      <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                              {task.category}
                            </span>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {task.title}
                            </h4>
                            {task.requirePhoto && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 flex items-center gap-0.5 shrink-0">
                                <Camera size={9} />
                                <span>需拍照</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>活動期間：{task.startDate} ~ {task.endDate}</span>
                          </div>
                        </div>

                        {/* Status / Stage Badge */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCompleted ? (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>已完成 (壓 {assignment.completedDate || selectedDate})</span>
                            </div>
                          ) : isNotExecuted ? (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-bold text-xs">
                              <XCircle size={12} className="text-rose-600" />
                              <span>未執行</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                              <span>階段：{currentStageLabel}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Execution Details & Action Buttons */}
                      <div className="p-3 sm:p-4 bg-slate-50/60 space-y-2.5">

                        {/* =========================================================================
                            PROGRESS STEPPER: 依要求手機板進度用直立的，且預設收合！
                           ========================================================================= */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                          {/* Collapsed Header / Toggle Bar (預設收合狀態) */}
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedProgressMap(prev => ({
                                ...prev,
                                [compositeId]: !prev[compositeId]
                              }));
                            }}
                            className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100/90 active:bg-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="p-1 rounded-md bg-indigo-100 text-indigo-700 shrink-0">
                                <Sparkles size={13} />
                              </span>
                              <span className="text-xs font-extrabold text-slate-800 shrink-0">
                                活動推進階段：
                              </span>
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] truncate ${
                                isCompleted 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                  : isNotExecuted 
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              }`}>
                                {currentStageLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 shrink-0">
                              <span>{isProgressOpen ? '收合' : '展開階段跳躍'}</span>
                              {isProgressOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                          </button>

                          {/* Expanded Vertical Stage Stepper (直立的進度清單，支援跳躍、階段原因與自訂) */}
                          {isProgressOpen && (
                            <div className="p-3 border-t border-slate-100 bg-white space-y-2.5 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                                <span className="font-bold text-slate-600 text-[11px]">
                                  點選任意階段即可直接跳躍，並可為各階段填寫原因：
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingStageTaskId(addingStageTaskId === compositeId ? null : compositeId);
                                    setNewStageNameInput('');
                                  }}
                                  className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  <Plus size={11} />
                                  <span>+ 新增階段</span>
                                </button>
                              </div>

                              {/* Vertical Stage List (直立排版 + 每一階段填寫原因) */}
                              <div className="space-y-2">
                                {fullStages.map((stg, stgIdx) => {
                                  const isCurrent = currentStageLabel === stg;
                                  const isFinalComplete = stg === '完成';
                                  const isPendingStage = stg === '待執行';
                                  const hasStageReason = !!assignment.stageReasons?.[stg];

                                  return (
                                    <div key={stg} className="space-y-1">
                                      {/* Stage Jump Button */}
                                      <div className="relative flex items-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isFinalComplete) {
                                              // 點選完成時，開啟完成結案選填原因彈窗
                                              setCompletionModal({
                                                compositeId,
                                                taskTitle: task.title,
                                                customerName: selectedCustomer.name,
                                                currentNotes: assignment.executionNotes,
                                                existingReason: assignment.completionReason
                                              });
                                              setCompletionReasonChoice(
                                                completionPresets.includes(assignment.completionReason || '')
                                                  ? (assignment.completionReason || '合約提報核准簽署')
                                                  : '合約提報核准簽署'
                                              );
                                              setCustomCompletionReason(
                                                completionPresets.includes(assignment.completionReason || '')
                                                  ? ''
                                                  : (assignment.completionReason || '')
                                              );
                                            } else {
                                              if (onUpdateTaskStage) {
                                                onUpdateTaskStage(
                                                  compositeId, 
                                                  stg, 
                                                  assignment.executionNotes, 
                                                  selectedDate
                                                );
                                              } else {
                                                onUpdateTaskStatus(
                                                  compositeId,
                                                  'pending',
                                                  undefined,
                                                  assignment.executionNotes,
                                                  selectedDate
                                                );
                                              }
                                              triggerToast(`🚀 已跳躍至【${stg}】！`);
                                            }
                                          }}
                                          className={`w-full p-2 sm:p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 border cursor-pointer min-h-[40px] ${
                                            isCurrent
                                              ? isFinalComplete
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs ring-2 ring-emerald-300'
                                                : isPendingStage
                                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs ring-2 ring-amber-300'
                                                  : 'bg-indigo-600 text-white border-indigo-600 shadow-2xs ring-2 ring-indigo-300'
                                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-extrabold shrink-0 ${
                                              isCurrent ? 'bg-white text-slate-900 shadow-2xs' : 'bg-slate-200 text-slate-600'
                                            }`}>
                                              {stgIdx + 1}
                                            </span>
                                            <span className="truncate">{stg}</span>
                                          </div>

                                          <div className="flex items-center gap-1 shrink-0">
                                            {isCurrent ? (
                                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white/20 text-white flex items-center gap-0.5">
                                                <Check size={11} strokeWidth={3} />
                                                <span>目前階段</span>
                                              </span>
                                            ) : (
                                              <span className="text-[10px] text-slate-400 font-normal">
                                                點擊跳躍 →
                                              </span>
                                            )}
                                          </div>
                                        </button>
                                      </div>

                                      {/* 每一階段都能填寫階段原因 */}
                                      {!isFinalComplete && (
                                        <div className="pl-7">
                                          {hasStageReason ? (
                                            <div className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1 text-slate-700">
                                              <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="font-bold text-indigo-700 shrink-0">原因/進度：</span>
                                                <span className="truncate">{assignment.stageReasons?.[stg]}</span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingStageReason({ compositeId, stage: stg });
                                                  setStageReasonInputText(assignment.stageReasons?.[stg] || '');
                                                }}
                                                className="text-[10px] text-indigo-600 font-bold hover:underline shrink-0 ml-1.5 flex items-center gap-0.5 cursor-pointer"
                                              >
                                                <Edit3 size={10} />
                                                <span>修改</span>
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingStageReason({ compositeId, stage: stg });
                                                setStageReasonInputText('');
                                              }}
                                              className="text-[10px] font-medium text-slate-400 hover:text-indigo-600 flex items-center gap-1 py-0.5 px-1 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
                                            >
                                              <Edit3 size={10} />
                                              <span>+ 填寫【{stg}】原因或進度</span>
                                            </button>
                                          )}

                                          {/* Inline Stage Reason Editor */}
                                          {editingStageReason?.compositeId === compositeId && editingStageReason?.stage === stg && (
                                            <div className="mt-1.5 p-2.5 bg-indigo-50/90 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                                              <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900">
                                                <span>填寫【{stg}】階段原因：</span>
                                                <button
                                                  type="button"
                                                  onClick={() => setEditingStageReason(null)}
                                                  className="text-slate-400 hover:text-slate-600"
                                                >
                                                  <X size={13} />
                                                </button>
                                              </div>

                                              <div className="flex items-center gap-1.5">
                                                <input
                                                  type="text"
                                                  value={stageReasonInputText}
                                                  onChange={(e) => setStageReasonInputText(e.target.value)}
                                                  placeholder={`輸入【${stg}】原因或狀況說明...`}
                                                  className="flex-1 px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                  autoFocus
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      handleSaveStageReason(compositeId, stg, stageReasonInputText);
                                                    }
                                                  }}
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => handleSaveStageReason(compositeId, stg, stageReasonInputText)}
                                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-2xs shrink-0 cursor-pointer"
                                                >
                                                  儲存
                                                </button>
                                              </div>

                                              {/* Quick Preset Buttons */}
                                              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                                <span className="text-[10px] text-indigo-700 font-bold">快速選項：</span>
                                                {getStageReasonPresets(stg).map(preset => (
                                                  <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => setStageReasonInputText(preset)}
                                                    className="text-[10px] font-semibold px-1.5 py-0.5 bg-white text-indigo-800 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors cursor-pointer"
                                                  >
                                                    + {preset}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* 完成階段顯示完成原因 */}
                                      {isFinalComplete && assignment.completionReason && (
                                        <div className="pl-7">
                                          <div className="flex items-center justify-between text-[11px] bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 text-emerald-900">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                                              <span className="font-bold shrink-0">完成原因：</span>
                                              <span className="truncate">{assignment.completionReason}</span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setCompletionModal({
                                                  compositeId,
                                                  taskTitle: task.title,
                                                  customerName: selectedCustomer.name,
                                                  currentNotes: assignment.executionNotes,
                                                  existingReason: assignment.completionReason
                                                });
                                                setCompletionReasonChoice(
                                                  completionPresets.includes(assignment.completionReason || '')
                                                    ? (assignment.completionReason || '合約提報核准簽署')
                                                    : '其他自填'
                                                );
                                                setCustomCompletionReason(
                                                  completionPresets.includes(assignment.completionReason || '')
                                                    ? ''
                                                    : (assignment.completionReason || '')
                                                );
                                              }}
                                              className="text-[10px] text-emerald-700 font-bold hover:underline shrink-0 ml-1.5 flex items-center gap-0.5 cursor-pointer"
                                            >
                                              <Edit3 size={10} />
                                              <span>修改</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Inline Add Custom Stage Form */}
                              {addingStageTaskId === compositeId && (
                                <div className="p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in zoom-in-95 duration-100">
                                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                                    <span>新增自訂階段名稱：</span>
                                    <button
                                      type="button"
                                      onClick={() => setAddingStageTaskId(null)}
                                      className="text-slate-400 hover:text-slate-600"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={newStageNameInput}
                                      onChange={(e) => setNewStageNameInput(e.target.value)}
                                      placeholder="例如：第四階段、樣品確認..."
                                      className="flex-1 px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newStageNameInput.trim()) {
                                          if (onAddCustomStage) {
                                            onAddCustomStage(compositeId, newStageNameInput.trim());
                                          }
                                          setAddingStageTaskId(null);
                                          setNewStageNameInput('');
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (newStageNameInput.trim()) {
                                          if (onAddCustomStage) {
                                            onAddCustomStage(compositeId, newStageNameInput.trim());
                                          }
                                          setAddingStageTaskId(null);
                                          setNewStageNameInput('');
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                                    >
                                      新增
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                    <span className="text-[10px] text-indigo-600 font-bold">快速選項：</span>
                                    {['第四階段', '樣品確認', '店長覆核', '合約用印'].map(preset => (
                                      <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setNewStageNameInput(preset)}
                                        className="text-[10px] font-bold px-1.5 py-0.5 bg-white text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors cursor-pointer"
                                      >
                                        + {preset}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Quick Collapse Footer */}
                              <div className="pt-1 flex justify-center border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => setExpandedProgressMap(prev => ({ ...prev, [compositeId]: false }))}
                                  className="text-[11px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 p-1"
                                >
                                  <span>收合階段清單</span>
                                  <ChevronUp size={13} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 完成原因 (選填) 展示與修改區 */}
                        {isCompleted && (
                          <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-emerald-950">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                              <span className="font-bold shrink-0">完成原因：</span>
                              <span className="truncate">{assignment.completionReason || '（未選填原因，直接完成）'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCompletionModal({
                                  compositeId,
                                  taskTitle: task.title,
                                  customerName: selectedCustomer.name,
                                  currentNotes: assignment.executionNotes,
                                  existingReason: assignment.completionReason
                                });
                                setCompletionReasonChoice(
                                  completionPresets.includes(assignment.completionReason || '') 
                                    ? (assignment.completionReason || '合約提報核准簽署') 
                                    : '其他自填'
                                );
                                setCustomCompletionReason(
                                  completionPresets.includes(assignment.completionReason || '') 
                                    ? '' 
                                    : (assignment.completionReason || '')
                                );
                              }}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline shrink-0 flex items-center gap-0.5 ml-2 cursor-pointer"
                            >
                              <Edit3 size={11} />
                              <span>{assignment.completionReason ? '修改原因' : '+ 填寫完成原因'}</span>
                            </button>
                          </div>
                        )}

                        {/* Execution Notes Input */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">
                            執行結果 / 現場反饋備註：
                          </label>
                          <input
                            type="text"
                            value={assignment.executionNotes || ''}
                            onChange={(e) => {
                              onUpdateTaskStatus(
                                compositeId, 
                                assignment.status, 
                                assignment.unexecutedReason, 
                                e.target.value, 
                                selectedDate
                              );
                            }}
                            placeholder="輸入執行成果備註（例如：端架排面陳列完畢、店長反饋良好...）"
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                          />
                        </div>

                        {/* Action Buttons: 拍照 | 壓今天完成 | 未執行 */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => {
                              handleSimulatePhotoUpload(task.category);
                              if (onAddPhotoToTask) {
                                onAddPhotoToTask(task.id, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80');
                              }
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Camera size={12} />
                            <span>拍照存證</span>
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* 壓今天完成按鈕 (點選開啟完成原因選填彈窗) */}
                            <button
                              type="button"
                              onClick={() => {
                                setCompletionModal({
                                  compositeId,
                                  taskTitle: task.title,
                                  customerName: selectedCustomer.name,
                                  currentNotes: assignment.executionNotes,
                                  existingReason: assignment.completionReason
                                });
                                setCompletionReasonChoice(
                                  completionPresets.includes(assignment.completionReason || '') 
                                    ? (assignment.completionReason || '合約提報核准簽署') 
                                    : '合約提報核准簽署'
                                );
                                setCustomCompletionReason(
                                  completionPresets.includes(assignment.completionReason || '') 
                                    ? '' 
                                    : (assignment.completionReason || '')
                                );
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center gap-1 cursor-pointer ${
                                isCompleted
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <CheckCircle2 size={13} strokeWidth={2.5} />
                              <span>{isCompleted ? '已壓今日完成 (點擊修改原因)' : '壓今天完成'}</span>
                            </button>

                            {/* 未執行按鈕 */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isNotExecuted) {
                                  onUpdateTaskStatus(compositeId, 'pending', undefined, undefined, selectedDate);
                                  triggerToast('已重設為待執行！');
                                } else {
                                  setUnexecutedModalTaskId(compositeId);
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors border cursor-pointer ${
                                isNotExecuted
                                  ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                                  : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              <span>{isNotExecuted ? '重設' : '未執行'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {customerTasks.length === 0 && (
                  <div className="py-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-1">
                    <p className="font-bold text-slate-600">
                      「{selectedCustomer.name}」目前無專案代辦事項
                    </p>
                    <p className="text-[11px] text-slate-400">
                      您可在「四宮格」直接填寫各分類之拜訪成效！
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Save Action Bar */}
            <div className="sticky bottom-0 sm:bottom-2 z-20 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-none sm:rounded-2xl shadow-xl flex items-center justify-between gap-2 border-t sm:border border-slate-700 w-full box-border">
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs truncate">
                  {selectedCustomer.name} [{selectedCustomer.code}]
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {selectedCategories.length} 個行為宮格已填報 · {customerTasks.filter(t => t.assignment.status === 'completed').length} 項代辦完成
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={onBackToCalendar}
                  className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  返回
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Check size={13} strokeWidth={2.5} />
                  <span>儲存拜訪</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: 完成原因選填 (依要求：完成也可以選填原因，可選擇或其他自填)
         ========================================================================= */}
      {completionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-4 sm:p-5 w-full max-w-md border border-slate-200 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto box-border">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <CheckCircle2 size={16} />
                </span>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                    完成結案確認（壓今日完成）
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {completionModal.customerName} · {completionModal.taskTitle}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setCompletionModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                完成原因 <span className="text-slate-400 font-normal">（選填，可點選或自填）</span>：
              </label>

              {/* Preset Reason Options (可選擇) */}
              <div className="space-y-1.5">
                {completionPresets.map(reason => {
                  const isSelected = completionReasonChoice === reason && !customCompletionReason.trim();
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => {
                        setCompletionReasonChoice(reason);
                        setCustomCompletionReason('');
                      }}
                      className={`w-full text-left p-2 sm:p-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-50 text-emerald-950 border-emerald-300 ring-1 ring-emerald-300' 
                          : 'hover:bg-slate-50 text-slate-700 border-slate-200/80 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span>{reason}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* 其他自填 (自填輸入框) */}
              <div className="pt-1.5 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <span>或其他自填原因：</span>
                  <span className="text-[10px] text-slate-400">（直接輸入即可切換為自填）</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customCompletionReason}
                    onChange={(e) => {
                      setCustomCompletionReason(e.target.value);
                      if (e.target.value.trim()) {
                        setCompletionReasonChoice('其他自填');
                      }
                    }}
                    placeholder="例如：特約加盟專案配合、跨區調店專案結案..."
                    className={`w-full px-3 py-2 rounded-xl text-xs text-slate-900 border focus:outline-none focus:ring-2 box-border ${
                      customCompletionReason.trim()
                        ? 'border-emerald-400 bg-emerald-50/30 focus:ring-emerald-500'
                        : 'border-slate-200 bg-slate-50 focus:ring-blue-500 focus:bg-white'
                    }`}
                  />
                  {customCompletionReason && (
                    <button
                      type="button"
                      onClick={() => setCustomCompletionReason('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Action Buttons: 直接跳過 | 確認完成 */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCompletionModal(null)}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer text-center"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateTaskStage) {
                    onUpdateTaskStage(
                      completionModal.compositeId,
                      '完成',
                      completionModal.currentNotes || '業務現場回報完成',
                      selectedDate,
                      undefined,
                      ''
                    );
                  } else {
                    onUpdateTaskStatus(
                      completionModal.compositeId,
                      'completed',
                      undefined,
                      completionModal.currentNotes || '業務現場回報完成',
                      selectedDate
                    );
                  }
                  triggerToast(`✅ 已將「${completionModal.customerName}」壓今日完成（未填原因）！`);
                  setCompletionModal(null);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer text-center"
              >
                直接跳過 (無須填寫)
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalReason = customCompletionReason.trim() || (completionReasonChoice !== '其他自填' ? completionReasonChoice : '');
                  if (onUpdateTaskStage) {
                    onUpdateTaskStage(
                      completionModal.compositeId,
                      '完成',
                      completionModal.currentNotes || '業務現場回報完成',
                      selectedDate,
                      undefined,
                      finalReason
                    );
                  } else {
                    onUpdateTaskStatus(
                      completionModal.compositeId,
                      'completed',
                      undefined,
                      completionModal.currentNotes || '業務現場回報完成',
                      selectedDate
                    );
                  }
                  triggerToast(`✅ 已完成「${completionModal.customerName}」！原因：${finalReason || '無'}`);
                  setCompletionModal(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <Check size={14} strokeWidth={2.5} />
                <span>確認完成帶入原因</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Unexecuted reason selector */}
      {unexecutedModalTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-4 w-full max-w-sm border border-slate-200 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                <XCircle size={15} className="text-rose-600" />
                <span>標記為未執行結案</span>
              </h4>
              <button 
                type="button"
                onClick={() => setUnexecutedModalTaskId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">請選擇未執行原因：</label>
              {[
                '店長不在 / 改期拜訪',
                '庫存飽滿 / 本期暫不補貨',
                '店家空間不足無陳列位',
                '門市裝修整頓中',
                '客戶拒絕提報配合'
              ].map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setUnexecutedReasonText(reason)}
                  className={`w-full text-left p-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                    unexecutedReasonText === reason 
                      ? 'bg-rose-50 text-rose-900 border border-rose-200' 
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <span>{reason}</span>
                  {unexecutedReasonText === reason && <Check size={14} className="text-rose-600" />}
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUnexecutedModalTaskId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateTaskStatus(
                    unexecutedModalTaskId, 
                    'not_executed', 
                    unexecutedReasonText, 
                    undefined, 
                    selectedDate
                  );
                  triggerToast(`已標記為未執行：${unexecutedReasonText}`);
                  setUnexecutedModalTaskId(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs"
              >
                確認結案
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
