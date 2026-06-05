export const state = {
  activeTab: 'main',
  isBatchMode: false,
  selectedIds: [],

  // Supabase Auth & DB state
  user: null,
  userProfile: null,

  storeSettings: {
    globalRemarksEnabled: true,
    checkoutAddons: [
      { id: 'ca1', name: '購物袋', price: 2, status: 'active' },
      { id: 'ca2', name: '免洗餐具 (筷子/湯匙)', price: 0, status: 'active' },
      { id: 'ca3', name: '加購吸管', price: 1, status: 'inactive' }
    ]
  },

  items: [
    {
      id: 1,
      name: '招牌紅燒牛肉麵',
      price: 180,
      category: '麵食',
      status: 'active',
      description: '嚴選本土牛肉，慢火熬煮8小時。',
      tags: ['人氣最高', '微辣'],
      image: 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?q=80&w=400&h=400&fit=crop',
      stockEnabled: true,
      currentStock: 15,
      autoRestock: 50,
      type: 'main',
      addonGroupIds: ['g3'],
      remarksEnabled: true
    },
    {
      id: 2,
      name: '特級錫蘭紅茶',
      price: 40,
      category: '飲料',
      status: 'inactive',
      description: '琥珀色澤，茶韻悠長。',
      tags: ['冷熱皆宜'],
      image: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?q=80&w=400&h=400&fit=crop',
      stockEnabled: false,
      currentStock: 0,
      autoRestock: 0,
      type: 'main',
      addonGroupIds: ['g1', 'g2'],
      remarksEnabled: false
    }
  ],

  addonGroups: [
    {
      id: 'g1',
      name: '冰度選擇',
      status: 'active',
      selectionMode: 'single',
      options: [
        { id: 'o1', name: '正常冰', price: 0, subGroupIds: [] },
        { id: 'o2', name: '去冰', price: 0, subGroupIds: [] },
        { id: 'o3', name: '微冰', price: 0, subGroupIds: [] },
        { id: 'o4', name: '熱的', price: 0, subGroupIds: [] }
      ]
    },
    {
      id: 'g2',
      name: '甜度選擇',
      status: 'inactive',
      selectionMode: 'single',
      options: [
        { id: 'o5', name: '全糖', price: 0, subGroupIds: [] },
        { id: 'o6', name: '半糖', price: 0, subGroupIds: [] },
        { id: 'o7', name: '微糖', price: 0, subGroupIds: [] },
        { id: 'o8', name: '無糖', price: 0, subGroupIds: [] }
      ]
    },
    {
      id: 'g3',
      name: '套餐升級',
      status: 'active',
      selectionMode: 'multiple',
      options: [
        { id: 'o9', name: '大份薯條', price: 30, subGroupIds: [] },
        { id: 'o10', name: '今日甜點', price: 45, subGroupIds: [] },
        { id: 'o11', name: '經典紅茶', price: 0, subGroupIds: ['g1', 'g2'] },
        { id: 'o12', name: '四季青茶', price: 10, subGroupIds: ['g1', 'g2'] }
      ]
    }
  ],

  scheduledMenus: [
    { id: 'm1', name: '早午餐菜單', startTime: '08:00', endTime: '14:00', itemIds: [1, 2], status: 'active' },
    { id: 'm2', name: '宵夜限定菜單', startTime: '22:00', endTime: '02:00', itemIds: [1], status: 'inactive-today' }
  ],

  categories: ['麵食', '飯類', '點心', '飲料'],
  activeCategory: '全部',
  searchTerm: '',
  draggedIndex: null,
  activeTouchListType: '',
  draggedCatIndex: null
};
