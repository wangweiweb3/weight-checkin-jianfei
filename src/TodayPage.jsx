import React, { useState, useEffect, useMemo } from "react";
import { CircularProgress } from "./App";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Scale,
  Flame,
  TrendingDown,
  Zap,
  Utensils,
  Dumbbell,
} from "lucide-react";

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function anyExerciseDone(log) {
  return Boolean(log?.walkDone || log?.sitStandDone || log?.wallPushupDone || log?.stretchDone);
}

function isDayComplete(log) {
  return Boolean(
    log?.weight !== "" && log.weight != null &&
      log?.breakfastDone && log?.lunchDone && log?.dinnerDone && anyExerciseDone(log)
  );
}

function calcCompleted(log) {
  return [log.weight !== "" && log.weight != null, log.breakfastDone, log.lunchDone, log.dinnerDone, anyExerciseDone(log)].filter(Boolean).length;
}

const TOTAL_ITEMS = 5;

function groupMealCalories(entries) {
  const totals = { breakfast: 0, lunch: 0, dinner: 0, snack: 0, total: 0 };
  (entries || []).forEach((e) => {
    const total = (e.kcalPerUnit || 0) * (e.qty || 1);
    if (e.mealType) totals[e.mealType] = (totals[e.mealType] || 0) + total;
    totals.total += total;
  });
  return totals;
}

function getFoodAdvice(log, profile) {
  const walkedEnough = Number(log?.walkMinutes || 0) >= 25 || Boolean(log?.walkDone) || Boolean(log?.briskWalkDone);
  const min = walkedEnough ? profile.minCaloriesWalk : profile.minCaloriesNoWalk;
  const max = walkedEnough ? profile.maxCaloriesWalk : profile.maxCaloriesNoWalk;
  const totals = groupMealCalories(log.mealEntries);
  if (totals.total === 0) return "还没有记录食物，先填一下今天的三餐吧。";
  if (totals.total > max) return `今天摄入 ${totals.total} kcal，超过目标上限 ${max} kcal。明天试着减少高热量食物或控制分量。`;
  if (totals.total < min) return `今天摄入 ${totals.total} kcal，低于目标下限 ${min} kcal。适当加一点牛奶/水果/酸奶，避免过度节食。`;
  return `今天摄入 ${totals.total} kcal，在目标 ${min}–${max} kcal 范围内，继续保持。`;
}

const EXERCISE_LIST = [
  { key: "walkDone", label: "步行", icon: "🚶" },
  { key: "sitStandDone", label: "站起", icon: "🪑" },
  { key: "wallPushupDone", label: "俯卧撑", icon: "💪" },
  { key: "stretchDone", label: "拉伸", icon: "🧘" },
];

const MEAL_CONFIG = [
  { key: "breakfast", label: "早餐", doneKey: "breakfastDone", icon: "🌅", time: "6-9" },
  { key: "lunch", label: "午餐", doneKey: "lunchDone", icon: "☀️", time: "11-13" },
  { key: "dinner", label: "晚餐", doneKey: "dinnerDone", icon: "🌙", time: "17-19" },
];

export default function TodayPage({
  profile, selectedDate, selectedLog, selectedIndex, planDates,
  onUpdateLog, onToggleExercise, onGoDate, onSetSelectedDate, onFinalizeDay,
  chartData, currentWeight, lossSoFar, planTitle, planEndDate,
  homeDailyScore, cumulativeCalorieAdvice, maxReachedDate,
}) {
  const [localWeight, setLocalWeight] = useState(selectedLog.weight);
  const [savedFields, setSavedFields] = useState({});
  const [justToggled, setJustToggled] = useState(null);
  const [mealModal, setMealModal] = useState(null);
  const [mealModalFood, setMealModalFood] = useState("");
  const [mealModalKcal, setMealModalKcal] = useState("");
  const [mealModalError, setMealModalError] = useState("");

  useEffect(() => {
    setLocalWeight(selectedLog.weight);
    setSavedFields({});
    setMealModal(null);
    setMealModalFood("");
    setMealModalKcal("");
    setMealModalError("");
  }, [selectedDate, selectedLog.weight]);

  useEffect(() => {
    if (!justToggled) return;
    const timer = setTimeout(() => setJustToggled(null), 600);
    return () => clearTimeout(timer);
  }, [justToggled]);

  useEffect(() => {
    const keys = Object.keys(savedFields);
    if (!keys.length) return;
    const timer = setTimeout(() => setSavedFields({}), 1200);
    return () => clearTimeout(timer);
  }, [savedFields]);

  const handleWeightBlur = () => {
    onUpdateLog({ weight: localWeight === "" ? "" : Number(localWeight) });
    setSavedFields((prev) => ({ ...prev, weight: true }));
  };

  const handleExerciseToggle = (key) => {
    onToggleExercise(selectedDate, key);
    setJustToggled(key);
  };

  const openMealModal = (mealKey, mealLabel) => {
    setMealModal({ key: mealKey, label: mealLabel });
    setMealModalFood("");
    setMealModalKcal("");
    setMealModalError("");
  };

  const confirmMealCheckIn = () => {
    if (!mealModal) return;
    const foodName = mealModalFood.trim();
    const kcalVal = mealModalKcal.trim();
    if (!foodName) { setMealModalError("请输入食物内容"); return; }
    if (!kcalVal || Number(kcalVal) <= 0) { setMealModalError("请输入卡路里数值（必须大于0）"); return; }
    const kcal = Number(kcalVal);
    const entry = { id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, mealType: mealModal.key, name: foodName, qty: 1, kcalPerUnit: kcal, totalKcal: kcal };
    const newEntries = [...(selectedLog.mealEntries || []), entry];
    const doneKey = mealModal.key === "breakfast" ? "breakfastDone" : mealModal.key === "lunch" ? "lunchDone" : "dinnerDone";
    onUpdateLog({ mealEntries: newEntries, [doneKey]: true }, { skipAutoAdvance: true });
    setMealModal(null);
  };

  const skipMeal = () => {
    if (!mealModal) return;
    const doneKey = mealModal.key === "breakfast" ? "breakfastDone" : mealModal.key === "lunch" ? "lunchDone" : "dinnerDone";
    onUpdateLog({ [doneKey]: true }, { skipAutoAdvance: true });
    setMealModal(null);
  };

  const mealTotals = useMemo(() => groupMealCalories(selectedLog.mealEntries), [selectedLog.mealEntries]);
  const foodAdvice = useMemo(() => getFoodAdvice(selectedLog, profile), [selectedLog, profile]);
  const walkedEnough = Number(selectedLog?.walkMinutes || 0) >= 25 || Boolean(selectedLog?.walkDone) || Boolean(selectedLog?.briskWalkDone);
  const [minKcal, maxKcal] = walkedEnough ? [profile.minCaloriesWalk, profile.maxCaloriesWalk] : [profile.minCaloriesNoWalk, profile.maxCaloriesNoWalk];
  const overCalories = mealTotals.total > maxKcal;
  const underCalories = mealTotals.total > 0 && mealTotals.total < minKcal;

  const completedCount = useMemo(() => calcCompleted(selectedLog), [selectedLog]);
  const progressPct = Math.round((completedCount / TOTAL_ITEMS) * 100);

  const canGoPrev = selectedIndex > 0;
  const nextDate = planDates[selectedIndex + 1];
  const canGoNext = selectedIndex < planDates.length - 1 && nextDate <= maxReachedDate;
  const dayComplete = useMemo(() => isDayComplete(selectedLog), [selectedLog]);

  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const dateObj = new Date(selectedDate + "T00:00:00");
  const weekdayStr = weekdays[dateObj.getDay()];
  const monthStr = `${dateObj.getMonth() + 1}月`;
  const dayStr = `${dateObj.getDate()}日`;

  const caloriePct = maxKcal > 0 ? Math.min(100, Math.round((mealTotals.total / maxKcal) * 100)) : 0;

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[28px] bg-mesh p-5">
        <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-accent/8 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-cyan/6 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <button onClick={() => onGoDate(-1)} disabled={!canGoPrev}
            className={`rounded-xl p-2 transition-all duration-200 ${canGoPrev ? "bg-surface-3 hover:bg-surface-4 active:scale-95" : "opacity-20 cursor-not-allowed"}`}
            aria-label="上一天">
            <ChevronLeft className="h-5 w-5 text-sub" />
          </button>
          <div className="text-center">
            <div className="text-base font-bold text-text-primary">{monthStr}{dayStr}<span className="ml-1.5 text-xs font-medium text-text-muted">{weekdayStr}</span></div>
            <div className="mt-0.5 text-[11px] font-semibold text-gradient-accent">第 {selectedIndex + 1} / {profile.totalDays} 天</div>
          </div>
          <button onClick={() => onGoDate(1)} disabled={!canGoNext}
            className={`rounded-xl p-2 transition-all duration-200 ${canGoNext ? "bg-surface-3 hover:bg-surface-4 active:scale-95" : "opacity-20 cursor-not-allowed"}`}
            aria-label="下一天">
            <ChevronRight className="h-5 w-5 text-sub" />
          </button>
        </div>

        <div className="relative mt-6 flex items-center justify-center">
          <CircularProgress value={progressPct} size={140} strokeWidth={10} gradient={dayComplete ? "emerald" : "violet"}>
            <span className="text-3xl font-black text-text-primary">{completedCount}</span>
            <span className="text-[11px] text-text-muted">/ {TOTAL_ITEMS} 完成</span>
          </CircularProgress>
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-2xl bg-surface-1 py-3">
            <Scale className="h-3.5 w-3.5 text-hint mb-1" />
            <div className="text-lg font-black text-text-primary">{currentWeight ?? "—"}</div>
            <div className="text-[10px] text-text-muted">当前 kg</div>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-surface-1 py-3">
            <TrendingDown className="h-3.5 w-3.5 text-success/50 mb-1" />
            <div className="text-lg font-black text-success">{lossSoFar > 0 ? `-${lossSoFar}` : "0"}</div>
            <div className="text-[10px] text-text-muted">已减 kg</div>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-surface-1 py-3">
            <Zap className="h-3.5 w-3.5 text-warning/50 mb-1" />
            <div className="text-lg font-black text-text-primary">{profile.targetWeight}</div>
            <div className="text-[10px] text-text-muted">目标 kg</div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
            <Scale className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-sm font-semibold text-on-surface">今日体重</span>
          {savedFields.weight && (
            <span className="ml-auto rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success">已保存</span>
          )}
        </div>
        <div className="relative">
          <input type="text" inputMode="decimal"
            className={`w-full rounded-xl bg-bg-input border-2 px-4 py-3 text-center text-2xl font-black text-text-primary placeholder:text-hint transition-all duration-300 ${savedFields.weight ? "border-success/40" : "border-border focus:border-accent/40"}`}
            value={localWeight}
            onChange={(e) => { const val = e.target.value; if (val === "" || /^\d*\.?\d*$/.test(val)) setLocalWeight(val); }}
            onBlur={handleWeightBlur}
            placeholder="0.0" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-hint">kg</span>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
            <Utensils className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-sm font-semibold text-on-surface">三餐打卡</span>
        </div>

        <div className="space-y-2">
          {MEAL_CONFIG.map(({ key, label, doneKey, icon, time }) => {
            const done = Boolean(selectedLog[doneKey]);
            return (
              <button key={key} onClick={() => !done && openMealModal(key, label)} disabled={done}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-300 active:scale-[0.98] ${
                  done
                    ? "bg-success-soft border border-success/20"
                    : "bg-surface-1 border border-border hover:bg-surface-2 hover:border-surface-3"
                }`}>
                <span className="text-xl">{icon}</span>
                <div className="flex-1 text-left">
                  <div className={`text-sm font-semibold ${done ? "text-success" : "text-on-surface"}`}>{label}</div>
                  <div className="text-[10px] text-hint">{time}点</div>
                </div>
                {done ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  </div>
                ) : (
                  <div className="rounded-full bg-surface-2 px-3 py-1 text-[10px] font-semibold text-text-muted">打卡</div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl bg-bg-input p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-warning" />
              <span className="text-sm font-bold text-text-primary">{mealTotals.total}</span>
              <span className="text-[10px] text-text-muted">kcal</span>
            </div>
            <div className="text-[10px] text-hint">目标 {minKcal}–{maxKcal}</div>
          </div>
          <div className="h-1.5 rounded-full bg-progress-track overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ease-out ${overCalories ? "bg-gradient-to-r from-warning to-danger" : underCalories ? "bg-gradient-to-r from-warning to-warning/60" : "bg-gradient-to-r from-success to-cyan"}`}
              style={{ width: `${caloriePct}%` }} />
          </div>
          <div className="mt-2 text-[11px] text-center">
            {overCalories ? <span className="text-danger font-semibold">超出 {mealTotals.total - maxKcal} kcal</span>
              : underCalories ? <span className="text-warning font-semibold">低于下限 {minKcal - mealTotals.total} kcal</span>
              : <span className="text-success font-semibold">达标</span>}
          </div>
          <div className="mt-1.5 text-[10px] text-hint leading-relaxed">{foodAdvice}</div>
          {cumulativeCalorieAdvice && (
            <div className={`mt-2 rounded-lg px-3 py-2 text-[11px] font-semibold ${cumulativeCalorieAdvice.includes('超过') ? 'bg-danger-soft text-danger' : cumulativeCalorieAdvice.includes('低于') ? 'bg-success-soft text-success' : 'bg-cyan-soft text-cyan'}`}>
              {cumulativeCalorieAdvice}
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-soft">
            <Dumbbell className="h-3.5 w-3.5 text-violet" />
          </div>
          <span className="text-sm font-semibold text-on-surface">运动打卡</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {EXERCISE_LIST.map(({ key, label, icon }) => {
            const done = Boolean(selectedLog[key]);
            return (
              <button key={key} onClick={() => handleExerciseToggle(key)}
                className={`flex flex-col items-center justify-center rounded-xl py-3 transition-all duration-300 active:scale-95 ${
                  done
                    ? "bg-violet-soft border border-violet/25"
                    : "bg-surface-1 border border-border hover:bg-surface-2"
                }`}>
                <span className="text-lg">{icon}</span>
                <span className={`text-[10px] font-semibold mt-1 ${done ? "text-violet" : "text-text-muted"}`}>{label}</span>
                {done && <CheckCircle2 className="mt-0.5 h-3 w-3 text-violet" />}
              </button>
            );
          })}
        </div>
      </div>

      {mealModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-overlay backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl glass-elevated p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-soft">
                  <Utensils className="h-4 w-4 text-accent" />
                </div>
                <span className="text-base font-bold text-text-primary">{mealModal.label}打卡</span>
              </div>
              <button onClick={() => setMealModal(null)} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-3 transition-all" aria-label="关闭">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">食物内容</div>
                <input type="text" className="w-full rounded-xl bg-bg-input border-2 border-border px-3.5 py-3 text-sm text-text-primary placeholder:text-hint focus:border-accent/40 transition-colors" value={mealModalFood} onChange={(e) => setMealModalFood(e.target.value)} placeholder="例如：米饭、鸡蛋" />
              </div>
              <div>
                <div className="mb-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">卡路里 (kcal)</div>
                <input type="text" inputMode="numeric" className="w-full rounded-xl bg-bg-input border-2 border-border px-3.5 py-3 text-sm text-text-primary placeholder:text-hint focus:border-accent/40 transition-colors" value={mealModalKcal} onChange={(e) => { const val = e.target.value; if (val === "" || /^\d*$/.test(val)) setMealModalKcal(val); }} placeholder="估算热量" />
              </div>
              {mealModalError && <div className="rounded-lg bg-danger-soft border border-danger/20 px-3 py-2 text-[11px] text-danger font-medium">{mealModalError}</div>}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button onClick={skipMeal} className="rounded-xl bg-surface-1 border border-border px-4 py-3 text-sm font-semibold text-text-muted hover:bg-surface-2 transition-all active:scale-95">本餐没吃</button>
                <button onClick={confirmMealCheckIn} className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white glow-accent transition-all active:scale-95">确认打卡</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 pt-3 pb-4 bg-gradient-to-t from-bg-primary via-bg-primary/95 to-transparent -mx-4 px-4">
        <button onClick={onFinalizeDay} disabled={dayComplete && selectedIndex >= planDates.length - 1}
          className={`w-full rounded-2xl py-4 font-bold text-base transition-all duration-300 active:scale-[0.98] ${
            dayComplete
              ? "bg-success text-white glow-success"
              : "bg-accent text-white glow-accent hover:opacity-90"
          }`}>
          {dayComplete ? <span className="flex items-center justify-center gap-2"><CheckCircle2 className="h-5 w-5" />今日已完成</span> : `完成今天 (${completedCount}/${TOTAL_ITEMS})`}
        </button>
      </div>
    </div>
  );
}
