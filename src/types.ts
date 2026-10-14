export type Category = '簽約提報' | '陳列輔銷' | '盤點退轉' | '寄單收款';

export type TaskStatus = 'pending' | 'completed' | 'not_executed';

export interface TaskCustomerAssignment {
  customerId: string;
  customerName: string;
  customerCode: string;
  customerTier?: 'S' | 'A' | 'B' | 'C';
  customerRegion?: string;
  scheduledDate?: string; // 指定去哪一天 (若不指派則為空字串)
  reportedDate?: string; // 業務回報日期
  completedDate?: string; // 日期在哪一天被完成 (只要完成就壓今天)
  status: TaskStatus; // 執行狀態
  currentStage?: string; // 目前階段 (例如: '待執行', '第一階段', '第二階段', '第三階段', '完成')
  stages?: string[]; // 階段列表 (預設: ['第一階段', '第二階段', '第三階段'])
  stageReasons?: Record<string, string>; // 各階段填寫的階段原因/進度說明
  completionReason?: string; // 完成原因 (選填，可選擇預設或自填)
  unexecutedReason?: string; // 未執行原因
  executionNotes?: string; // 執行備註
  photos?: string[];
}

export interface ActivityTask {
  id: string;
  title: string; // 主旨
  category: Category; // 類別
  achievementRate?: number; // 達成率 (%)
  bookingRate?: number; // Booking率 (%) 從今天往後到活動最終天是否有同樣客戶ID在行事曆上
  startDate: string; // 開始日期
  endDate: string; // 結束日期
  requirePhoto: boolean; // 是否需要拍照
  description: string; // 活動描述
  status: TaskStatus; // 執行狀態
  currentStage?: string; // 目前階段 (例如: '待執行', '第一階段', '第二階段', '第三階段', '完成')
  stages?: string[]; // 階段列表 (預設: ['第一階段', '第二階段', '第三階段'])
  stageReasons?: Record<string, string>; // 各階段填寫的階段原因/進度說明
  completionReason?: string; // 完成原因 (選填，可選擇預設或自填)
  unexecutedReason?: string; // 未執行原因
  executionNotes?: string; // 執行備註/結果
  photos?: string[]; // 拍照存證
  scheduledDate?: string; // 排程日期 (若不給時間則為空字串)
  reportedDate?: string; // 回報日期
  completedDate?: string; // 完成日期 (只要完成就壓今天)
  tags?: string[]; // 標籤 (例如: ['ACE軟糖', '水果Q'])
  targetCustomers?: TaskCustomerAssignment[]; // 綁定的一堆客戶列表 (各門市項目是否完成與完成日期)
  customerId?: string; // 關聯單一客戶 ID (若是單一執行卡片)
  customerName?: string; // 關聯客戶名稱
  customerCode?: string; // 關聯客戶代號
  customerTier?: 'S' | 'A' | 'B' | 'C';
  updatedAt?: string;
}

export interface Customer {
  id: string;
  code: string; // 例如: R04019
  name: string; // 例如: 北京藥局
  tier: 'S' | 'A' | 'B' | 'C'; // 等級
  region: string; // 區域 (例如: 台北市, 新北市, 高雄市等)
  weight: number; // 加權排序 (例如: 95)
  revenue: number; // 業績 (萬元)
  target: number; // 目標/額度 (萬元)
  scheduledDate?: string; // 排程日期 (例如: 06/02 或 2026/09/23)
  contactPerson?: string;
  phone?: string;
  address?: string;
}

export interface PotentialCustomer {
  id: string;
  name: string; // 例如: 百宏中西大藥局
  code?: string; // 空代號或有代號 []
  region: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  status: '接觸中' | '評估中' | '已成約';
}

export interface DayScheduleSummary {
  date: string; // YYYY-MM-DD
  events: {
    id: string;
    title: string;
    type: 'customer' | 'task' | 'internal';
    status?: TaskStatus;
    category?: Category;
  }[];
}
