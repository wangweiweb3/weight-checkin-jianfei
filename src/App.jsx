
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
  Sparkles,
  PanelTop,
} from "lucide-react";
import SettingsPage from "./SettingsPage";
import TodayPage from "./TodayPage";
import WaterPage from "./WaterPage";
import { FOOD_PRESETS, EXERCISE_OPTIONS, PLAN_DATA, STORAGE_KEY, DEFAULT_PROFILE, PLATEAU_DAYS_THRESHOLD } from "./constants";

// 避免直接修改常量
const getFoodPresets = () => [...FOOD_PRESETS];
const getExerciseOptions = () => [...EXERCISE_OPTIONS];
const getPlanData = () => ({...PLAN_DATA});

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
    log?.weight !== "" && log?.weight != null &&
      log?.breakfastDone &&
      log?.lunchDone &&
      log?.dinnerDone &&
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

function groupMealCalories(entries) {
  const totals = { breakfast: 0, lunch: 0, dinner: 0, snack: 0, total: 0 };
  (entries || []).forEach((e) => {
    const total = (e.kcalPerUnit || 0) * (e.qty || 1);
    if (e.mealType) {
      totals[e.mealType] = (totals[e.mealType] || 0) + total;
    }
    totals.total += total;
  });
  return totals;
}

function overCaloriesForDate(date, logs, profile) {
  const log = logs[date];
  if (!log) return false;
  const [min, max] = getDailyTarget(profile, log);
  const totals = groupMealCalories(log.mealEntries);
  return totals.total > max;
}

function underCaloriesForDate(date, logs, profile) {
  const log = logs[date];
  if (!log) return false;
  const [min, max] = getDailyTarget(profile, log);
  const totals = groupMealCalories(log.mealEntries);
  return totals.total > 0 && totals.total < min;
}

function getFoodAdvice(log, profile) {
  const [min, max] = getDailyTarget(profile, log);
  const totals = groupMealCalories(log.mealEntries);
  if (totals.total === 0) return "还没有记录食物，先填一下今天的三餐吧。";
  if (totals.total > max) return `今天摄入 ${totals.total} kcal，超过目标上限 ${max} kcal。明天试着减少高热量食物或控制分量。`;
  if (totals.total < min) return `今天摄入 ${totals.total} kcal，低于目标下限 ${min} kcal。适当加一点牛奶/水果/酸奶，避免过度节食。`;
  return `今天摄入 ${totals.total} kcal，在目标 ${min}–${max} kcal 范围内，继续保持。`;
}

function getCumulativeCalorieAdvice(logs, planDates, currentIndex) {
  const datesToCheck = planDates.slice(0, currentIndex + 1);
  let totalCalories = 0;
  let loggedDays = 0;
  datesToCheck.forEach((date) => {
    const log = logs[date];
    if (log) {
      loggedDays += 1;
      const totals = groupMealCalories(log.mealEntries);
      totalCalories += totals.total;
    }
  });
  if (loggedDays === 0) return "";
  const targetTotal = loggedDays * 1500;
  const diff = totalCalories - targetTotal;
  if (diff > 0) {
    return `你当前打卡${loggedDays}天的总热量超过上限${diff}卡，请减少摄入`;
  } else if (diff < 0) {
    return `你当前打卡${loggedDays}天的总热量低于上限${Math.abs(diff)}卡，加油继续保持`;
  }
  return `你当前打卡${loggedDays}天的总热量正好等于目标${targetTotal}卡，完美`;
}

function getDefaultState() {
  const startDate = todayStr();
  return {
    profile: {
      startDate,
      startWeight: 80,
      targetWeight: 75,
      totalDays: 120,
      minCaloriesNoWalk: 1200,
      maxCaloriesNoWalk: 1500,
      minCaloriesWalk: 1300,
      maxCaloriesWalk: 1500,
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
    activeTab: "today",
    selectedWeek: 1,
    homeExerciseKey: "walkDone",
    lastAutoAdvanceNote: "",
    rolloverNotice: "",
    lastSeenDate: startDate,
  };
}

function buildRolloverNotice(fromDate, toDate, logs, profile) {
  if (!fromDate || fromDate >= toDate) return "";
  let cursor = fromDate;
  let incompleteDays = 0;
  while (cursor < toDate) {
    const log = logs[cursor] || getDefaultLog();
    if (!isDayComplete(log, profile)) incompleteDays += 1;
    cursor = addDays(cursor, 1);
  }
  if (incompleteDays === 0) return `已自动切换到 ${toDate}`;
  return `已切换到 ${toDate}。过去 ${incompleteDays} 天未完成。`;
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

export function GlassCard({ children, className = "" }) {
  return <div className={`glass rounded-2xl p-4 ${className}`}>{children}</div>;
}

export function CircularProgress({ value, size = 120, strokeWidth = 8, gradient = "emerald", children }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const gradients = {
    emerald: { from: "#34d399", to: "#22d3ee" },
    blue: { from: "#3b82f6", to: "#22d3ee" },
    violet: { from: "#8b5cf6", to: "#d946ef" },
    orange: { from: "#fb923c", to: "#f43f5e" },
  };
  const g = gradients[gradient] || gradients.emerald;
  const id = `grad-${gradient}-${size}`;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={g.from} />
            <stop offset="100%" stopColor={g.to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`url(#${id})`} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function MetricCard({ title, value, sub, icon: Icon, tone = "light" }) {
  const tones = {
    light: "bg-surface-1 border-white/6",
    success: "bg-success-soft border-success/20",
    warn: "bg-warning-soft border-warning/20",
    danger: "bg-danger-soft border-danger/20",
  };
  const textColors = {
    light: "text-text-primary",
    success: "text-success",
    warn: "text-warning",
    danger: "text-danger",
  };
  return (
    <div className={`glass rounded-2xl p-4 ${tone !== 'light' ? tones[tone] : ''}`}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{title}</div>
        <Icon className="h-4 w-4 text-hint" />
      </div>
      <div className={`mt-2 text-xl font-black tracking-tight ${textColors[tone] || textColors.light}`}>{value}</div>
      <div className="mt-1 text-[10px] text-text-secondary">{sub}</div>
    </div>
  );
}

function NavButton({ active, icon: Icon, label, onClick, ...props }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-semibold transition-all duration-300 active:scale-95 ${
        active
          ? "bg-accent-soft text-accent border border-accent/20"
          : "text-white/25 hover:text-text-secondary hover:bg-white/4"
      }`}
      aria-label={label}
      {...props}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

const CLOUD_SYNC_ENABLED = true;
const API_BASE_URL = '';

export default function App() {
  const [state, setState] = useState(getDefaultState);
  const [showResetModal, setShowResetModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [userId, setUserId] = useState('default');
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('');
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [missingModalItems, setMissingModalItems] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importModalMessage, setImportModalMessage] = useState('');
  const [importModalType, setImportModalType] = useState('success');
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionModalItems, setCorrectionModalItems] = useState([]);
  const [showAdvanceDayModal, setShowAdvanceDayModal] = useState(false);
  const [advanceDayTarget, setAdvanceDayTarget] = useState(null);
  const [advanceDayIsFinalize, setAdvanceDayIsFinalize] = useState(false);
  const importRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('app-theme') || 'dark';
    } catch { return 'dark'; }
  });

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('app-theme', next); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
  const [isSyncing, setIsSyncing] = useState(false);

  const syncToCloud = async (data) => {
    if (!CLOUD_SYNC_ENABLED || isSyncing || !API_BASE_URL) return;
    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncError('');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/data?userId=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } else {
        const errorText = await response.text();
        setSyncError(`同步失败: ${response.status} ${errorText}`);
        setSyncStatus('error');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setSyncError('同步超时，请检查网络');
      } else {
        setSyncError(`网络错误: ${error.message}`);
      }
      console.error('Sync error:', error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const syncFromCloud = async () => {
    if (!CLOUD_SYNC_ENABLED || isSyncing || !API_BASE_URL) return;
    setIsSyncing(true);
    setSyncStatus('loading');
    setSyncError('');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/data?userId=${userId}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const cloudData = await response.json();
        if (cloudData && Object.keys(cloudData).length > 0) {
          setState(prev => {
            const localTimestamp = prev.lastModified || 0;
            const cloudTimestamp = cloudData.lastModified || 0;
            
            if (!prev.lastModified && cloudTimestamp === 0) {
              setSyncError('检测到旧版本数据，建议先导出备份再同步');
              return prev;
            } else if (cloudTimestamp > localTimestamp) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
              return { ...getDefaultState(), ...cloudData };
            } else if (cloudTimestamp < localTimestamp) {
              setSyncError('本地数据较新，是否覆盖？（请先导出备份）');
              return prev;
            }
            return prev;
          });
        }
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } else {
        const errorText = await response.text();
        setSyncError(`加载失败: ${response.status} ${errorText}`);
        setSyncStatus('error');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setSyncError('加载超时，请检查网络');
      } else {
        setSyncError(`网络错误: ${error.message}`);
      }
      console.error('Load from cloud error:', error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
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
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (CLOUD_SYNC_ENABLED) {
      syncFromCloud();
    }
  }, []);

  useEffect(() => {
    try {
      const stateWithTimestamp = {
        ...state,
        lastModified: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp));
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
  const maxReachedDate = useMemo(() => {
    const allLoggedDates = Object.keys(logs).sort();
    const furthest = allLoggedDates.length ? allLoggedDates[allLoggedDates.length - 1] : activeDate;
    const _planEndDate = planDates[planDates.length - 1];
    return furthest > _planEndDate ? _planEndDate : furthest;
  }, [logs, activeDate, planDates]);
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
  const plateau = activeIndex >= PLATEAU_DAYS_THRESHOLD && weeklyAvgNow != null && weeklyAvgPrev != null ? weeklyAvgPrev - weeklyAvgNow < 0.2 : false;

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
          : `当前比计划慢 ${paceGap} kg，优先控制饮食和运动。`;
    return `${trendPart} ${startPart} ${pacePart}`;
  }, [dayChange, remainingToGoal, paceGap, planEndDate]);

  const homeDailyScore = useMemo(() => {
    const checks = [
      activeLog.weight !== "" && activeLog.weight != null,
      activeLog.breakfastDone,
      activeLog.lunchDone,
      activeLog.dinnerDone,
      anyExerciseDone(activeLog),
    ];
    return { score: checks.filter(Boolean).length, max: checks.length };
  }, [activeLog]);

  const updateLogForDate = (date, patchOrUpdater, options = {}) => {
    setState((prev) => {
      const currentLog = prev.logs[date] || getDefaultLog();
      const nextLog =
        typeof patchOrUpdater === "function"
          ? patchOrUpdater(currentLog)
          : { ...currentLog, ...patchOrUpdater };
      const nextLogs = { ...prev.logs, [date]: nextLog };
      // 移除自动切换逻辑，改为必须由用户手动点击"完成今天"按钮触发
      // 唯一例外：时间超过当天23:59:59时自动切换到下一天
      return { ...prev, logs: nextLogs };
    });
  };

  const updateActiveLog = (patchOrUpdater, options = {}) => updateLogForDate(activeDate, patchOrUpdater, options);
  const updateSelectedLog = (patchOrUpdater, options = {}) => updateLogForDate(selectedDate, patchOrUpdater, options);

  const updateProfile = useCallback((key, value) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, [key]: value } }));
  }, []);
  const updateAI = useCallback((key, value) => setState((prev) => ({ ...prev, ai: { ...prev.ai, [key]: value } })), []);
  const setGoalLoss = useCallback((kg) => {
    setState((prev) => ({ 
      ...prev, 
      profile: { 
        ...prev.profile, 
        targetWeight: Number((prev.profile.startWeight - (Number(kg) || 0)).toFixed(1)) 
      } 
    }));
  }, []);

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

  const handleGoDateForTodayPage = (dir) => {
    const nextIdx = clamp(selectedIndex + dir, 0, planDates.length - 1);
    const nextDate = planDates[nextIdx];
    
    if (dir > 0 && nextDate > maxReachedDate) {
      setAdvanceDayTarget(nextDate);
      setAdvanceDayIsFinalize(false);
      setShowAdvanceDayModal(true);
    } else if (nextDate <= maxReachedDate) {
      setState((prev) => ({ ...prev, activeDate: nextDate, selectedDate: nextDate }));
    }
  };

  const handleGoDateForWaterPage = (dir) => {
    const nextIdx = clamp(selectedIndex + dir, 0, planDates.length - 1);
    const nextDate = planDates[nextIdx];
    if (nextDate <= maxReachedDate) {
      setState((prev) => ({ ...prev, activeDate: nextDate, selectedDate: nextDate }));
    }
  };

  const handleSetSelectedDate = (date) => {
    const currentDate = selectedDate;
    if (date > currentDate) {
      // Forward navigation requires confirmation
      setAdvanceDayTarget(date);
      setAdvanceDayIsFinalize(false);
      setShowAdvanceDayModal(true);
    } else {
      // Backward navigation is allowed directly
      setState(prev => ({ ...prev, activeDate: date, selectedDate: date }));
    }
  };

  const finalizeSelectedDay = () => {
    const log = logs[selectedDate] || getDefaultLog();
    if (!isDayComplete(log, profile)) {
      const missing = [];
      if (log?.weight === "" || log?.weight == null) missing.push("体重");
      if (!log?.breakfastDone) missing.push("早餐");
      if (!log?.lunchDone) missing.push("午餐");
      if (!log?.dinnerDone) missing.push("晚餐");
      if (!anyExerciseDone(log)) missing.push("运动");
      
      setMissingModalItems(missing);
      setShowMissingModal(true);
      return;
    }
    const nextDate = addDays(selectedDate, 1);
    setAdvanceDayTarget(nextDate);
    setAdvanceDayIsFinalize(true);
    setShowAdvanceDayModal(true);
  };

  const confirmAdvanceDay = () => {
    if (!advanceDayTarget) return;
    const nextDate = advanceDayTarget;
    const isFinalize = advanceDayIsFinalize;
    const currentTab = activeTab;
    
    if (isFinalize) {
      setSuccessModalMessage(`${selectedDate} 已完成！\n已切换到第 ${planDates.indexOf(nextDate) + 1} 天：${nextDate}`);
      setShowSuccessModal(true);
    }
    
    setState((prev) => ({
      ...prev,
      logs: { ...prev.logs, [nextDate]: prev.logs[nextDate] || getDefaultLog() },
      activeDate: nextDate,
      selectedDate: nextDate,
      activeTab: currentTab,
      lastAutoAdvanceNote: isFinalize ? `${selectedDate} 已完成，已切换到 ${nextDate}` : `已切换到 ${nextDate}`,
    }));
    setShowAdvanceDayModal(false);
    setAdvanceDayTarget(null);
    setAdvanceDayIsFinalize(false);
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
      const data = JSON.parse(text);
      // 验证数据结构
      if (!data || typeof data !== 'object') {
        throw new Error('无效的数据格式');
      }
      // 验证必需的字段
      if (!data.profile || !data.logs) {
        throw new Error('数据缺少必需的字段（profile 或 logs）');
      }
      // 验证 profile 字段
      if (!data.profile.startDate || !data.profile.totalDays) {
        throw new Error('profile 数据不完整');
      }
      // 合并数据，保留默认状态中的必需字段
      setState({ ...getDefaultState(), ...data });
      setImportModalType('success');
      setImportModalMessage('数据导入成功！');
      setShowImportModal(true);
    } catch (err) {
      setImportModalType('error');
      setImportModalMessage(`导入失败：${err.message || '请选择正确的 JSON 备份文件'}`);
      setShowImportModal(true);
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
    const weekCalories = weekDates.map((d) => {
      const log = logs[d];
      return log ? groupMealCalories(log.mealEntries).total : 0;
    });
    const summaryRows = weekDates.map((d) => {
      const log = logs[d] || getDefaultLog();
      const checks = [
        log.weight !== "" && log.weight != null,
        log.breakfastDone,
        log.lunchDone,
        log.dinnerDone,
        anyExerciseDone(log),
      ];
      return {
        date: d,
        short: d.slice(5),
        weight: log.weight === "" ? null : Number(log.weight),
        walk: Number(log.walkMinutes || 0),
        water: Number(log.water || 0),
        calories: groupMealCalories(log.mealEntries).total,
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
      avgCalories: avg(weekCalories),
      totalCalories: weekCalories.reduce((a, b) => a + b, 0),
      loggedDays: weekDates.filter((d) => logs[d]?.weight !== "").length,
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
    return "这周体重还没明显往下，先检查加餐和外食。";
  }, [weekStats, profile.waterTarget]);

  const cumulativeCalorieAdvice = useMemo(() => getCumulativeCalorieAdvice(logs, planDates, activeIndex), [logs, planDates, activeIndex]);

  const HomePage = () => {
    const currentExerciseDone = Boolean(activeLog[homeExerciseKey]);
    
    const canGoPrevDay = activeIndex > 0;
    const today = todayStr();
    const canGoNextDay = activeIndex < planDates.length - 1 && activeDate < today;
    
    const goPrevDay = () => {
      if (canGoPrevDay) {
        const prevDate = planDates[activeIndex - 1];
        setState(prev => ({ ...prev, activeDate: prevDate, selectedDate: prevDate }));
      }
    };
    
    const goNextDay = () => {
      if (canGoNextDay) {
        const nextDate = planDates[activeIndex + 1];
        setAdvanceDayTarget(nextDate);
        setAdvanceDayIsFinalize(false);
        setShowAdvanceDayModal(true);
      }
    };

    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-[28px] bg-mesh p-5">
          <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-accent/8 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-cyan/6 blur-3xl" />

          <div className="relative flex items-center justify-between">
            <button onClick={goPrevDay} disabled={!canGoPrevDay}
              className={`rounded-xl p-2 transition-all duration-200 ${canGoPrevDay ? "bg-surface-3 hover:bg-surface-4 active:scale-95" : "opacity-20 cursor-not-allowed"}`}>
              <ChevronLeft className="h-5 w-5 text-sub" />
            </button>
            <div className="flex-1 text-center">
              <div className="text-[11px] text-white/40 font-medium">{planTitle}</div>
              <div className="mt-1 text-xl font-black text-white">{activeDate}</div>
              <div className="mt-1 text-[11px] text-text-secondary">当前 {currentWeight} kg · 已减 {lossSoFar > 0 ? lossSoFar : 0} kg · 目标 {profile.targetWeight} kg</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-surface-2 px-3 py-2 text-center">
                <div className="text-[9px] text-text-muted">第</div>
                <div className="text-lg font-black text-white">{activeIndex + 1}<span className="text-xs text-white/30">天</span></div>
              </div>
              <button onClick={goNextDay} disabled={!canGoNextDay}
                className={`rounded-xl p-2 transition-all duration-200 ${canGoNextDay ? "bg-white/8 hover:bg-white/12 active:scale-95" : "opacity-20 cursor-not-allowed"}`}>
                <ChevronRight className="h-5 w-5 text-white/60" />
              </button>
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            <div>
              <div className="mb-1 flex items-center justify-between text-[10px] text-white/30"><span>时间进度</span><span>{Math.round(timeProgress)}%</span></div>
              <div className="h-1.5 rounded-full bg-progress-track"><div className="h-1.5 rounded-full bg-accent transition-all duration-700" style={{ width: `${timeProgress}%` }} /></div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-[10px] text-white/30"><span>体重进度</span><span>{Math.round(weightProgress)}%</span></div>
              <div className="h-1.5 rounded-full bg-white/6"><div className="h-1.5 rounded-full bg-success transition-all duration-700" style={{ width: `${weightProgress}%` }} /></div>
            </div>
          </div>
        </div>

        {rolloverNotice ? <div className="glass rounded-xl px-4 py-3 border-warning/20"><div className="text-[11px] text-warning font-semibold">{rolloverNotice}</div></div> : null}
        {lastAutoAdvanceNote ? <div className="glass rounded-xl px-4 py-3 border-success/20"><div className="text-[11px] text-success font-semibold">{lastAutoAdvanceNote}</div></div> : null}

        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-soft">
              <Sparkles className="h-3.5 w-3.5 text-success" />
            </div>
            <div>
              <div className="text-sm font-semibold text-on-surface">目标反馈</div>
              <div className="text-[11px] text-white/40 mt-0.5">{feedbackText}</div>
            </div>
          </div>
          <div className="text-[10px] text-white/25">按计划，当前执行日的参考体重约 {expectedWeightToday} kg</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard title="7天平均体重" value={weeklyAvgNow != null ? `${weeklyAvgNow.toFixed(1)} kg` : "—"} sub={weeklyDelta == null ? "满2周后显示变化" : weeklyDelta < 0 ? `比上周 ${Math.abs(weeklyDelta).toFixed(1)} kg` : `比上周 +${weeklyDelta.toFixed(1)} kg`} icon={TrendingDown} />
          <MetricCard title="今日完成度" value={`${homeDailyScore.score}/${homeDailyScore.max}`} sub={homeDailyScore.score >= 5 ? "联动正常" : "还有待办"} icon={CheckCircle2} tone={homeDailyScore.score >= 5 ? "success" : "light"} />
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
              <Target className="h-3.5 w-3.5 text-accent" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white/80">今日待办</div>
              <div className="text-[10px] text-white/30">可直接点击完成</div>
            </div>
          </div>
          <div className="space-y-2">
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
            ].map((todo) => (
              <button key={todo.id} onClick={todo.action}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left transition-all duration-300 active:scale-[0.98] ${
                  todo.done
                    ? "bg-success-soft border border-success/20"
                    : "bg-white/3 border border-white/6 hover:bg-white/6 hover:border-white/10"
                }`}>
                <span className="text-sm font-semibold text-white/70">{todo.label}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${todo.done ? "bg-success/20 text-success" : "bg-white/6 text-white/30"}`}>
                  {todo.done ? "✓ 已完成" : "点击完成"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
              <ClipboardCheck className="h-3.5 w-3.5 text-accent" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white/80">一键完成</div>
              <div className="text-[10px] text-white/30">会和打卡页实时联动</div>
            </div>
          </div>
          <button onClick={completeNextMealActive}
            className="w-full rounded-xl bg-bg-input border border-white/6 p-4 text-left hover:bg-white/4 transition-all duration-200 active:scale-[0.98]">
            <div className="text-[10px] text-white/30 uppercase tracking-wider">下一餐次</div>
            <div className="mt-1 text-sm font-bold text-white">{getNextMealLabel(activeLog)}</div>
          </button>
          <div className="mt-3">
            <div className="text-[10px] text-white/30 mb-2">选择运动</div>
            <div className="flex flex-wrap gap-1.5">
              {EXERCISE_OPTIONS.map((item) => (
                <button key={item.key} onClick={() => setState((prev) => ({ ...prev, homeExerciseKey: item.key }))}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 active:scale-95 ${
                    homeExerciseKey === item.key ? "bg-accent text-white" : "bg-white/4 text-white/40 hover:bg-white/8"
                  }`}>
                  {item.label}
                </button>
              ))}
            </div>
            <button onClick={completeSelectedExerciseActive}
              className={`mt-3 w-full rounded-xl py-3 font-bold text-sm transition-all duration-300 active:scale-[0.98] ${
                currentExerciseDone ? "bg-success text-white glow-success" : "bg-accent text-white glow-accent hover:opacity-90"
              }`}>
              {currentExerciseDone ? `✓ ${selectedExercise.label} 已完成` : `一键完成 ${selectedExercise.label}`}
            </button>
          </div>
        </div>

        {plateau ? (
          <div className="rounded-2xl bg-warning-soft border border-warning/15 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-warning" />
              <div>
                <div className="font-semibold text-warning">平台期提醒</div>
                <div className="mt-1 text-[11px] text-warning/60">最近2周下降不明显。先别猛减热量，优先检查无走路日加餐、外食和甜饮料。</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const PlanPage = () => (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
            <Target className="h-3.5 w-3.5 text-accent" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white/80">最终版饮食计划</div>
            <div className="text-[10px] text-white/30">不用再回聊天记录里翻</div>
          </div>
        </div>
      </div>
      {[
        { title: "早餐固定模板", items: PLAN_DATA.breakfast, icon: "🌅" },
        { title: "午餐模板", items: PLAN_DATA.lunch, icon: "☀️" },
        { title: "晚餐模板（不走路日）", items: PLAN_DATA.dinnerNoWalk, icon: "🌙" },
        { title: "晚餐模板（走路日）", items: PLAN_DATA.dinnerWalk, icon: "🌙" },
      ].map(({ title, items, icon }) => (
        <div key={title} className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">{icon}</span>
            <span className="text-sm font-semibold text-white/80">{title}</span>
          </div>
          <div className="space-y-1.5">
            {items.map((item) => <div key={item} className="rounded-lg bg-bg-input px-3 py-2.5 text-[11px] text-white/60 border border-white/4">{item}</div>)}
          </div>
        </div>
      ))}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">⚠️</span>
          <span className="text-sm font-semibold text-warning">尽量避开</span>
        </div>
        <div className="space-y-1.5">
          {PLAN_DATA.avoid.map((item) => <div key={item} className="rounded-lg bg-warning-soft px-3 py-2.5 text-[11px] text-warning border border-warning/10">{item}</div>)}
        </div>
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
            <ShoppingCart className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-sm font-semibold text-white/80">10天采购建议</span>
        </div>
        <div className="space-y-1.5">
          {PLAN_DATA.shopping.map((item) => <div key={item} className="rounded-lg bg-bg-input px-3 py-2.5 text-[11px] text-white/60 border border-white/4">{item}</div>)}
        </div>
      </div>
    </div>
  );

  const WeeklyPage = () => (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
            <CalendarDays className="h-3.5 w-3.5 text-accent" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white/80">每周总结</div>
            <div className="text-[10px] text-white/30">看趋势，不被单日体重吓到</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {Array.from({ length: weekCount }, (_, i) => i + 1).map((week) => (
            <button key={week} onClick={() => setState((prev) => ({ ...prev, selectedWeek: week }))}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-200 active:scale-95 ${
                selectedWeek === week ? "bg-accent text-white" : "bg-white/4 text-white/30 hover:bg-white/8"
              }`}>
              第{week}周
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard title="平均体重" value={weekStats.avgWeight != null ? `${weekStats.avgWeight.toFixed(1)} kg` : "—"} sub={weekStats.deltaVsPrev == null ? "上周数据不足" : weekStats.deltaVsPrev < 0 ? `比上周 ${Math.abs(weekStats.deltaVsPrev).toFixed(1)} kg` : `比上周 +${weekStats.deltaVsPrev.toFixed(1)} kg`} icon={Scale} tone={weekStats.deltaVsPrev != null && weekStats.deltaVsPrev < 0 ? "success" : "light"} />
        <MetricCard title="平均步行" value={weekStats.avgWalk != null ? `${weekStats.avgWalk.toFixed(0)} 分钟` : "—"} sub="越稳定越重要" icon={Footprints} />
        <MetricCard title="平均喝水" value={weekStats.avgWater != null ? `${weekStats.avgWater.toFixed(1)} L` : "—"} sub={`目标 ${profile.waterTarget} L`} icon={Droplets} />
        <MetricCard title="执行率" value={`${weekStats.adherence || 0}%`} sub={`有记录 ${weekStats.loggedDays}/${weekDates.length} 天`} icon={CheckCircle2} tone={weekStats.adherence >= 70 ? "success" : "light"} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard title="平均卡路里" value={weekStats.avgCalories != null ? `${Math.round(weekStats.avgCalories)} kcal` : "—"} sub="目标 ≤1500 kcal/天" icon={Flame} tone={weekStats.avgCalories > 1500 ? "warn" : "success"} />
        <MetricCard title="本周结论" value={weekStats.deltaVsPrev != null && weekStats.deltaVsPrev < 0 ? "在下降" : "继续稳住"} sub={weeklyHint} icon={TrendingDown} tone={weekStats.deltaVsPrev != null && weekStats.deltaVsPrev < 0 ? "success" : "light"} />
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
            <Footprints className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-sm font-semibold text-white/80">本周步行图</span>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekStats.rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="short" fontSize={11} tick={{ fill: 'rgba(255,255,255,0.3)' }} />
              <YAxis fontSize={11} tick={{ fill: 'rgba(255,255,255,0.3)' }} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="walk" radius={[6,6,0,0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
            <CalendarDays className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-sm font-semibold text-white/80">本周明细</span>
        </div>
        <div className="space-y-1.5">
          {weekStats.rows.map((row) => (
            <button key={row.date} onClick={() => setState((prev) => ({ ...prev, selectedDate: row.date, activeTab: "today" }))}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all duration-200 active:scale-[0.98] ${
                row.score >= 5 ? "bg-success-soft border border-success/15" : "bg-white/3 border border-white/6 hover:bg-white/6"
              }`}>
              <div>
                <div className="text-xs font-bold text-white/70">{row.short}</div>
                <div className="text-[10px] text-white/30">体重 {row.weight ?? "—"} · 步行 {row.walk}分钟 · 卡路里 {row.calories}kcal</div>
              </div>
              <div className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${row.score >= 5 ? "bg-success/20 text-success" : "bg-white/6 text-white/30"}`}>
                {row.score}/8
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // 加载状态显示空白或加载指示器，避免闪现首页
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary text-white">
        <div className="mx-auto max-w-md px-4 pb-28 pt-4">
          <div className="flex h-96 items-center justify-center">
            <div className="text-white/20">加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-white">
      <div className="mx-auto max-w-md px-4 pb-28 pt-4">
        {activeTab === "today" && (
          <TodayPage
            profile={profile}
            selectedDate={activeDate}
            selectedLog={activeLog}
            selectedIndex={activeIndex}
            planDates={planDates}
            onUpdateLog={(patch, options = {}) => updateLogForDate(activeDate, patch, options)}
            onToggleExercise={toggleExerciseForDate}
            onGoDate={handleGoDateForTodayPage}
            onSetSelectedDate={handleSetSelectedDate}
            onFinalizeDay={finalizeSelectedDay}
            chartData={chartData}
            currentWeight={currentWeight}
            lossSoFar={lossSoFar}
            planTitle={planTitle}
            planEndDate={planEndDate}
            homeDailyScore={homeDailyScore}
            logs={logs}
            cumulativeCalorieAdvice={cumulativeCalorieAdvice}
            maxReachedDate={maxReachedDate}
          />
        )}
        {activeTab === "water" && (
          <WaterPage
            profile={profile}
            selectedDate={activeDate}
            selectedLog={activeLog}
            selectedIndex={activeIndex}
            planDates={planDates}
            onUpdateLog={(patch, options = {}) => updateLogForDate(activeDate, patch, options)}
            onGoDate={handleGoDateForWaterPage}
            maxReachedDate={maxReachedDate}
          />
        )}
        {activeTab === "plan" && <PlanPage />}
        {activeTab === "weekly" && <WeeklyPage />}
        {activeTab === "settings" && (
          <SettingsPage
            profile={profile}
            ai={ai}
            planEndDate={planEndDate}
            syncStatus={syncStatus}
            syncError={syncError}
            userId={userId}
            onUpdateProfile={updateProfile}
            onUpdateAI={updateAI}
            onSetUserId={(val) => {
              setUserId(val);
              localStorage.setItem('user_id', val);
            }}
            onSyncFromCloud={syncFromCloud}
            onSyncToCloud={() => syncToCloud(state)}
            onExportData={exportData}
            onImportClick={() => importRef.current?.click()}
            onShowResetModal={() => setShowResetModal(true)}
            onShowCorrectionModal={(items) => {
              setCorrectionModalItems(items);
              setShowCorrectionModal(true);
            }}
            importRef={importRef}
            onImportData={importData}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}
      </div>
      
      {/* 重新初始化确认模态框 */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl glass-elevated p-6 animate-scale-in">
            <div className="mb-4 text-center">
              <div className="mb-2 text-2xl">⚠️</div>
              <div className="text-lg font-bold text-white">确认重新初始化？</div>
              <div className="mt-2 text-sm text-white/40">
                这将清空所有数据，回到第1天重新开始。此操作不可恢复！
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowResetModal(false)}
                className="flex-1 rounded-xl bg-white/4 border border-white/8 px-4 py-3 font-semibold text-white/50 hover:bg-white/8 transition-all duration-200 active:scale-95">
                取消
              </button>
              <button onClick={handleReset}
                className="flex-1 rounded-xl bg-danger px-4 py-3 font-semibold text-white glow-danger transition-all duration-200 active:scale-95">
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 打卡完成成功弹窗 */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl glass-elevated p-6 animate-scale-in">
            <div className="mb-4 text-center">
              <div className="mb-2 text-4xl">🎉</div>
              <div className="text-lg font-bold text-white">打卡完成！</div>
              <div className="mt-2 text-sm text-white/40 whitespace-pre-line">
                {successModalMessage}
              </div>
            </div>
            <button onClick={() => setShowSuccessModal(false)}
              className="w-full rounded-xl bg-success px-4 py-3 font-bold text-white glow-success transition-all duration-200 active:scale-95">
              好的
            </button>
          </div>
        </div>
      )}
      
      {/* 打卡未完成提示弹窗 */}
      {showMissingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl glass-elevated p-6 animate-scale-in">
            <div className="mb-4 text-center">
              <div className="mb-2 text-4xl">📋</div>
              <div className="text-lg font-bold text-white">还需完成以下项目：</div>
              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                {missingModalItems.map((item, idx) => (
                  <span key={idx} className="rounded-full bg-warning-soft px-3 py-1 text-sm font-semibold text-warning">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => setShowMissingModal(false)}
              className="w-full rounded-xl bg-white/4 border border-white/8 px-4 py-3 font-semibold text-white/50 hover:bg-white/8 transition-all duration-200 active:scale-95">
              知道了
            </button>
          </div>
        </div>
      )}
      
      {/* 切换下一天确认弹窗 */}
      {showAdvanceDayModal && advanceDayTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl glass-elevated p-6 animate-scale-in">
            <div className="mb-4 text-center">
              <div className="mb-2 text-4xl">📅</div>
              <div className="text-lg font-bold text-white">确认切换到下一天？</div>
              <div className="mt-2 text-sm text-white/40">
                {advanceDayIsFinalize
                  ? `${selectedDate} 打卡已完成，确认切换到 ${advanceDayTarget} 吗？`
                  : `将从 ${selectedDate} 切换到 ${advanceDayTarget}`}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowAdvanceDayModal(false); setAdvanceDayTarget(null); setAdvanceDayIsFinalize(false); }}
                className="flex-1 rounded-xl bg-white/4 border border-white/8 px-4 py-3 font-semibold text-white/50 hover:bg-white/8 transition-all duration-200 active:scale-95">
                取消
              </button>
              <button onClick={confirmAdvanceDay}
                className="flex-1 rounded-xl bg-accent px-4 py-3 font-semibold text-white glow-accent transition-all duration-200 active:scale-95">
                确认切换
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 导入数据结果弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl glass-elevated p-6 animate-scale-in">
            <div className="mb-4 text-center">
              <div className="mb-2 text-4xl">{importModalType === 'success' ? '✅' : '❌'}</div>
              <div className="text-lg font-bold text-white">
                {importModalType === 'success' ? '导入成功' : '导入失败'}
              </div>
              <div className="mt-2 text-sm text-white/40">{importModalMessage}</div>
            </div>
            <button onClick={() => setShowImportModal(false)}
              className={`w-full rounded-xl px-4 py-3 font-bold text-white transition-all duration-200 active:scale-95 ${
                importModalType === 'success'
                  ? 'bg-success glow-success'
                  : 'bg-danger glow-danger'
              }`}>
              好的
            </button>
          </div>
        </div>
      )}
      
      {/* 设置修正提示弹窗 */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl glass-elevated p-6 animate-scale-in">
            <div className="mb-4 text-center">
              <div className="mb-2 text-4xl">⚙️</div>
              <div className="text-lg font-bold text-white">设置已自动修正</div>
              <div className="mt-3 space-y-2">
                {correctionModalItems.map((item, idx) => (
                  <div key={idx} className="rounded-lg bg-warning-soft border border-warning/10 px-3 py-2 text-sm text-warning text-left">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setShowCorrectionModal(false)}
              className="w-full rounded-xl bg-white/4 border border-white/8 px-4 py-3 font-semibold text-white/50 hover:bg-white/8 transition-all duration-200 active:scale-95">
              知道了
            </button>
          </div>
        </div>
      )}
      
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-bg-primary/95 backdrop-blur-xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <nav className="mx-auto flex max-w-md items-center gap-1 px-3 py-2" aria-label="主导航">
          <NavButton active={activeTab === "today"} icon={Home} label="首页" aria-current={activeTab === "today" ? "page" : undefined} onClick={() => setState((prev) => ({ ...prev, activeTab: "today" }))} />
          <NavButton active={activeTab === "water"} icon={Droplets} label="喝水" aria-current={activeTab === "water" ? "page" : undefined} onClick={() => setState((prev) => ({ ...prev, activeTab: "water" }))} />
          <NavButton active={activeTab === "plan"} icon={Target} label="计划" aria-current={activeTab === "plan" ? "page" : undefined} onClick={() => setState((prev) => ({ ...prev, activeTab: "plan" }))} />
          <NavButton active={activeTab === "weekly"} icon={BarChart3} label="周总结" aria-current={activeTab === "weekly" ? "page" : undefined} onClick={() => setState((prev) => ({ ...prev, activeTab: "weekly", selectedWeek: currentWeek }))} />
          <NavButton active={activeTab === "settings"} icon={Settings} label="设置" aria-current={activeTab === "settings" ? "page" : undefined} onClick={() => setState((prev) => ({ ...prev, activeTab: "settings" }))} />
        </nav>
      </div>
    </div>
  );
}
