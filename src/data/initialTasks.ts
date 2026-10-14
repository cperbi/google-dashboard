import { ActivityTask, Customer, PotentialCustomer } from '../types';

export const initialCustomers: Customer[] = [
  {
    id: 'c-1',
    code: 'R04019',
    name: '北京藥局',
    tier: 'S',
    region: '台北市',
    weight: 98,
    revenue: 62,
    target: 157,
    scheduledDate: '2026-09-23',
    phone: '02-2345-6789',
    address: '台北市大安區信義路四段100號'
  },
  {
    id: 'c-2',
    code: 'R03347',
    name: '幸福藥局',
    tier: 'S',
    region: '新北市',
    weight: 95,
    revenue: 37,
    target: 131,
    scheduledDate: '2026-09-26',
    phone: '02-2987-6543',
    address: '新北市板橋區文化路一段200號'
  },
  {
    id: 'c-3',
    code: 'R03927',
    name: '護健康生活',
    tier: 'A',
    region: '台北市',
    weight: 88,
    revenue: 33,
    target: 107,
    scheduledDate: '2026-09-28',
    phone: '02-2712-3456',
    address: '台北市中山區南京東路三段50號'
  },
  {
    id: 'c-4',
    code: 'R07615-001',
    name: '(自)協康藥局',
    tier: 'A',
    region: '台中市',
    weight: 85,
    revenue: 35,
    target: 51,
    phone: '04-2301-8888',
    address: '台中市西區公益路150號'
  },
  {
    id: 'c-5',
    code: 'ME0164-03',
    name: '永茂醫療用品-高雄店',
    tier: 'A',
    region: '高雄市',
    weight: 82,
    revenue: 19,
    target: 64,
    phone: '07-333-8899',
    address: '高雄市前金區五福三路88號'
  },
  {
    id: 'c-6',
    code: 'R05658',
    name: '博平藥局',
    tier: 'A',
    region: '高雄市',
    weight: 80,
    revenue: 23,
    target: 53,
    phone: '07-715-1234',
    address: '高雄市苓雅區三多二路120號'
  },
  {
    id: 'c-7',
    code: 'R03346',
    name: '銘生藥局',
    tier: 'A',
    region: '台南市',
    weight: 78,
    revenue: 17,
    target: 57,
    scheduledDate: '2026-09-25',
    phone: '06-220-5678',
    address: '台南市中西區西門路二段300號'
  },
  {
    id: 'c-8',
    code: 'R03347-1',
    name: '幸福藥局-武',
    tier: 'S',
    region: '新北市',
    weight: 90,
    revenue: 14,
    target: 63,
    scheduledDate: '2026-09-29',
    phone: '02-2988-1234',
    address: '新北市板橋區武慶路45號'
  },
  {
    id: 'c-9',
    code: 'R03441-4',
    name: '東京-崇德店',
    tier: 'A',
    region: '台中市',
    weight: 75,
    revenue: 23,
    target: 20,
    scheduledDate: '2026-10-05',
    phone: '04-2241-9999',
    address: '台中市北屯區崇德路二段80號'
  },
  {
    id: 'c-10',
    code: 'R03441',
    name: '東京藥局統倉',
    tier: 'A',
    region: '台中市',
    weight: 73,
    revenue: 0,
    target: 65,
    phone: '04-2241-8888',
    address: '台中市大雅區中清路四段100號'
  },
  {
    id: 'c-11',
    code: 'R08821',
    name: '(自)順泰健保藥局',
    tier: 'B',
    region: '台北市',
    weight: 65,
    revenue: 11,
    target: 38,
    phone: '02-2500-1122',
    address: '台北市松山區民生東路五段60號'
  },
  {
    id: 'c-12',
    code: 'R09120',
    name: '正康大藥局',
    tier: 'B',
    region: '新竹市',
    weight: 60,
    revenue: 9,
    target: 30,
    scheduledDate: '2026-09-23',
    phone: '03-522-3344',
    address: '新竹市東區光復路一段120號'
  }
];

export const initialPotentialCustomers: PotentialCustomer[] = [
  {
    id: 'pc-1',
    name: '百宏中西大藥局',
    code: '',
    region: '高雄市',
    status: '接觸中',
    phone: '07-380-1122',
    address: '高雄市三民區九如一路50號'
  },
  {
    id: 'pc-2',
    name: '未來藥局',
    code: '',
    region: '台南市',
    status: '接觸中',
    phone: '06-258-3344',
    address: '台南市北區和緯路二段220號'
  },
  {
    id: 'pc-3',
    name: '百鴻中西大藥局-小港店',
    code: '',
    region: '高雄市',
    status: '評估中',
    phone: '07-801-5566',
    address: '高雄市小港區漢民路330號'
  }
];

export const initialTasks: ActivityTask[] = [
  {
    id: 'task-1',
    title: '2026 軟糖季',
    category: '陳列輔銷',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    requirePhoto: true,
    description: '請完成2026軟糖季的相關準備工作，包含場地佈置、端架陳列、活動宣傳及物資採購等事項，確保活動順利進行並吸引更多參與者。',
    status: 'pending',
    scheduledDate: '', // 不預先給時間，業務回報即算當日
    tags: ['ACE軟糖', '水果Q'],
    stages: ['第一階段', '第二階段', '第三階段'],
    targetCustomers: [
      {
        customerId: 'c-1',
        customerName: '北京藥局',
        customerCode: 'R04019',
        customerTier: 'S',
        customerRegion: '台北市',
        scheduledDate: '2026-09-23',
        reportedDate: '2026-09-23',
        completedDate: '2026-09-23',
        status: 'completed',
        currentStage: '完成',
        completionReason: '促銷活動端架陳列落實',
        stageReasons: {
          '第一階段': '已向店長洽談提報檔期活動',
          '第二階段': '海報與宣傳品已親送門市',
          '第三階段': '確認端架陳列排面空位'
        },
        stages: ['第一階段', '第二階段', '第三階段'],
        executionNotes: '已完成端架陳列與2026軟糖季海報張貼，排面飽滿。'
      },
      {
        customerId: 'c-2',
        customerName: '幸福藥局',
        customerCode: 'R03347',
        customerTier: 'S',
        customerRegion: '新北市',
        scheduledDate: '', // 不給時間，待業務回報
        status: 'pending',
        currentStage: '第一階段',
        stageReasons: {
          '第一階段': '初次提案溝通，等待主管核決'
        },
        stages: ['第一階段', '第二階段', '第三階段']
      },
      {
        customerId: 'c-3',
        customerName: '護健康生活',
        customerCode: 'R03927',
        customerTier: 'A',
        customerRegion: '台北市',
        scheduledDate: '', // 不給時間，待業務回報
        status: 'pending',
        currentStage: '第二階段',
        stageReasons: {
          '第一階段': '已接洽專案窗口店長',
          '第二階段': '樣品交付試用中，反饋熱烈'
        },
        stages: ['第一階段', '第二階段', '第三階段']
      },
      {
        customerId: 'c-4',
        customerName: '(自)協康藥局',
        customerCode: 'R07615-001',
        customerTier: 'A',
        customerRegion: '台中市',
        scheduledDate: '', // 不給時間，待業務回報
        status: 'pending'
      },
      {
        customerId: 'c-5',
        customerName: '永茂醫療用品-高雄店',
        customerCode: 'ME0164-03',
        customerTier: 'A',
        customerRegion: '高雄市',
        scheduledDate: '', // 不給時間，待業務回報
        status: 'pending'
      }
    ]
  },
  {
    id: 'task-2',
    title: '秋季新品端架輔銷',
    category: '陳列輔銷',
    startDate: '2026-09-15',
    endDate: '2026-10-15',
    requirePhoto: true,
    description: '巡檢主力連鎖門市入口端架，更換全新秋季輔銷POP並確保排面整齊滿載。',
    status: 'pending',
    scheduledDate: '', // 不預設時間
    tags: ['秋季檔期', '端架陳列'],
    photos: [],
    targetCustomers: [
      {
        customerId: 'c-7',
        customerName: '銘生藥局',
        customerCode: 'R03346',
        customerTier: 'A',
        customerRegion: '台南市',
        scheduledDate: '', // 不給時間，待業務回報
        status: 'pending'
      },
      {
        customerId: 'c-8',
        customerName: '幸福藥局-武',
        customerCode: 'R03347-1',
        customerTier: 'S',
        customerRegion: '新北市',
        scheduledDate: '', // 不給時間，待業務回報
        status: 'pending'
      },
      {
        customerId: 'c-6',
        customerName: '博平藥局',
        customerCode: 'R05658',
        customerTier: 'A',
        customerRegion: '高雄市',
        scheduledDate: '', // 不給時間，待業務回報
        status: 'pending'
      }
    ]
  },
  {
    id: 'task-3',
    title: '2026 飲品季',
    category: '盤點退轉',
    startDate: '2026-09-10',
    endDate: '2026-10-25',
    requirePhoto: true,
    description: '請完成2026飲品季庫存盤點與回報，清查夏季限定品項庫存量，針對效期剩餘不足60天之品項辦理即期退貨或調轉。',
    status: 'pending',
    scheduledDate: '', // 未排程
    tags: ['2C', '2B'],
    photos: [],
    targetCustomers: [
      {
        customerId: 'c-9',
        customerName: '東京-崇德店',
        customerCode: 'R03441-4',
        customerTier: 'A',
        customerRegion: '台中市',
        scheduledDate: '', // 未排程
        status: 'pending'
      },
      {
        customerId: 'c-10',
        customerName: '東京藥局統倉',
        customerCode: 'R03441',
        customerTier: 'A',
        customerRegion: '台中市',
        scheduledDate: '', // 未排程
        status: 'pending'
      },
      {
        customerId: 'c-11',
        customerName: '(自)順泰健保藥局',
        customerCode: 'R08821',
        customerTier: 'B',
        customerRegion: '台北市',
        scheduledDate: '', // 未排程
        status: 'pending'
      }
    ]
  },
  {
    id: 'task-4',
    title: '2026優格季',
    category: '簽約提報',
    startDate: '2026-09-01',
    endDate: '2026-09-28',
    requirePhoto: false,
    description: '請完成2026優格季的營銷與推廣計劃，提升品牌知名度及市場佔有率。',
    status: 'completed',
    scheduledDate: '2026-09-23',
    completedDate: '2026-09-23',
    tags: ['優格季', '年度合約'],
    executionNotes: '已完成雙方主管簽署，提報單據已送交財務審核。',
    targetCustomers: [
      {
        customerId: 'c-12',
        customerName: '正康大藥局',
        customerCode: 'R09120',
        customerTier: 'B',
        customerRegion: '新竹市',
        scheduledDate: '2026-09-23',
        completedDate: '2026-09-23',
        status: 'completed',
        executionNotes: '已完成雙方主管簽署，提報單據已送交財務審核。'
      },
      {
        customerId: 'c-1',
        customerName: '北京藥局',
        customerCode: 'R04019',
        customerTier: 'S',
        customerRegion: '台北市',
        scheduledDate: '2026-09-22',
        completedDate: '2026-09-22',
        status: 'completed',
        executionNotes: '已完成優格季年度合約簽署。'
      }
    ]
  },
  {
    id: 'task-5',
    title: 'Q3連鎖超商對帳與寄單',
    category: '寄單收款',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    requirePhoto: false,
    description: '核對本期各分店請款發票與折讓單據，確認帳務無誤後寄出結算清單並追蹤入帳進度。',
    status: 'pending',
    scheduledDate: '', // 不預先給時間，業務回報即算當日
    tags: ['超商體系', '請款發票'],
    targetCustomers: [
      {
        customerId: 'c-3',
        customerName: '護健康生活',
        customerCode: 'R03927',
        customerTier: 'A',
        customerRegion: '台北市',
        scheduledDate: '', // 不給時間，待業務回報
        status: 'pending'
      },
      {
        customerId: 'c-4',
        customerName: '(自)協康藥局',
        customerCode: 'R07615-001',
        customerTier: 'A',
        customerRegion: '台中市',
        scheduledDate: '', // 不給時間，待業務回報
        status: 'pending'
      }
    ]
  }
];

export const UNEXECUTED_REASONS = [
  '門市缺貨',
  '店長不在 / 無法接洽',
  '檔期延後',
  '貨架無合適空間',
  '競品佔位無法陳列',
  '單據不齊全',
  '客戶要求改期'
];
