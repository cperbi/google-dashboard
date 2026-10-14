import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Calendar, 
  Plus, 
  Check, 
  X, 
  MapPin, 
  Phone, 
  Tag, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Building2,
  UserCheck
} from 'lucide-react';
import { Customer, PotentialCustomer, ActivityTask, TaskCustomerAssignment } from '../types';
import { calculateTaskBookingRate } from '../utils/booking';

interface SidebarProps {
  customers: Customer[];
  potentialCustomers: PotentialCustomer[];
  tasks: ActivityTask[];
  currentDate: string;
  onSelectDate: (date: string) => void;
  onScheduleTask?: (taskId: string, date: string, customerId?: string) => void;
  onUpdateStatus?: (taskId: string, status: 'completed' | 'not_executed' | 'pending', reason?: string, notes?: string, reportDate?: string) => void;
  onSelectCustomerForVisit: (customerName: string, customerCode?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  customers,
  potentialCustomers,
  tasks,
  currentDate,
  onSelectDate,
  onScheduleTask,
  onUpdateStatus,
  onSelectCustomerForVisit
}) => {
  // Top filter states
  const [selectedRegion, setSelectedRegion] = useState<string>('全部區域');
  const [selectedSort, setSelectedSort] = useState<string>('加權');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Tab state: 'customer' (客戶) | 'potential' (潛客) | 'todo' (待辦事項)
  // 依使用者需求，預設進入 'todo' (待辦事項) 檢視
  const [activeTab, setActiveTab] = useState<'customer' | 'potential' | 'todo'>('todo');

  // Todo sub-filter: 'all' (全部) | 'incomplete' (未完成) | 'completed' (已完成) | 'booked' (已Booking)
  const [todoFilter, setTodoFilter] = useState<'all' | 'incomplete' | 'completed' | 'booked'>('all');

  // Expanded items state
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [expandedPotentialId, setExpandedPotentialId] = useState<string | null>(null);
  // 預設全部展開，讓使用者一眼看清該活動的項目、是否完成、日期在哪一天被完成
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<string[]>([]);

  // Regions list
  const regions = ['全部區域', '台北市', '新北市', '新竹市', '台中市', '台南市', '高雄市'];

  // Filtered customers
  const filteredCustomers = customers
    .filter(c => {
      const matchRegion = selectedRegion === '全部區域' || c.region === selectedRegion;
      const matchKeyword = !searchKeyword.trim() || 
        c.name.toLowerCase().includes(searchKeyword.toLowerCase()) || 
        c.code.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchRegion && matchKeyword;
    })
    .sort((a, b) => {
      if (selectedSort === '加權') return b.weight - a.weight;
      if (selectedSort === '業績高至低') return b.revenue - a.revenue;
      if (selectedSort === '額度高至低') return b.target - a.target;
      return 0;
    });

  // Filtered potential customers
  const filteredPotential = potentialCustomers.filter(p => {
    const matchRegion = selectedRegion === '全部區域' || p.region === selectedRegion;
    const matchKeyword = !searchKeyword.trim() || 
      p.name.toLowerCase().includes(searchKeyword.toLowerCase()) || 
      (p.code && p.code.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchRegion && matchKeyword;
  });

  // Pending (未完成) vs Completed (已完成) counts across activities and customer items
  const totalPendingItemsCount = tasks.reduce((sum, t) => {
    if (t.targetCustomers && t.targetCustomers.length > 0) {
      return sum + t.targetCustomers.filter(c => c.status !== 'completed').length;
    }
    return sum + (t.status !== 'completed' ? 1 : 0);
  }, 0);

  const totalCompletedItemsCount = tasks.reduce((sum, t) => {
    if (t.targetCustomers && t.targetCustomers.length > 0) {
      return sum + t.targetCustomers.filter(c => c.status === 'completed').length;
    }
    return sum + (t.status === 'completed' ? 1 : 0);
  }, 0);

  // Booking 率計算 (從今天往後到活動最終天 是否有同樣客戶ID的客戶在行事曆上)
  const totalTargetCustomersCount = tasks.reduce((sum, t) => {
    return sum + (t.targetCustomers?.length || (t.customerId ? 1 : 0));
  }, 0);

  const totalBookedCustomersCount = tasks.reduce((sum, t) => {
    return sum + calculateTaskBookingRate(t, currentDate, customers, tasks).bookedCount;
  }, 0);

  const overallBookingRate = totalTargetCustomersCount > 0
    ? Math.round((totalBookedCustomersCount / totalTargetCustomersCount) * 100)
    : 0;

  const filteredTasks = tasks.filter(t => {
    const matchKeyword = !searchKeyword.trim() || 
      t.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchKeyword.toLowerCase()))) ||
      (t.targetCustomers && t.targetCustomers.some(c => c.customerName.toLowerCase().includes(searchKeyword.toLowerCase())));
    
    if (!matchKeyword) return false;

    if (todoFilter === 'incomplete') {
      if (t.targetCustomers && t.targetCustomers.length > 0) {
        return t.targetCustomers.some(c => c.status !== 'completed');
      }
      return t.status !== 'completed';
    }
    if (todoFilter === 'completed') {
      if (t.targetCustomers && t.targetCustomers.length > 0) {
        return t.targetCustomers.some(c => c.status === 'completed');
      }
      return t.status === 'completed';
    }
    if (todoFilter === 'booked') {
      const bInfo = calculateTaskBookingRate(t, currentDate, customers, tasks);
      return bInfo.bookedCount > 0;
    }
    return true;
  });

  const getTierColor = (tier: Customer['tier']) => {
    switch (tier) {
      case 'S':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'A':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'B':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getCategoryBorderColor = (category: string) => {
    if (category === '陳列輔銷') return 'border-pink-500';
    if (category === '盤點退轉') return 'border-blue-600';
    if (category === '簽約提報') return 'border-amber-500';
    return 'border-emerald-500';
  };

  return (
    <aside className="w-full md:w-80 lg:w-[350px] shrink-0 bg-white border-r border-slate-200 flex flex-col h-full shadow-2xs select-none">
      {/* 1. Top Filters: 全部區域 | 加權 | 搜尋 (Exactly matches Screenshot 1, 2, 3, 4) */}
      <div className="p-3 border-b border-slate-100 space-y-2">
        <div className="grid grid-cols-12 gap-1.5">
          {/* Region Dropdown */}
          <div className="col-span-4 relative">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full h-8 pl-2 pr-5 text-xs font-semibold bg-white border border-slate-200 rounded-lg appearance-none text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="col-span-3 relative">
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full h-8 pl-2 pr-5 text-xs font-semibold bg-white border border-slate-200 rounded-lg appearance-none text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="加權">加權</option>
              <option value="業績高至低">業績</option>
              <option value="額度高至低">額度</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="col-span-5 relative">
            <input
              type="text"
              placeholder="搜尋"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full h-8 pl-2.5 pr-6 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
            {searchKeyword ? (
              <button 
                onClick={() => setSearchKeyword('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            ) : (
              <Search size={12} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none" />
            )}
          </div>
        </div>

        {/* 2. Three Tabs: 客戶(92) | 潛客(3) | 待辦事項(1) */}
        <div className="flex items-center gap-1.5 pt-1">
          {/* 客戶 */}
          <button
            onClick={() => setActiveTab('customer')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all ${
              activeTab === 'customer'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>客戶</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'customer' ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {customers.length}
            </span>
          </button>

          {/* 潛客 */}
          <button
            onClick={() => setActiveTab('potential')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all ${
              activeTab === 'potential'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>潛客</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'potential' ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {potentialCustomers.length}
            </span>
          </button>

          {/* 待辦事項 */}
          <button
            onClick={() => setActiveTab('todo')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all ${
              activeTab === 'todo'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>待辦事項</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'todo' ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {totalPendingItemsCount}
            </span>
          </button>
        </div>

        {/* 3. Filter for 待辦事項: 依使用者要求顯示「是否完成」（全部/未完成/已完成）與「Booking率」 */}
        {activeTab === 'todo' && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-500 text-[10px]">執行狀態：</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTodoFilter('all')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                    todoFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  全部 ({tasks.length})
                </button>
                <button
                  onClick={() => setTodoFilter('incomplete')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                    todoFilter === 'incomplete' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  未完成 ({totalPendingItemsCount})
                </button>
                <button
                  onClick={() => setTodoFilter('completed')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                    todoFilter === 'completed' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  已完成 ({totalCompletedItemsCount})
                </button>
              </div>
            </div>

            {/* Overall Booking Rate Bar */}
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-blue-50/80 border border-blue-200 rounded-lg text-[11px]">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                <Calendar size={13} className="text-blue-600 shrink-0" />
                <span>全期 Booking 率：</span>
                <span className="text-xs font-extrabold text-blue-700">{overallBookingRate}%</span>
                <span className="text-[10px] text-blue-600 font-normal">
                  ({totalBookedCustomersCount}/{totalTargetCustomersCount})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTodoFilter(todoFilter === 'booked' ? 'all' : 'booked')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  todoFilter === 'booked' 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
                title="篩選從今天到活動最終天有排入行事曆的活動"
              >
                {todoFilter === 'booked' ? '顯示全部' : '僅看已Booking'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. List Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
        {/* =========================================================================
            TAB 1: 客戶列表 (圖 1)
           ========================================================================= */}
        {activeTab === 'customer' && (
          filteredCustomers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              無符合條件的客戶
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isExpanded = expandedCustomerId === cust.id;
              return (
                <div 
                  key={cust.id}
                  className="rounded-xl border border-slate-100 hover:border-slate-200 bg-white transition-all overflow-hidden"
                >
                  <div 
                    onClick={() => setExpandedCustomerId(isExpanded ? null : cust.id)}
                    className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70"
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      {/* Tier Badge: S / A / B */}
                      <span className={`text-[10px] font-extrabold w-4 h-4 rounded flex items-center justify-center border shrink-0 mt-0.5 ${getTierColor(cust.tier)}`}>
                        {cust.tier}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {cust.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          [{cust.code}]
                        </div>
                      </div>
                    </div>

                    {/* Right side: 62萬 / 157萬 & Optional scheduled date 06/02 */}
                    <div className="flex items-center gap-2 text-right shrink-0">
                      <div>
                        <div className="text-xs font-bold text-slate-700">
                          {cust.revenue}萬 / {cust.target}萬
                        </div>
                        {cust.scheduledDate && (
                          <div className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1 rounded inline-block">
                            {cust.scheduledDate}
                          </div>
                        )}
                      </div>
                      <ChevronDown 
                        size={14} 
                        className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      />
                    </div>
                  </div>

                  {/* Expanded Customer Details & Actions */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{cust.address || `${cust.region} 門市據點`}</span>
                      </div>
                      {cust.phone && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Phone size={12} className="text-slate-400 shrink-0" />
                          <span>{cust.phone}</span>
                        </div>
                      )}
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectCustomerForVisit(cust.name, cust.code)}
                          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1"
                        >
                          <Building2 size={13} />
                          <span>排入當日拜訪</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )
        )}

        {/* =========================================================================
            TAB 2: 潛在客戶列表 (圖 2)
           ========================================================================= */}
        {activeTab === 'potential' && (
          filteredPotential.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              無符合條件的潛客
            </div>
          ) : (
            filteredPotential.map((pot) => {
              const isExpanded = expandedPotentialId === pot.id;
              return (
                <div 
                  key={pot.id}
                  className="rounded-xl border border-slate-100 hover:border-slate-200 bg-white transition-all overflow-hidden"
                >
                  <div 
                    onClick={() => setExpandedPotentialId(isExpanded ? null : pot.id)}
                    className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {pot.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {pot.code ? `[${pot.code}]` : '[]'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
                        {pot.status}
                      </span>
                      <ChevronDown 
                        size={14} 
                        className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      />
                    </div>
                  </div>

                  {/* Expanded Potential Details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{pot.address || `${pot.region} 門市`}</span>
                      </div>
                      {pot.phone && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Phone size={12} className="text-slate-400 shrink-0" />
                          <span>{pot.phone}</span>
                        </div>
                      )}
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectCustomerForVisit(pot.name, '潛客')}
                          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1"
                        >
                          <UserCheck size={13} />
                          <span>安排拜訪行程</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )
        )}

        {/* =========================================================================
            TAB 3: 待辦事項 (依要求：
            1. 在右邊側邊欄只能直接前往該天日誌，不能在側邊欄完成；
            2. 新增 Booking 率：從今天往後到活動最終天，是否有同樣客戶 ID 的客戶在行事曆上)
           ========================================================================= */}
        {activeTab === 'todo' && (
          filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              無符合條件的待辦事項
            </div>
          ) : (
            filteredTasks.map((t) => {
              const isExpanded = !collapsedTaskIds.includes(t.id);
              const targetCusts = t.targetCustomers || [];
              const hasCustomers = targetCusts.length > 0;
              const completedCustCount = targetCusts.filter(c => c.status === 'completed').length;
              const pendingCustCount = targetCusts.filter(c => c.status !== 'completed').length;
              const isAllCompleted = hasCustomers ? (pendingCustCount === 0) : (t.status === 'completed');

              // 計算活動的 Booking 率 (從今天往後到活動最終天 是否有同樣客戶ID在行事曆上)
              const bookingInfo = calculateTaskBookingRate(t, currentDate, customers, tasks);

              return (
                <div 
                  key={t.id}
                  className={`rounded-xl border bg-white shadow-2xs overflow-hidden transition-all ${
                    isAllCompleted ? 'border-emerald-200' : 'border-slate-200'
                  }`}
                >
                  {/* Task Card Header */}
                  <div 
                    onClick={() => {
                      setCollapsedTaskIds(prev => 
                        prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                      );
                    }}
                    className="flex items-stretch cursor-pointer hover:bg-slate-50/70"
                  >
                    {/* Left Color Bar */}
                    <div className={`w-2.5 ${getCategoryBorderColor(t.category).replace('border-', 'bg-')}`} />

                    <div className="p-2.5 flex items-center justify-between flex-1 gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {/* Title: grey if completed */}
                        <h4 className={`text-xs font-bold tracking-wide truncate ${
                          isAllCompleted ? 'text-slate-400' : 'text-slate-800'
                        }`}>
                          【{t.category}】{t.title}
                        </h4>

                        {/* Badges / Tags */}
                        <div className="flex items-center gap-1 shrink-0">
                          {t.tags?.slice(0, 1).map((tag, idx) => (
                            <span 
                              key={idx}
                              className="text-[9px] font-bold px-1.5 py-0.2 rounded-full border bg-slate-50 text-slate-600 border-slate-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Header Status & Booking Summary */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Booking 率 Badge */}
                        <span 
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border ${
                            bookingInfo.bookingRate >= 70
                              ? 'text-blue-800 bg-blue-50 border-blue-200'
                              : bookingInfo.bookingRate >= 30
                                ? 'text-indigo-800 bg-indigo-50 border-indigo-200'
                                : 'text-slate-700 bg-slate-100 border-slate-200'
                          }`}
                          title={`評估區間：今天 (${currentDate}) ~ 活動最終天 (${bookingInfo.endDate})\n行事曆有預約門市：${bookingInfo.bookedCount}/${bookingInfo.totalCount}`}
                        >
                          <Calendar size={10} className="text-blue-600" />
                          <span>Booking率 {bookingInfo.bookingRate}%</span>
                        </span>

                        {hasCustomers ? (
                          <div className="flex items-center gap-1">
                            {completedCustCount > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <CheckCircle2 size={10} />
                                <span>{completedCustCount}已完成</span>
                              </span>
                            )}
                            {pendingCustCount > 0 && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Clock size={10} />
                                <span>{pendingCustCount}未完成</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          t.status === 'completed' ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <CheckCircle2 size={10} />
                              <span>已完成</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Clock size={10} />
                              <span>未完成</span>
                            </span>
                          )
                        )}
                        <ChevronDown 
                          size={14} 
                          className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Task Controls & Target Customers */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-2 bg-slate-50/80 border-t border-slate-100 text-xs space-y-2.5">
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {t.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span>類別：<strong className="text-slate-700">{t.category}</strong></span>
                        {hasCustomers && (
                          <span className="text-blue-600 font-bold">
                            共 {targetCusts.length} 個項目門市
                          </span>
                        )}
                      </div>

                      {/* 依要求：新增 Booking 率區塊 (從今天往後到活動最終天 是否有同樣客戶ID在行事曆上) */}
                      <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <div className="flex items-center gap-1.5 text-blue-950">
                            <Calendar size={13} className="text-blue-600 shrink-0" />
                            <span>活動 Booking 率：<strong className="text-sm font-extrabold text-blue-700">{bookingInfo.bookingRate}%</strong></span>
                          </div>
                          <span className="text-[11px] text-blue-700 font-bold bg-white px-2 py-0.5 rounded-md border border-blue-200">
                            {bookingInfo.bookedCount} / {bookingInfo.totalCount} 家門市已在行事曆
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${bookingInfo.bookingRate}%` }}
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 pt-0.5 gap-1">
                          <span>活動最終天：<strong className="text-slate-700 font-mono font-bold">{bookingInfo.endDate}</strong></span>
                          <span>評估期間：{currentDate} ~ {bookingInfo.endDate}</span>
                        </div>
                      </div>

                      {/* 該活動的項目列表 (依要求：只能直接前往該天日誌，不能在側邊欄完成) */}
                      {hasCustomers ? (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                            <span>活動項目列表：</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              點擊直接前往該天日誌填報
                            </span>
                          </div>

                          <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                            {targetCusts.map((cust) => {
                              const isCustCompleted = cust.status === 'completed';
                              const isCustNotExecuted = cust.status === 'not_executed';
                              const completionDate = cust.completedDate || cust.reportedDate || cust.scheduledDate;
                              const custBooking = bookingInfo.customerBookingMap[cust.customerId] || { isBooked: false, bookedDates: [] };

                              // 前往該天日誌的目標日期：若已完成前往完成日期，若已預約前往預約日期，否則前往今天
                              const targetDateForLog = isCustCompleted 
                                ? (cust.completedDate || cust.reportedDate || currentDate)
                                : (custBooking.bookedDates[0] || cust.scheduledDate || currentDate);

                              const buttonLabel = isCustCompleted
                                ? `前往完成日誌 (${targetDateForLog.slice(5)})`
                                : custBooking.isBooked
                                  ? `前往預約日誌 (${targetDateForLog.slice(5)})`
                                  : `前往今日日誌 (${currentDate.slice(5)})`;

                              return (
                                <div
                                  key={cust.customerId}
                                  className={`p-2.5 rounded-xl border shadow-2xs space-y-2 transition-colors ${
                                    isCustCompleted 
                                      ? 'bg-emerald-50/40 border-emerald-200' 
                                      : isCustNotExecuted 
                                        ? 'bg-slate-50 border-slate-200'
                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {/* Item Header: 項目客戶名稱 & 是否完成 Badge */}
                                  <div className="flex items-center justify-between gap-1.5">
                                    <div className="min-w-0 flex-1">
                                      <div className={`text-xs font-bold truncate flex items-center gap-1 ${
                                        isCustCompleted 
                                          ? 'text-slate-500' 
                                          : isCustNotExecuted 
                                            ? 'line-through text-slate-400' 
                                            : 'text-slate-800'
                                      }`}>
                                        <span>{cust.customerName}</span>
                                        {cust.customerTier && (
                                          <span className="text-[9px] font-extrabold px-1 bg-slate-100 text-slate-500 rounded">
                                            {cust.customerTier}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        [{cust.customerCode}] {cust.customerRegion && `· ${cust.customerRegion}`}
                                      </div>
                                    </div>

                                    {/* 是否完成 (Status Badge) */}
                                    <div className="shrink-0">
                                      {isCustCompleted ? (
                                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                          <CheckCircle2 size={11} className="text-emerald-600" />
                                          <span>已完成</span>
                                        </span>
                                      ) : isCustNotExecuted ? (
                                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                          <X size={11} />
                                          <span>已取消</span>
                                        </span>
                                      ) : cust.currentStage && cust.currentStage !== '待執行' ? (
                                        <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                          <span>{cust.currentStage}</span>
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                          <Clock size={11} />
                                          <span>未完成</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Booking 狀態 (行事曆預約狀況：從今天往後到活動最終天 是否在行事曆上) */}
                                  <div className="flex items-center justify-between gap-1 text-[11px] px-2 py-1.5 rounded-lg border bg-slate-50 border-slate-200">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Calendar size={12} className={custBooking.isBooked ? "text-blue-600 shrink-0" : "text-slate-400 shrink-0"} />
                                      <span className="text-[10px] text-slate-500 shrink-0">行事曆狀態：</span>
                                      {custBooking.isBooked ? (
                                        <span className="font-bold text-blue-700 truncate text-[11px]">
                                          已排入 ({custBooking.bookedDates.join(', ')})
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 text-[10px]">
                                          尚未排入 (至 {bookingInfo.endDate} 前無排程)
                                        </span>
                                      )}
                                    </div>
                                    {custBooking.isBooked ? (
                                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded shrink-0">
                                        已Booking
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded shrink-0">
                                        未Booking
                                      </span>
                                    )}
                                  </div>

                                  {/* 日期在哪一天被完成 */}
                                  {isCustCompleted && (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-emerald-200">
                                        <div className="flex items-center gap-1 text-emerald-800 font-bold">
                                          <Calendar size={12} className="text-emerald-600 shrink-0" />
                                          <span>完成日期：</span>
                                          <span className="font-extrabold underline decoration-emerald-400 font-mono">
                                            {completionDate || currentDate}
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                          已完成
                                        </span>
                                      </div>
                                      {cust.completionReason && (
                                        <div className="flex items-center gap-1 text-[10px] bg-emerald-50/80 text-emerald-900 border border-emerald-200 px-2 py-1 rounded-md">
                                          <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                                          <span className="font-bold shrink-0">完成原因：</span>
                                          <span className="truncate">{cust.completionReason}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* 目前階段進度原因 */}
                                  {!isCustCompleted && !isCustNotExecuted && cust.currentStage && cust.stageReasons?.[cust.currentStage] && (
                                    <div className="flex items-center gap-1 text-[10px] bg-indigo-50/80 text-indigo-900 border border-indigo-200 px-2 py-1 rounded-md">
                                      <Sparkles size={11} className="text-indigo-600 shrink-0" />
                                      <span className="font-bold shrink-0">{cust.currentStage}進度：</span>
                                      <span className="truncate">{cust.stageReasons[cust.currentStage]}</span>
                                    </div>
                                  )}

                                  {/* 若未執行顯示未執行標記 */}
                                  {isCustNotExecuted && (
                                    <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-rose-200">
                                      <span className="text-rose-700 font-semibold text-[10px]">
                                        {cust.unexecutedReason || '未執行結案'}
                                      </span>
                                    </div>
                                  )}

                                  {/* 依要求：只能直接前往該天日誌，不能在側邊欄完成 */}
                                  <div className="pt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onSelectDate(targetDateForLog);
                                        onSelectCustomerForVisit(cust.customerName, cust.customerCode);
                                      }}
                                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                      title={`前往 ${targetDateForLog} 工作日誌進行填報與檢視`}
                                    >
                                      <ArrowRight size={13} strokeWidth={2.5} />
                                      <span>{buttonLabel}</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* 單一任務 (無綁定客戶列表) */
                        <div className="pt-1 space-y-2">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                            <span className="font-bold text-slate-700 text-xs">任務狀態：</span>
                            {t.status === 'completed' ? (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 size={11} className="text-emerald-600" />
                                <span>已完成</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Clock size={11} />
                                <span>未完成</span>
                              </span>
                            )}
                          </div>

                          {/* Booking 狀態 */}
                          <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-1 text-blue-900 font-bold">
                              <Calendar size={12} className="text-blue-600 shrink-0" />
                              <span>Booking 狀態：</span>
                              <span className="font-extrabold text-blue-700">
                                {bookingInfo.bookingRate > 0 ? `已在行事曆 (${bookingInfo.endDate})` : '尚未在行事曆'}
                              </span>
                            </div>
                          </div>

                          {t.status === 'completed' && (
                            <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-emerald-200">
                              <div className="flex items-center gap-1 text-emerald-800 font-bold">
                                <Calendar size={12} className="text-emerald-600 shrink-0" />
                                <span>完成日期：</span>
                                <span className="font-extrabold underline decoration-emerald-400 font-mono">
                                  {t.completedDate || t.reportedDate || t.scheduledDate || currentDate}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 依要求：只能直接前往該天日誌 */}
                          <div className="pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                const targetDate = t.completedDate || t.scheduledDate || currentDate;
                                onSelectDate(targetDate);
                                if (t.customerName) {
                                  onSelectCustomerForVisit(t.customerName, t.customerCode);
                                }
                              }}
                              className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <ArrowRight size={13} strokeWidth={2.5} />
                              <span>前往該天日誌 ({(t.completedDate || t.scheduledDate || currentDate).slice(5)})</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )
        )}
      </div>
    </aside>
  );
};
