// 食物预设列表
export const FOOD_PRESETS = [
  { id: "milk", name: "低脂牛奶", baseLabel: "100ml", kcal: 42 },
  { id: "egg", name: "鸡蛋", baseLabel: "1个", kcal: 70 },
  { id: "oats", name: "原味传统压片燕麦", baseLabel: "10g", kcal: 38 },
  { id: "rice", name: "米饭（熟）", baseLabel: "100g", kcal: 116 },
  { id: "chicken", name: "去皮鸡胸/鸡腿（熟）", baseLabel: "100g", kcal: 165 },
  { id: "tofu", name: "北豆腐/老豆腐", baseLabel: "100g", kcal: 76 },
  { id: "yogurt", name: "无糖酸奶", baseLabel: "100g", kcal: 60 },
  { id: "apple", name: "苹果", baseLabel: "1个", kcal: 95 },
  { id: "pear", name: "梨", baseLabel: "1个", kcal: 100 },
  { id: "orange", name: "橙子", baseLabel: "1个", kcal: 62 },
  { id: "corn", name: "玉米", baseLabel: "1根", kcal: 120 },
  { id: "potato", name: "土豆（蒸/煮）", baseLabel: "100g", kcal: 77 },
  { id: "cucumber", name: "黄瓜", baseLabel: "100g", kcal: 15 },
  { id: "tomato", name: "番茄", baseLabel: "100g", kcal: 18 },
  {
    id: "jianbing",
    name: "山东杂粮煎饼（玉米面+鸡蛋，简版）",
    baseLabel: "1个",
    kcal: 320,
    note: "按不加热狗/鸡柳/额外酱料的简版估算",
  },
  { id: "custom", name: "自定义输入", kcal: 0, baseLabel: "" },
];

// 运动选项
export const EXERCISE_OPTIONS = [
  { key: "walkDone", label: "步行", minutes: 30 },
  { key: "briskWalkDone", label: "快走", minutes: 35 },
  { key: "sitStandDone", label: "椅子站起", minutes: 10 },
  { key: "wallPushupDone", label: "扶墙俯卧撑", minutes: 10 },
  { key: "stretchDone", label: "拉伸", minutes: 8 },
];

// 计划数据
export const PLAN_DATA = {
  breakfast: [
    "原味传统压片燕麦 50g",
    "低脂牛奶 250ml",
    "鸡蛋 2 个",
    "苹果/梨/橙子 1 个",
  ],
  lunch: [
    "米饭 100g 熟重",
    "去皮鸡胸/鸡腿 150g",
    "西兰花/菜花/圆白菜/胡萝卜 300g",
    "无糖酸奶 200–250g",
  ],
  dinnerNoWalk: [
    "豆腐 200–250g 或去皮鸡肉 120g",
    "蔬菜 300g",
    "米饭 50g 熟重，或玉米半根，或土豆 100g",
    "无走路日尽量不加餐",
  ],
  dinnerWalk: [
    "豆腐 200–250g 或去皮鸡肉 120g",
    "蔬菜 300g",
    "米饭 80g 熟重，或玉米 1 根，或土豆 150g",
    "当日步行/快走完成后可加 1 次酸奶/低脂奶/水果",
  ],
  avoid: [
    "酒精、甜饮料",
    "菠菜、坚果/花生、可可/巧克力、麦麸早餐、浓茶",
    "高蛋白极端减脂、暴食式补偿",
  ],
  shopping: [
    "原味传统压片燕麦 500g",
    "大米 800g–1kg",
    "玉米 4 根，土豆 4 个",
    "去皮鸡胸/鸡腿 1.4–1.5kg",
    "鸡蛋 22 个左右",
    "北豆腐/老豆腐 2.2–2.5kg",
    "无糖酸奶约 2.5kg",
    "低脂牛奶 2.5–4L",
    "圆白菜 2 颗，菜花 3 颗，西兰花 3 颗或冷冻 2–3 袋",
    "胡萝卜 1kg，黄瓜 8–10 根，番茄 10–12 个，冬瓜 1 个小的或半个大的，蘑菇 500g",
    "苹果 6–8 个，梨 4–6 个，橙子 6–8 个",
  ],
};

// 存储键名
export const STORAGE_KEY = "mobile-weight-loss-checkin-app-v6";
export const STORAGE_VERSION = "v6";

// 默认值
export const DEFAULT_PROFILE = {
  totalDays: 120,
  startWeight: 80,
  targetWeight: 75,
  waterTarget: 2.5,
  walkGoal: 30,
  minCaloriesNoWalk: 1200,
  maxCaloriesNoWalk: 1500,
  minCaloriesWalk: 1300,
  maxCaloriesWalk: 1500,
};

// 平台期阈值（天）
export const PLATEAU_DAYS_THRESHOLD = 20;

// 同步超时时间（毫秒）
export const SYNC_TIMEOUT = 10000;
