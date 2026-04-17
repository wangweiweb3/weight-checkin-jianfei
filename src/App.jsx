
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Home,
  ClipboardCheck,
  BarChart3,
  Settings,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Footprints,
  Scale,
  Flame,
  Moon,
  CheckCircle2,
  TrendingDown,
  AlertCircle,
  Target,
  CalendarDays,
  ShoppingCart,
  UtensilsCrossed,
  Trash2,
  Sparkles,
  PanelTop,
} from "lucide-react";

const STORAGE_KEY = "mobile-weight-loss-checkin-app-v6";

const FOOD_PRESETS = [
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
];

const EXERCISE_OPTIONS = [
  { key: "walkDone", label: "步行", minutes: 30 },
  { key: "briskWalkDone", label: "快走", minutes: 35 },
  { key: "sitStandDone", label: "椅子站起", minutes: 10 },
  { key: "wallPushupDone", label: "扶墙俯卧撑", minutes: 10 },
  { key: "stretchDone", label: "拉伸", minutes: 8 },
];

const PLAN_DATA = {
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

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function diffDays(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  const ms = d2.getTime() - d1.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function avg(values) {
  const valid = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function groupMealCalories(entries = []) {
  const result = { breakfast: 0, lunch: 0, dinner: 0, snack: 0, total: 0 };
  entries.forEach((item) => {
    const meal = item.mealType || "snack";
    result[meal] = (result[meal] || 0) + Number(item.kcal || 0);
    result.total += Number(item.kcal || 0);
  });
  return result;
}

function getDailyTarget(profile, log) {
  const walkedEnough = Number(log?.walkMinutes || 0) >= 25 || Boolean(log?.walkDone) || Boolean(log?.briskWalkDone);
  return walkedEnough
    ? [profile.minCaloriesWalk, profile.maxCaloriesWalk]
    : [profile.minCaloriesNoWalk, profile.maxCaloriesNoWalk];
}

function anyExerciseDone(log) {
  return Boolean(log?.walkDone || log?.briskWalkDone || log?.sitStandDone || log?.wallPushupDone || log?.stretchDone);
}

function getNextMealKey(log) {
  if (!log?.breakfastDone) return "breakfastDone";
  if (!log?.lunchDone) return "lunchDone";
  if (!log?.dinnerDone) return "dinnerDone";
  return null;
}

function getNextMealLabel(log) {
  const key = getNextMealKey(log);
  if (key === "breakfastDone") return "早餐";
  if (key === "lunchDone") return "午餐";
  if (key === "dinnerDone") return "晚餐";
  return "餐次已完成";
}

function isDayComplete(log, profile) {
  return Boolean(
    log?.breakfastDone &&
      log?.lunchDone &&
      log?.dinnerDone &&
      log?.dinnerCarbControlled &&
      log?.noAlcohol &&
      log?.noSugaryDrinks &&
      Number(log?.water || 0) >= profile.waterTarget &&
      anyExerciseDone(log)
  );
}

function getDefaultLog() {
  return {
    weight: "",
    water: 0,
    walkMinutes: 0,
    breakfastDone: false,
    lunchDone: false,
    dinnerDone: false,
    dinnerCarbControlled: false,
    noAlcohol: true,
    noSugaryDrinks: true,
    walkDone: false,
    briskWalkDone: false,
    sitStandDone: false,
    wallPushupDone: false,
    stretchDone: false,
    heelPain: 0,
    snack: "无",
    stool: "正常",
    notes: "",
    mealEntries: [],
  };
}

function getDefaultState() {
  const startDate = todayStr();
  return {
    profile: {
      startDate,
      startWeight: 80,
      targetWeight: 75,
      totalDays: 120,
      minCaloriesNoWalk: 1450,
      maxCaloriesNoWalk: 1550,
      minCaloriesWalk: 1500,
      maxCaloriesWalk: 1600,
      waterTarget: 2.5,
      walkGoal: 30,
    },
    ai: {
      enabled: false,
      provider: "百度千帆（预留）",
      endpoint: "",
      model: "",
      apiKey: "",
      note: "当前版本先预留配置位，默认仍用手动估算和食物模板。",
    },
    logs: {
      [startDate]: {
        ...getDefaultLog(),
        weight: 80,
      },
    },
    activeDate: startDate,
    selectedDate: startDate,
    activeTab: "home",
    selectedWeek: 1,
    homeExerciseKey: "walkDone",
    lastAutoAdvanceNote: "",
    rolloverNotice: "",
    lastSeenDate: startDate,
  };
}

function overCaloriesForDate(log, profile) {
  const total = groupMealCalories(log?.mealEntries || []).total;
  const [, maxKcal] = getDailyTarget(profile, log || {});
  return Math.max(0, Math.round(total - maxKcal));
}

function underCaloriesForDate(log, profile) {
  const total = groupMealCalories(log?.mealEntries || []).total;
  const [, maxKcal] = getDailyTarget(profile, log || {});
  // 只有当天有记录且低于上限时才计算缺口
  if (total === 0) return 0;
  return Math.max(0, Math.round(maxKcal - total));
}

function buildRolloverNotice(fromDate, toDate, logs, profile) {
  if (!fromDate || fromDate >= toDate) return "";
  let cursor = fromDate;
  let incompleteDays = 0;
  let overDays = 0;
  let totalOver = 0;
  while (cursor < toDate) {
    const log = logs[cursor] || getDefaultLog();
    if (!isDayComplete(log, profile)) incompleteDays += 1;
    const over = overCaloriesForDate(log, profile);
    if (over > 0) {
      overDays += 1;
      totalOver += over;
    }
    cursor = addDays(cursor, 1);
  }
  if (incompleteDays === 0 && overDays === 0) return `已自动切换到 ${toDate}`;
  const parts = [];
  if (incompleteDays > 0) parts.push(`过去 ${incompleteDays} 天未完成`);
  if (overDays > 0) parts.push(`过去 ${overDays} 天饮食超标共约 ${totalOver} kcal`);
  return `已切换到 ${toDate}。${parts.join("；")}。`;
}

function buildCalorieDeficitNotice(logs, profile, planDates, activeIndex) {
  // 计算从开始到当前执行日的所有有记录天数
  let recordedDays = 0;
  let totalDeficit = 0;
  
  for (let i = 0; i <= activeIndex; i++) {
    const date = planDates[i];
    const log = logs[date];
    if (log && log.mealEntries && log.mealEntries.length > 0) {
      const deficit = underCaloriesForDate(log, profile);
      if (deficit > 0) {
        recordedDays += 1;
        totalDeficit += deficit;
      }
    }
  }
  
  if (recordedDays === 0 || totalDeficit === 0) return null;
  
  return {
    days: recordedDays,
    totalDeficit: totalDeficit,
    message: `过去 ${recordedDays} 天你比系统推荐的总摄入低 ${totalDeficit} kcal，继续保持！`
  };
}

function applyRollover(prev, systemDate) {
  const activeDate = prev.activeDate || systemDate;
  const lastSeenDate = prev.lastSeenDate || activeDate;
  if (lastSeenDate >= systemDate && activeDate >= systemDate) {
    if (lastSeenDate !== systemDate) return { ...prev, lastSeenDate: systemDate };
    return prev;
  }
  const nextLogs = { ...prev.logs };
  if (!nextLogs[systemDate]) nextLogs[systemDate] = getDefaultLog();
  const notice = buildRolloverNotice(activeDate, systemDate, nextLogs, prev.profile);
  return {
    ...prev,
    logs: nextLogs,
    activeDate: systemDate,
    selectedDate: systemDate,
    lastSeenDate: systemDate,
    rolloverNotice: notice,
  };
}

function GlassCard({ children, className = "" }) {
  return <div className={`rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-black/5 ${className}`}>{children}</div>;
}

function MetricCard({ title, value, sub, icon: Icon, tone = "light" }) {
  const tones = {
    light: "bg-white text-gray-900 ring-black/5",
    dark: "bg-gray-900 text-white ring-gray-900",
    soft: "bg-gray-100 text-gray-900 ring-gray-200",
    success: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    warn: "bg-amber-50 text-amber-900 ring-amber-200",
  };
  return (
    <div className={`rounded-[24px] p-4 shadow-sm ring-1 ${tones[tone] || tones.light}`}>
      <div className="flex items-center justify-between">
        <div className={`text-sm ${tone === "dark" ? "text-white/70" : "text-gray-500"}`}>{title}</div>
        <Icon className={`h-5 w-5 ${tone === "dark" ? "text-white/75" : "text-gray-400"}`} />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className={`mt-1 text-xs ${tone === "dark" ? "text-white/70" : "text-gray-500"}`}>{sub}</div>
    </div>
  );
}

function NavButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium ${
        active ? "bg-gray-900 text-white" : "text-gray-500"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}

function getFoodAdvice(log, profile) {
  const entries = log.mealEntries || [];
  const totals = groupMealCalories(entries);
  const [minKcal, maxKcal] = getDailyTarget(profile, log);
  const remaining = maxKcal - totals.total;

  if (!entries.length) {
    return `今天还没记录食物。先按计划吃：早餐固定燕麦+奶+鸡蛋+水果。今日建议区间 ${minKcal}–${maxKcal} kcal。`;
  }
  if (totals.total > maxKcal + 100) {
    return "今天已明显超过上限，下一顿尽量只吃蛋白+蔬菜，不再加主食、甜饮料和加餐。";
  }
  if (totals.lunch > 0 && totals.dinner === 0) {
    if (totals.total <= minKcal * 0.55) return "晚餐可以按正常计划吃：豆腐/鸡肉 + 蔬菜 300g + 米饭 80g 熟重。";
    if (totals.total <= maxKcal * 0.8) return "晚餐建议收紧版：豆腐/鸡肉 + 蔬菜 300g + 米饭 50g 熟重，不加餐。";
    return "晚餐建议只保留蛋白+蔬菜，今天主食尽量不再追加。";
  }
  if (totals.breakfast > 0 && totals.lunch === 0) {
    return `午餐建议控制在 ${Math.max(400, Math.min(550, remaining - 350))} kcal 左右，优先鸡肉/豆腐 + 蔬菜 + 少量主食。`;
  }
  if (remaining >= 450) return `今天还比较充裕，剩余可用热量约 ${remaining.toFixed(0)} kcal，下一顿按计划吃即可。`;
  if (remaining >= 250) return `今天剩余可用热量约 ${remaining.toFixed(0)} kcal，下一顿请用“收紧版晚餐”。`;
  return `今天剩余可用热量只有约 ${Math.max(0, remaining).toFixed(0)} kcal，后面以蛋白+蔬菜为主。`;
}

const CLOUD_SYNC_ENABLED = true;
const API_BASE_URL = '';

export default function App() {
  const [state, setState] = useState(getDefaultState);
  const [foodDraft, setFoodDraft] = useState({
    mealType: "lunch",
    presetId: "milk",
    qty: 1,
    customName: "",
    customKcal: "",
  });
  const [showResetModal, setShowResetModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [userId, setUserId] = useState('default');
  const importRef = useRef(null);

  const handleReset = () => {
    const newState = getDefaultState();
    setState(newState);
    setShowResetModal(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error(e);
    }
  };

  const [syncError, setSyncError] = useState('');

  const syncToCloud = async (data) => {
    if (!CLOUD_SYNC_ENABLED) return;
    setSyncStatus('syncing');
    setSyncError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/data?userId=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } else {
        const errorText = await response.text();
        setSyncError(`同步失败: ${response.status} ${errorText}`);
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError(`网络错误: ${error.message}`);
      setSyncStatus('error');
    }
  };

  const syncFromCloud = async () => {
    if (!CLOUD_SYNC_ENABLED) return;
    setSyncStatus('loading');
    setSyncError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/data?userId=${userId}`);
      if (response.ok) {
        const cloudData = await response.json();
        if (cloudData && Object.keys(cloudData).length > 0) {
          setState(prev => ({ ...getDefaultState(), ...cloudData }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
        }
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } else {
        const errorText = await response.text();
        setSyncError(`加载失败: ${response.status} ${errorText}`);
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Load from cloud error:', error);
      setSyncError(`网络错误: ${error.message}`);
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) setUserId(storedUserId);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const localData = JSON.parse(raw);
        setState({ ...getDefaultState(), ...localData });
      }
      if (CLOUD_SYNC_ENABLED) {
        syncFromCloud();
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (CLOUD_SYNC_ENABLED) {
        const timeoutId = setTimeout(() => syncToCloud(state), 1000);
        return () => clearTimeout(timeoutId);
      }
    } catch (e) {
      console.error(e);
    }
  }, [state]);

  useEffect(() => {
    const tick = () => setState((prev) => applyRollover(prev, todayStr()));
    tick();
    const timer = setInterval(tick, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    profile,
    ai,
    logs,
    activeDate,
    selectedDate,
    activeTab,
    selectedWeek,
    homeExerciseKey,
    lastAutoAdvanceNote,
    rolloverNotice,
  } = state;

  const activeLog = logs[activeDate] || getDefaultLog();
  const selectedLog = logs[selectedDate] || getDefaultLog();
  const planTitle = `我的${profile.totalDays}天减重计划`;
  const planEndDate = addDays(profile.startDate, profile.totalDays - 1);

  const planDates = useMemo(
    () => Array.from({ length: profile.totalDays }, (_, i) => addDays(profile.startDate, i)),
    [profile.startDate, profile.totalDays]
  );

  useEffect(() => {
    if (!logs[activeDate]) setState((prev) => ({ ...prev, logs: { ...prev.logs, [activeDate]: getDefaultLog() } }));
    if (!logs[selectedDate]) setState((prev) => ({ ...prev, logs: { ...prev.logs, [selectedDate]: getDefaultLog() } }));
  }, [activeDate, selectedDate]);

  const activeIndex = clamp(planDates.indexOf(activeDate), 0, planDates.length - 1);
  const selectedIndex = clamp(planDates.indexOf(selectedDate), 0, planDates.length - 1);
  const weekCount = Math.ceil(profile.totalDays / 7);
  const currentWeek = clamp(Math.floor(activeIndex / 7) + 1, 1, weekCount);

  const validDates = useMemo(
    () => Object.keys(logs).filter((d) => logs[d]?.weight !== "" && logs[d]?.weight != null).sort(),
    [logs]
  );
  const currentWeight = validDates.length ? Number(logs[validDates[validDates.length - 1]].weight) : profile.startWeight;
  const latestWeightDate = validDates.length ? validDates[validDates.length - 1] : profile.startDate;
  const previousWeight = validDates.length > 1 ? Number(logs[validDates[validDates.length - 2]].weight) : null;
  const previousWeightDate = validDates.length > 1 ? validDates[validDates.length - 2] : null;

  const lossSoFar = Number((profile.startWeight - currentWeight).toFixed(1));
  const totalGoalLoss = Math.max(0.1, profile.startWeight - profile.targetWeight);
  const remainingToGoal = Math.max(0, Number((currentWeight - profile.targetWeight).toFixed(1)));
  const weightProgress = clamp((lossSoFar / totalGoalLoss) * 100, 0, 100);
  const timeProgress = clamp(((activeIndex + 1) / profile.totalDays) * 100, 0, 100);

  const weeklyAvgNow = useMemo(() => {
    const slice = planDates.slice(Math.max(0, activeIndex - 6), activeIndex + 1);
    return avg(slice.map((d) => (logs[d]?.weight !== "" && logs[d]?.weight != null ? Number(logs[d]?.weight) : null)));
  }, [planDates, logs, activeIndex]);

  const weeklyAvgPrev = useMemo(() => {
    const end = Math.max(0, activeIndex - 7);
    const start = Math.max(0, end - 6);
    const slice = planDates.slice(start, end + 1);
    return avg(slice.map((d) => (logs[d]?.weight !== "" && logs[d]?.weight != null ? Number(logs[d]?.weight) : null)));
  }, [planDates, logs, activeIndex]);

  const weeklyDelta = weeklyAvgNow != null && weeklyAvgPrev != null ? Number((weeklyAvgNow - weeklyAvgPrev).toFixed(1)) : null;
  const plateau = activeIndex >= 20 && weeklyAvgNow != null && weeklyAvgPrev != null ? weeklyAvgPrev - weeklyAvgNow < 0.2 : false;

  const activeMealTotals = groupMealCalories(activeLog.mealEntries || []);
  const selectedMealTotals = groupMealCalories(selectedLog.mealEntries || []);
  const [activeMinKcal, activeMaxKcal] = getDailyTarget(profile, activeLog);
  const [selectedMinKcal, selectedMaxKcal] = getDailyTarget(profile, selectedLog);
  const homeFoodAdvice = getFoodAdvice(activeLog, profile);
  const checkinFoodAdvice = getFoodAdvice(selectedLog, profile);
  
  // 卡路里缺口提示
  const calorieDeficitNotice = useMemo(() => {
    return buildCalorieDeficitNotice(logs, profile, planDates, activeIndex);
  }, [logs, profile, planDates, activeIndex]);

  const expectedWeightToday = Number((profile.startWeight - totalGoalLoss * ((activeIndex + 1) / profile.totalDays)).toFixed(1));
  const paceGap = Number((currentWeight - expectedWeightToday).toFixed(1));
  const dayChange = previousWeight != null ? Number((currentWeight - previousWeight).toFixed(1)) : null;

  const feedbackText = useMemo(() => {
    const startPart = `距离目标还差 ${remainingToGoal} kg，目标日期 ${planEndDate}。`;
    const trendPart =
      dayChange == null
        ? "先连续记录几天体重。"
        : dayChange < 0
          ? `今天比上一次记录少了 ${Math.abs(dayChange)} kg。`
          : dayChange > 0
            ? `今天比上一次记录多了 ${dayChange} kg，单日波动是正常的。`
            : "今天和上一次记录持平。";
    const pacePart =
      paceGap <= -0.2
        ? `当前比计划快 ${Math.abs(paceGap)} kg。`
        : paceGap < 0.3
          ? "当前基本在计划线上。"
          : `当前比计划慢 ${paceGap} kg，优先守住晚餐主食和甜饮料。`;
    return `${trendPart} ${startPart} ${pacePart}`;
  }, [dayChange, remainingToGoal, paceGap, planEndDate]);

  const homeDailyScore = useMemo(() => {
    const checks = [
      activeLog.breakfastDone,
      activeLog.lunchDone,
      activeLog.dinnerDone,
      activeLog.dinnerCarbControlled,
      activeLog.noAlcohol,
      activeLog.noSugaryDrinks,
      Number(activeLog.water || 0) >= profile.waterTarget,
      anyExerciseDone(activeLog),
    ];
    return { score: checks.filter(Boolean).length, max: checks.length };
  }, [activeLog, profile.waterTarget]);

  const updateLogForDate = (date, patchOrUpdater, options = {}) => {
    setState((prev) => {
      const currentLog = prev.logs[date] || getDefaultLog();
      const nextLog =
        typeof patchOrUpdater === "function"
          ? patchOrUpdater(currentLog)
          : { ...currentLog, ...patchOrUpdater };
      const nextLogs = { ...prev.logs, [date]: nextLog };
      let nextState = { ...prev, logs: nextLogs };
      const becameComplete = !isDayComplete(currentLog, prev.profile) && isDayComplete(nextLog, prev.profile);
      if (becameComplete && !options.skipAutoAdvance) {
        const nextDate = addDays(date, 1);
        if (!nextLogs[nextDate]) nextLogs[nextDate] = getDefaultLog();
        nextState = {
          ...nextState,
          logs: nextLogs,
          activeDate: nextDate,
          selectedDate: nextDate,
          activeTab: "checkin",
          lastAutoAdvanceNote: `${date} 已完成，已切换到 ${nextDate}`,
        };
      }
      return nextState;
    });
  };

  const updateActiveLog = (patchOrUpdater, options = {}) => updateLogForDate(activeDate, patchOrUpdater, options);
  const updateSelectedLog = (patchOrUpdater, options = {}) => updateLogForDate(selectedDate, patchOrUpdater, options);

  const updateProfile = (key, value) => setState((prev) => ({ ...prev, profile: { ...prev.profile, [key]: value } }));
  const updateAI = (key, value) => setState((prev) => ({ ...prev, ai: { ...prev.ai, [key]: value } }));
  const setGoalLoss = (kg) => updateProfile("targetWeight", Number((profile.startWeight - (Number(kg) || 0)).toFixed(1)));

  const completeNextMealActive = () => {
    const key = getNextMealKey(activeLog);
    if (!key) return;
    updateActiveLog({ [key]: true });
  };

  const selectedExercise = EXERCISE_OPTIONS.find((item) => item.key === homeExerciseKey) || EXERCISE_OPTIONS[0];
  const toggleExerciseForDate = (date, key, forceValue = null) => {
    updateLogForDate(date, (log) => {
      const currentValue = Boolean(log[key]);
      const nextValue = forceValue == null ? !currentValue : forceValue;
      const minutes =
        key === "briskWalkDone"
          ? Math.max(Number(log.walkMinutes || 0), profile.walkGoal + 5)
          : key === "walkDone"
            ? Math.max(Number(log.walkMinutes || 0), profile.walkGoal)
            : Number(log.walkMinutes || 0);
      return { ...log, [key]: nextValue, walkMinutes: nextValue ? minutes : log.walkMinutes };
    });
  };
  const completeSelectedExerciseActive = () => toggleExerciseForDate(activeDate, homeExerciseKey, true);

  const goDate = (dir) => {
    const nextIdx = clamp(selectedIndex + dir, 0, planDates.length - 1);
    setState((prev) => ({ ...prev, selectedDate: planDates[nextIdx] }));
  };

  const addFoodEntry = () => {
    const isCustom = foodDraft.presetId === "custom";
    let entry = null;
    if (isCustom) {
      if (!foodDraft.customName || !foodDraft.customKcal) return;
      const qty = Number(foodDraft.qty) || 1;
      entry = {
        mealType: foodDraft.mealType,
        name: foodDraft.customName,
        qty,
        baseLabel: "份",
        kcal: Number((Number(foodDraft.customKcal) * qty).toFixed(0)),
      };
    } else {
      const preset = FOOD_PRESETS.find((f) => f.id === foodDraft.presetId);
      if (!preset) return;
      const qty = Number(foodDraft.qty) || 1;
      entry = {
        mealType: foodDraft.mealType,
        name: preset.name,
        qty,
        baseLabel: preset.baseLabel,
        kcal: Number((preset.kcal * qty).toFixed(0)),
        note: preset.note || "",
      };
    }
    updateSelectedLog((log) => ({ ...log, mealEntries: [...(log.mealEntries || []), entry] }), { skipAutoAdvance: true });
    setFoodDraft((prev) => ({ ...prev, qty: 1, customName: "", customKcal: "" }));
  };

  const removeFoodEntry = (index) =>
    updateSelectedLog((log) => ({ ...log, mealEntries: (log.mealEntries || []).filter((_, i) => i !== index) }), {
      skipAutoAdvance: true,
    });

  const finalizeSelectedDay = () => {
    const log = logs[selectedDate] || getDefaultLog();
    if (!isDayComplete(log, profile)) {
      alert("今天还没完成全部核心打卡：三餐、晚餐主食、饮水、无甜饮/无酒精、至少一项运动。");
      return;
    }
    const nextDate = addDays(selectedDate, 1);
    setState((prev) => ({
      ...prev,
      logs: { ...prev.logs, [nextDate]: prev.logs[nextDate] || getDefaultLog() },
      activeDate: nextDate,
      selectedDate: nextDate,
      activeTab: "checkin",
      lastAutoAdvanceNote: `${selectedDate} 已完成，已切换到 ${nextDate}`,
    }));
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `减重打卡-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      setState({ ...getDefaultState(), ...JSON.parse(text) });
    } catch {
      alert("导入失败，请选择正确的 JSON 备份文件");
    }
  };

  const chartData = useMemo(() => {
    const start = Math.max(0, activeIndex - 13);
    const dates = planDates.slice(start, activeIndex + 1);
    return dates.map((date, idx) => {
      const last7 = dates.slice(Math.max(0, idx - 6), idx + 1);
      const avg7 = avg(last7.map((d) => (logs[d]?.weight !== "" && logs[d]?.weight != null ? Number(logs[d]?.weight) : null)));
      return {
        date: date.slice(5),
        weight: logs[date]?.weight !== "" && logs[date]?.weight != null ? Number(logs[date]?.weight) : null,
        avg7: avg7 != null ? Number(avg7.toFixed(1)) : null,
        walk: logs[date]?.walkMinutes ? Number(logs[date]?.walkMinutes) : null,
      };
    });
  }, [planDates, logs, activeIndex]);

  const weekDates = useMemo(() => {
    const start = (selectedWeek - 1) * 7;
    return planDates.slice(start, Math.min(start + 7, planDates.length));
  }, [planDates, selectedWeek]);

  const weekStats = useMemo(() => {
    const weekWeights = weekDates.map((d) => (logs[d]?.weight !== "" && logs[d]?.weight != null ? Number(logs[d]?.weight) : null));
    const weekWalks = weekDates.map((d) => Number(logs[d]?.walkMinutes || 0));
    const weekWaters = weekDates.map((d) => Number(logs[d]?.water || 0));
    const weekPains = weekDates.map((d) => Number(logs[d]?.heelPain || 0));
    const summaryRows = weekDates.map((d) => {
      const log = logs[d] || getDefaultLog();
      const checks = [
        log.breakfastDone,
        log.lunchDone,
        log.dinnerDone,
        log.dinnerCarbControlled,
        log.noAlcohol,
        log.noSugaryDrinks,
        Number(log.water || 0) >= profile.waterTarget,
        anyExerciseDone(log),
      ];
      return {
        date: d,
        short: d.slice(5),
        weight: log.weight === "" ? null : Number(log.weight),
        walk: Number(log.walkMinutes || 0),
        water: Number(log.water || 0),
        pain: Number(log.heelPain || 0),
        score: checks.filter(Boolean).length,
      };
    });
    const prevWeekDates = planDates.slice(Math.max(0, (selectedWeek - 2) * 7), Math.max(0, (selectedWeek - 1) * 7));
    const prevAvg = avg(prevWeekDates.map((d) => (logs[d]?.weight !== "" && logs[d]?.weight != null ? Number(logs[d]?.weight) : null)));
    const currAvg = avg(weekWeights);
    return {
      avgWeight: currAvg,
      avgWalk: avg(weekWalks),
      avgWater: avg(weekWaters),
      maxPain: Math.max(...weekPains, 0),
      loggedDays: weekDates.filter((d) => logs[d]?.weight !== "" || logs[d]?.mealEntries?.length).length,
      prevAvg,
      deltaVsPrev: prevAvg != null && currAvg != null ? Number((currAvg - prevAvg).toFixed(1)) : null,
      adherence: Math.round((summaryRows.reduce((a, b) => a + b.score, 0) / (summaryRows.length * 8 || 1)) * 100),
      rows: summaryRows,
    };
  }, [weekDates, logs, planDates, selectedWeek, profile.waterTarget]);

  const weeklyHint = useMemo(() => {
    if (weekStats.loggedDays <= 2) return "这周记录还不够，先把体重和饮食补齐。";
    if (weekStats.deltaVsPrev != null && weekStats.deltaVsPrev < 0) return "这周平均体重比上周更低，方向是对的。";
    if ((weekStats.avgWalk || 0) < 20) return "这周运动偏少，先把每天至少一项运动守住。";
    if ((weekStats.avgWater || 0) < profile.waterTarget) return "这周喝水偏少，优先补到 2.5L。";
    return "这周体重还没明显往下，先检查晚餐主食、加餐和外食。";
  }, [weekStats, profile.waterTarget]);

  const HomePage = () => {
    const remainingUpper = Math.max(0, activeMaxKcal - activeMealTotals.total);
    const overUpper = Math.max(0, activeMealTotals.total - activeMaxKcal);
    const currentExerciseDone = Boolean(activeLog[homeExerciseKey]);

    return (
      <div className="space-y-4">
        <div className="rounded-[30px] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-700 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-white/70">{planTitle}</div>
              <div className="mt-1 text-2xl font-semibold">当前执行日：{activeDate}</div>
              <div className="mt-2 text-sm text-white/80">当前 {currentWeight} kg · 已减 {lossSoFar > 0 ? lossSoFar : 0} kg · 目标 {profile.targetWeight} kg · 结束于 {planEndDate}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
              <div className="text-xs text-white/70">第</div>
              <div className="text-xl font-semibold">{activeIndex + 1}天</div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-white/70"><span>时间进度</span><span>{Math.round(timeProgress)}%</span></div>
              <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-white" style={{ width: `${timeProgress}%` }} /></div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-white/70"><span>体重进度</span><span>{Math.round(weightProgress)}%</span></div>
              <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-emerald-400" style={{ width: `${weightProgress}%` }} /></div>
            </div>
          </div>
        </div>

        {rolloverNotice ? <GlassCard className="bg-amber-50 ring-amber-200"><div className="text-sm text-amber-800">{rolloverNotice}</div></GlassCard> : null}
        {lastAutoAdvanceNote ? <GlassCard className="bg-emerald-50 ring-emerald-200"><div className="text-sm text-emerald-800">{lastAutoAdvanceNote}</div></GlassCard> : null}
        {calorieDeficitNotice ? <GlassCard className="bg-blue-50 ring-blue-200"><div className="text-sm text-blue-800">{calorieDeficitNotice.message}</div></GlassCard> : null}

        <GlassCard className="bg-emerald-50 ring-emerald-200">
          <div className="flex items-center justify-between"><div><div className="text-lg font-semibold text-emerald-900">目标反馈</div><div className="mt-1 text-sm text-emerald-800">{feedbackText}</div></div><Sparkles className="h-5 w-5 text-emerald-700" /></div>
          <div className="mt-3 text-xs text-emerald-700">按计划，当前执行日的参考体重约 {expectedWeightToday} kg。最新记录日期：{latestWeightDate}{previousWeightDate ? `，上一条记录：${previousWeightDate}` : ""}</div>
        </GlassCard>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard title="今日热量区间" value={`${activeMinKcal}–${activeMaxKcal} kcal`} sub={`已吃 ${activeMealTotals.total.toFixed(0)} kcal`} icon={Flame} tone="dark" />
          <MetricCard title="剩余卡路里" value={overUpper > 0 ? `+${overUpper.toFixed(0)} kcal` : `${remainingUpper.toFixed(0)} kcal`} sub={overUpper > 0 ? "已超过上限" : "到上限还剩"} icon={PanelTop} />
          <MetricCard title="7天平均体重" value={weeklyAvgNow != null ? `${weeklyAvgNow.toFixed(1)} kg` : "—"} sub={weeklyDelta == null ? "满2周后显示变化" : weeklyDelta < 0 ? `比上周 ${Math.abs(weeklyDelta).toFixed(1)} kg` : `比上周 +${weeklyDelta.toFixed(1)} kg`} icon={TrendingDown} />
          <MetricCard title="当前执行日完成度" value={`${homeDailyScore.score}/${homeDailyScore.max}`} sub={homeDailyScore.score >= 6 ? "联动正常" : "还有待办"} icon={CheckCircle2} />
        </div>

        <GlassCard>
          <div className="flex items-center justify-between"><div><div className="text-lg font-semibold">当前执行日待办</div><div className="text-sm text-gray-500">可直接点击完成，下面一键完成也会联动刷新</div></div><Target className="h-5 w-5 text-gray-400" /></div>
          <div className="mt-3 space-y-2">
            {[
              {
                id: "meal",
                label: getNextMealKey(activeLog) ? `完成${getNextMealLabel(activeLog)}` : "三餐已完成",
                done: !getNextMealKey(activeLog),
                action: completeNextMealActive,
              },
              {
                id: "exercise",
                label: `完成${selectedExercise.label}`,
                done: Boolean(activeLog[homeExerciseKey]),
                action: completeSelectedExerciseActive,
              },
              {
                id: "carb",
                label: "晚餐主食守住",
                done: Boolean(activeLog.dinnerCarbControlled),
                action: () => updateActiveLog({ dinnerCarbControlled: !activeLog.dinnerCarbControlled }),
              },
              {
                id: "water",
                label: `喝水到 ${profile.waterTarget}L`,
                done: Number(activeLog.water || 0) >= profile.waterTarget,
                action: () => updateActiveLog({ water: profile.waterTarget }),
              },
              {
                id: "sweet",
                label: "无甜饮料",
                done: Boolean(activeLog.noSugaryDrinks),
                action: () => updateActiveLog({ noSugaryDrinks: !activeLog.noSugaryDrinks }),
              },
            ].map((todo) => (
              <button key={todo.id} onClick={todo.action} className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left ${todo.done ? "bg-emerald-50 text-emerald-800" : "bg-gray-50 text-gray-800"}`}>
                <span className="text-sm font-medium">{todo.label}</span>
                <span className="text-xs">{todo.done ? "已完成" : "点此完成"}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between"><div><div className="text-lg font-semibold">首页一键完成</div><div className="text-sm text-gray-500">会和打卡页实时联动</div></div><ClipboardCheck className="h-5 w-5 text-gray-400" /></div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button onClick={completeNextMealActive} className="rounded-[24px] bg-white p-4 text-left shadow-sm ring-1 ring-black/5"><div className="text-sm text-gray-500">下一餐次</div><div className="mt-2 font-semibold">{getNextMealLabel(activeLog)}</div></button>
            <button onClick={() => updateActiveLog({ dinnerCarbControlled: !activeLog.dinnerCarbControlled })} className="rounded-[24px] bg-white p-4 text-left shadow-sm ring-1 ring-black/5"><div className="text-sm text-gray-500">晚餐主食</div><div className="mt-2 font-semibold">{activeLog.dinnerCarbControlled ? "已守住" : "点此完成"}</div></button>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500">选择当前执行日完成的运动</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXERCISE_OPTIONS.map((item) => (
                <button key={item.key} onClick={() => setState((prev) => ({ ...prev, homeExerciseKey: item.key }))} className={`rounded-full px-3 py-2 text-sm ${homeExerciseKey === item.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>{item.label}</button>
              ))}
            </div>
            <button onClick={completeSelectedExerciseActive} className="mt-3 w-full rounded-2xl bg-gray-900 px-4 py-3 font-medium text-white">{currentExerciseDone ? `${selectedExercise.label} 已完成` : `一键完成 ${selectedExercise.label}`}</button>
          </div>
          <div className="mt-4 rounded-2xl bg-gray-50 p-3 text-sm text-gray-700">食物建议：{homeFoodAdvice}</div>
        </GlassCard>

        {plateau ? <div className="rounded-[28px] bg-amber-50 p-4 shadow-sm ring-1 ring-amber-200"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" /><div><div className="font-semibold text-amber-900">平台期提醒</div><div className="mt-1 text-sm text-amber-800">最近2周下降不明显。先别猛减热量，优先检查晚餐主食、无走路日加餐、外食和甜饮料。</div></div></div></div> : null}
      </div>
    );
  };

  const CheckinPage = () => {
    const remainingUpper = Math.max(0, selectedMaxKcal - selectedMealTotals.total);
    const overUpper = Math.max(0, selectedMealTotals.total - selectedMaxKcal);
    const belowMin = Math.max(0, selectedMinKcal - selectedMealTotals.total);

    return (
      <div className="space-y-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <button className="rounded-2xl bg-gray-100 p-2" onClick={() => goDate(-1)}><ChevronLeft className="h-5 w-5" /></button>
            <div className="text-center">
              <input type="date" className="rounded-2xl border border-gray-200 px-3 py-2 text-sm" value={selectedDate} min={planDates[0]} max={planDates[planDates.length - 1]} onChange={(e) => setState((prev) => ({ ...prev, selectedDate: e.target.value }))} />
              <div className="mt-2 text-sm text-gray-500">第 {selectedIndex + 1} / {profile.totalDays} 天</div>
            </div>
            <button className="rounded-2xl bg-gray-100 p-2" onClick={() => goDate(1)}><ChevronRight className="h-5 w-5" /></button>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-3 text-lg font-semibold">今天打卡</div>
          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">晨起体重</div><input type="number" step="0.1" className="w-full rounded-xl border border-gray-200 px-3 py-2" value={selectedLog.weight} onChange={(e) => updateSelectedLog({ weight: e.target.value === "" ? "" : Number(e.target.value) }, { skipAutoAdvance: true })} /></label>
            <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">喝水（L）</div><input type="number" step="0.1" className="w-full rounded-xl border border-gray-200 px-3 py-2" value={selectedLog.water} onChange={(e) => updateSelectedLog({ water: e.target.value === "" ? 0 : Number(e.target.value) }, { skipAutoAdvance: true })} /></label>
            <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">步行分钟</div><input type="number" className="w-full rounded-xl border border-gray-200 px-3 py-2" value={selectedLog.walkMinutes} onChange={(e) => updateSelectedLog({ walkMinutes: e.target.value === "" ? 0 : Number(e.target.value) }, { skipAutoAdvance: true })} /></label>
            <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">足跟痛（0-10）</div><input type="range" min="0" max="10" className="w-full" value={selectedLog.heelPain} onChange={(e) => updateSelectedLog({ heelPain: Number(e.target.value) }, { skipAutoAdvance: true })} /><div className="text-sm font-medium">{selectedLog.heelPain}</div></label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {[["breakfastDone","早餐按计划"],["lunchDone","午餐按计划"],["dinnerDone","晚餐按计划"],["dinnerCarbControlled","晚餐主食守住"],["noAlcohol","无酒精"],["noSugaryDrinks","无甜饮料"]].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 rounded-2xl bg-gray-50 px-3 py-3"><input type="checkbox" checked={Boolean(selectedLog[key])} onChange={(e) => updateSelectedLog({ [key]: e.target.checked })} /><span>{label}</span></label>
            ))}
          </div>

          <div className="mt-4">
            <div className="mb-2 text-sm text-gray-500">运动完成情况（与首页联动）</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {EXERCISE_OPTIONS.map((item) => (
                <button key={item.key} onClick={() => toggleExerciseForDate(selectedDate, item.key)} className={`rounded-2xl px-3 py-3 text-left ${selectedLog[item.key] ? "bg-emerald-50 text-emerald-800" : "bg-gray-50 text-gray-800"}`}>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs">{selectedLog[item.key] ? "已完成" : "点此完成"}</div>
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between"><div><div className="text-lg font-semibold">食物记录</div><div className="text-sm text-gray-500">偏离计划时也能记录，并显示剩余热量</div></div><UtensilsCrossed className="h-5 w-5 text-gray-400" /></div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">餐次</div><select className="w-full rounded-xl border border-gray-200 px-3 py-2" value={foodDraft.mealType} onChange={(e) => setFoodDraft((prev) => ({ ...prev, mealType: e.target.value }))}><option value="breakfast">早餐</option><option value="lunch">午餐</option><option value="dinner">晚餐</option><option value="snack">加餐</option></select></label>
            <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">食物</div><select className="w-full rounded-xl border border-gray-200 px-3 py-2" value={foodDraft.presetId} onChange={(e) => setFoodDraft((prev) => ({ ...prev, presetId: e.target.value }))}>{FOOD_PRESETS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}<option value="custom">自定义输入</option></select></label>
          </div>

          {foodDraft.presetId === "custom" ? (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">自定义食物名</div><input className="w-full rounded-xl border border-gray-200 px-3 py-2" value={foodDraft.customName} onChange={(e) => setFoodDraft((prev) => ({ ...prev, customName: e.target.value }))} /></label>
              <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">每份估算 kcal</div><input type="number" className="w-full rounded-xl border border-gray-200 px-3 py-2" value={foodDraft.customKcal} onChange={(e) => setFoodDraft((prev) => ({ ...prev, customKcal: e.target.value }))} /></label>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-600">{(() => { const preset = FOOD_PRESETS.find((f) => f.id === foodDraft.presetId); return preset ? `基准：${preset.baseLabel} ≈ ${preset.kcal} kcal${preset.note ? `；${preset.note}` : ""}` : ""; })()}</div>
          )}

          <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
            <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">份数</div><input type="number" step="0.1" className="w-full rounded-xl border border-gray-200 px-3 py-2" value={foodDraft.qty} onChange={(e) => setFoodDraft((prev) => ({ ...prev, qty: e.target.value }))} /></label>
            <button onClick={addFoodEntry} className="rounded-2xl bg-gray-900 px-4 py-3 font-medium text-white self-end">添加</button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MetricCard title="今日已记录" value={`${selectedMealTotals.total.toFixed(0)} kcal`} sub={`目标 ${selectedMinKcal}–${selectedMaxKcal} kcal`} icon={Flame} tone="soft" />
            <MetricCard title="剩余卡路里" value={overUpper > 0 ? `+${overUpper.toFixed(0)} kcal` : `${remainingUpper.toFixed(0)} kcal`} sub={overUpper > 0 ? "已超过上限" : "到上限还剩"} icon={PanelTop} tone={overUpper > 0 ? "warn" : "soft"} />
          </div>
          <div className="mt-3 rounded-2xl bg-gray-50 p-3 text-sm text-gray-700">{selectedMealTotals.total < selectedMinKcal ? `距离建议下限还差约 ${belowMin.toFixed(0)} kcal；` : "已达到建议下限；"} 餐次拆分：早 {selectedMealTotals.breakfast.toFixed(0)} / 午 {selectedMealTotals.lunch.toFixed(0)} / 晚 {selectedMealTotals.dinner.toFixed(0)} / 加 {selectedMealTotals.snack.toFixed(0)} kcal</div>
          <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800"><div className="font-medium text-emerald-900">下一顿建议</div><div className="mt-1">{checkinFoodAdvice}</div></div>

          <div className="mt-4 space-y-2">
            {(selectedLog.mealEntries || []).length ? (selectedLog.mealEntries || []).map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3">
                <div><div className="font-medium">{item.name}</div><div className="text-xs text-gray-500">{item.mealType} · {item.qty} × {item.baseLabel} · {item.kcal} kcal{item.note ? ` · ${item.note}` : ""}</div></div>
                <button onClick={() => removeFoodEntry(index)} className="rounded-xl bg-white p-2 text-gray-500 ring-1 ring-black/5"><Trash2 className="h-4 w-4" /></button>
              </div>
            )) : <div className="rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-500">今天还没有记录食物。比如“50ml牛奶 + 山东杂粮煎饼”，可以直接添加两条。</div>}
          </div>
        </GlassCard>

        <button onClick={finalizeSelectedDay} className="w-full rounded-3xl bg-gray-900 px-4 py-4 font-medium text-white">完成今天并进入下一天</button>
      </div>
    );
  };

  const PlanPage = () => (
    <div className="space-y-4">
      <GlassCard><div className="flex items-center justify-between"><div><div className="text-lg font-semibold">最终版饮食计划</div><div className="text-sm text-gray-500">不用再回聊天记录里翻</div></div><Target className="h-5 w-5 text-gray-400" /></div></GlassCard>
      <GlassCard><div className="text-lg font-semibold">早餐固定模板</div><div className="mt-3 space-y-2">{PLAN_DATA.breakfast.map((item) => <div key={item} className="rounded-2xl bg-gray-50 px-3 py-3 text-sm">• {item}</div>)}</div></GlassCard>
      <GlassCard><div className="text-lg font-semibold">午餐模板</div><div className="mt-3 space-y-2">{PLAN_DATA.lunch.map((item) => <div key={item} className="rounded-2xl bg-gray-50 px-3 py-3 text-sm">• {item}</div>)}</div></GlassCard>
      <GlassCard><div className="text-lg font-semibold">晚餐模板（不走路日）</div><div className="mt-3 space-y-2">{PLAN_DATA.dinnerNoWalk.map((item) => <div key={item} className="rounded-2xl bg-gray-50 px-3 py-3 text-sm">• {item}</div>)}</div></GlassCard>
      <GlassCard><div className="text-lg font-semibold">晚餐模板（走路日）</div><div className="mt-3 space-y-2">{PLAN_DATA.dinnerWalk.map((item) => <div key={item} className="rounded-2xl bg-gray-50 px-3 py-3 text-sm">• {item}</div>)}</div></GlassCard>
      <GlassCard><div className="text-lg font-semibold">尽量避开</div><div className="mt-3 space-y-2">{PLAN_DATA.avoid.map((item) => <div key={item} className="rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800">• {item}</div>)}</div></GlassCard>
      <GlassCard><div className="flex items-center justify-between"><div className="text-lg font-semibold">10天采购建议</div><ShoppingCart className="h-5 w-5 text-gray-400" /></div><div className="mt-3 space-y-2">{PLAN_DATA.shopping.map((item) => <div key={item} className="rounded-2xl bg-gray-50 px-3 py-3 text-sm">• {item}</div>)}</div></GlassCard>
    </div>
  );

  const WeeklyPage = () => (
    <div className="space-y-4">
      <GlassCard><div className="flex items-center justify-between gap-3"><div><div className="text-lg font-semibold">每周总结页</div><div className="text-sm text-gray-500">看趋势，不被单日体重吓到</div></div><CalendarDays className="h-5 w-5 text-gray-400" /></div><div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">{Array.from({ length: weekCount }, (_, i) => i + 1).map((week) => <button key={week} onClick={() => setState((prev) => ({ ...prev, selectedWeek: week }))} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${selectedWeek === week ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>第 {week} 周</button>)}</div></GlassCard>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard title="本周平均体重" value={weekStats.avgWeight != null ? `${weekStats.avgWeight.toFixed(1)} kg` : "—"} sub={weekStats.deltaVsPrev == null ? "上周数据不足" : weekStats.deltaVsPrev < 0 ? `比上周 ${Math.abs(weekStats.deltaVsPrev).toFixed(1)} kg` : `比上周 +${weekStats.deltaVsPrev.toFixed(1)} kg`} icon={Scale} />
        <MetricCard title="本周平均步行" value={weekStats.avgWalk != null ? `${weekStats.avgWalk.toFixed(0)} 分钟` : "—"} sub="越稳定越重要" icon={Footprints} />
        <MetricCard title="本周平均喝水" value={weekStats.avgWater != null ? `${weekStats.avgWater.toFixed(1)} L` : "—"} sub={`目标 ${profile.waterTarget} L`} icon={Droplets} />
        <MetricCard title="本周执行率" value={`${weekStats.adherence || 0}%`} sub={`有记录 ${weekStats.loggedDays}/${weekDates.length} 天`} icon={CheckCircle2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard title="最高足跟痛" value={`${weekStats.maxPain}/10`} sub="第二天别更痛" icon={Moon} tone={weekStats.maxPain >= 5 ? "warn" : "soft"} />
        <MetricCard title="本周结论" value={weekStats.deltaVsPrev != null && weekStats.deltaVsPrev < 0 ? "在下降" : "继续稳住"} sub={weeklyHint} icon={TrendingDown} tone={weekStats.deltaVsPrev != null && weekStats.deltaVsPrev < 0 ? "success" : "light"} />
      </div>
      <GlassCard><div className="mb-3 text-lg font-semibold">本周步行图</div><div className="h-60 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekStats.rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="short" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="walk" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div></GlassCard>
      <GlassCard><div className="mb-3 text-lg font-semibold">本周明细</div><div className="space-y-2">{weekStats.rows.map((row) => <button key={row.date} onClick={() => setState((prev) => ({ ...prev, selectedDate: row.date, activeTab: "checkin" }))} className="flex w-full items-center justify-between rounded-2xl bg-gray-50 px-3 py-3 text-left"><div><div className="font-medium">{row.short}</div><div className="text-xs text-gray-500">体重 {row.weight ?? "—"} · 步行 {row.walk} 分钟 · 喝水 {row.water} L</div></div><div className="rounded-full bg-white px-2 py-1 text-xs text-gray-600">得分 {row.score}/8</div></button>)}</div></GlassCard>
    </div>
  );

  // SettingsPage - 使用 useCallback 缓存组件，避免重新渲染导致输入框失去焦点
  const SettingsPage = useCallback(() => {
    // 使用 ref 来保存输入值，避免重新渲染
    const startDateRef = useRef(profile.startDate);
    const totalDaysRef = useRef(profile.totalDays);
    const startWeightRef = useRef(profile.startWeight);
    const targetWeightRef = useRef(profile.targetWeight);
    
    const handleSave = () => {
      updateProfile("startDate", startDateRef.current);
      updateProfile("totalDays", Number(totalDaysRef.current) || 120);
      updateProfile("startWeight", Number(startWeightRef.current) || 80);
      updateProfile("targetWeight", Number(targetWeightRef.current) || 75);
    };
    
    return (
    <div className="space-y-4">
      <GlassCard>
        <div className="mb-3 text-lg font-semibold">目标设置</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">开始日期</div><input type="date" className="w-full rounded-xl border border-gray-200 px-3 py-2" defaultValue={profile.startDate} onChange={(e) => { startDateRef.current = e.target.value; }} /></label>
          <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">计划天数</div><input type="number" className="w-full rounded-xl border border-gray-200 px-3 py-2" defaultValue={profile.totalDays} onChange={(e) => { totalDaysRef.current = e.target.value; }} /></label>
          <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">起始体重</div><input type="number" step="0.1" className="w-full rounded-xl border border-gray-200 px-3 py-2" defaultValue={profile.startWeight} onChange={(e) => { startWeightRef.current = e.target.value; }} /></label>
          <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">目标减重 kg</div><input type="number" step="0.1" className="w-full rounded-xl border border-gray-200 px-3 py-2" defaultValue={(profile.startWeight - profile.targetWeight).toFixed(1)} onChange={(e) => { const loss = Number(e.target.value) || 5; targetWeightRef.current = Number((profile.startWeight - loss).toFixed(1)); }} /></label>
          <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">目标体重</div><input type="number" step="0.1" className="w-full rounded-xl border border-gray-200 px-3 py-2" defaultValue={profile.targetWeight} onChange={(e) => { targetWeightRef.current = e.target.value; }} /></label>
          <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">结束日期（联动）</div><div className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">{planEndDate}</div></label>
        </div>
        <button onClick={handleSave} className="mt-4 w-full rounded-2xl bg-gray-900 px-4 py-3 font-medium text-white">保存设置</button>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between"><div><div className="text-lg font-semibold">AI 热量估算预留</div><div className="text-sm text-gray-500">当前仍以手动模板为主</div></div><Sparkles className="h-5 w-5 text-gray-400" /></div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 rounded-2xl bg-gray-50 px-3 py-3"><input type="checkbox" checked={ai.enabled} onChange={(e) => updateAI("enabled", e.target.checked)} /><span className="text-sm">启用预留配置</span></label>
          <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">Provider</div><input className="w-full rounded-xl border border-gray-200 px-3 py-2" value={ai.provider} onChange={(e) => updateAI("provider", e.target.value)} /></label>
          <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">Endpoint</div><input className="w-full rounded-xl border border-gray-200 px-3 py-2" value={ai.endpoint} onChange={(e) => updateAI("endpoint", e.target.value)} placeholder="后续接你自己的服务或代理" /></label>
          <label className="rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">Model</div><input className="w-full rounded-xl border border-gray-200 px-3 py-2" value={ai.model} onChange={(e) => updateAI("model", e.target.value)} placeholder="例如千帆里的模型名" /></label>
          <label className="col-span-2 rounded-2xl bg-gray-50 p-3"><div className="mb-1 text-sm text-gray-500">API Key（占位）</div><input className="w-full rounded-xl border border-gray-200 px-3 py-2" value={ai.apiKey} onChange={(e) => updateAI("apiKey", e.target.value)} placeholder="当前仅预留，不会直接调用" /></label>
        </div>
        <div className="mt-3 rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800">当前版本已经是可部署的前端 SPA，本地状态可联动。后续如果要云同步，优先建议轻量方案：Cloudflare D1 / KV 或 SQLite/Turso，不需要上常规重数据库。</div>
      </GlassCard>

      <GlassCard>
        <div className="mb-3 text-lg font-semibold">云端同步</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">同步状态</span>
            <span className={`text-sm font-medium ${
              syncStatus === 'synced' ? 'text-emerald-600' :
              syncStatus === 'syncing' || syncStatus === 'loading' ? 'text-blue-600' :
              syncStatus === 'error' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {syncStatus === 'idle' && '就绪'}
              {syncStatus === 'syncing' && '同步中...'}
              {syncStatus === 'loading' && '加载中...'}
              {syncStatus === 'synced' && '已同步'}
              {syncStatus === 'error' && '同步失败'}
            </span>
          </div>
          <label className="block rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">用户ID（多设备同步用）</div>
            <input 
              className="w-full rounded-xl border border-gray-200 px-3 py-2" 
              value={userId} 
              onChange={(e) => {
                setUserId(e.target.value);
                localStorage.setItem('user_id', e.target.value);
              }} 
              placeholder="输入相同ID可在多设备同步"
            />
          </label>
          {syncError && (
            <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              {syncError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={syncFromCloud} className="flex items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 font-medium text-gray-700 hover:bg-gray-200">
              <Upload className="h-4 w-4" /> 从云端加载
            </button>
            <button onClick={() => syncToCloud(state)} className="flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 font-medium text-white hover:bg-gray-800">
              <Download className="h-4 w-4" /> 同步到云端
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-3 text-lg font-semibold">备份</div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={exportData} className="flex items-center justify-center gap-2 rounded-3xl bg-gray-900 px-4 py-3 font-medium text-white"><Download className="h-4 w-4" /> 导出备份</button>
          <button onClick={() => importRef.current?.click()} className="flex items-center justify-center gap-2 rounded-3xl bg-white px-4 py-3 font-medium text-gray-900 ring-1 ring-black/10"><Upload className="h-4 w-4" /> 导入备份</button>
          <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={importData} />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-2 text-lg font-semibold">近14天趋势</div>
        <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" fontSize={12} /><YAxis yAxisId="left" fontSize={12} domain={["dataMin - 1", "dataMax + 1"]} /><YAxis yAxisId="right" orientation="right" fontSize={12} /><Tooltip /><Line yAxisId="left" type="monotone" dataKey="weight" strokeWidth={2.5} dot={false} connectNulls /><Line yAxisId="left" type="monotone" dataKey="avg7" strokeWidth={3.5} dot={false} connectNulls /><Line yAxisId="right" type="monotone" dataKey="walk" strokeWidth={2} dot={false} connectNulls /></LineChart></ResponsiveContainer></div>
      </GlassCard>

      <GlassCard className="border-red-200 bg-red-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-red-900">重新初始化计划</div>
            <div className="text-sm text-red-700">清空所有数据，回到第1天重新开始</div>
          </div>
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <button onClick={() => setShowResetModal(true)} className="mt-4 w-full rounded-2xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 active:bg-red-800 transition-colors">重新初始化</button>
      </GlassCard>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">确认重置？</div>
                <div className="text-sm text-gray-500">此操作不可撤销</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-700 leading-relaxed">
              重置后将清空所有打卡记录和体重数据，回到第1天重新开始。当前进度和 history 将全部丢失。
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowResetModal(false)} className="flex-1 rounded-2xl bg-gray-100 px-4 py-3 font-medium text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors">取消</button>
              <button onClick={handleReset} className="flex-1 rounded-2xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 active:bg-red-800 transition-colors">确认重置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-md px-4 pb-28 pt-4">
        {activeTab === "home" && <HomePage />}
        {activeTab === "checkin" && <CheckinPage />}
        {activeTab === "plan" && <PlanPage />}
        {activeTab === "weekly" && <WeeklyPage />}
        {activeTab === "settings" && <SettingsPage />}
      </div>
      <div className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <NavButton active={activeTab === "home"} icon={Home} label="首页" onClick={() => setState((prev) => ({ ...prev, activeTab: "home", selectedDate: prev.activeDate }))} />
          <NavButton active={activeTab === "checkin"} icon={ClipboardCheck} label="打卡" onClick={() => setState((prev) => ({ ...prev, activeTab: "checkin", selectedDate: prev.activeDate }))} />
          <NavButton active={activeTab === "plan"} icon={Target} label="计划" onClick={() => setState((prev) => ({ ...prev, activeTab: "plan" }))} />
          <NavButton active={activeTab === "weekly"} icon={BarChart3} label="周总结" onClick={() => setState((prev) => ({ ...prev, activeTab: "weekly", selectedWeek: currentWeek }))} />
          <NavButton active={activeTab === "settings"} icon={Settings} label="设置" onClick={() => setState((prev) => ({ ...prev, activeTab: "settings" }))} />
        </div>
      </div>
    </div>
  );
}
