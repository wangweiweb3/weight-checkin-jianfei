import React, { useState, useEffect, useMemo } from "react";
import { GlassCard, MetricCard } from "./App";
import { ChevronLeft, ChevronRight, UtensilsCrossed, Flame, PanelTop, Trash2, CheckCircle2 } from "lucide-react";
import { FOOD_PRESETS, EXERCISE_OPTIONS } from "./constants";

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function anyExerciseDone(log) {
  return Boolean(
    log?.walkDone ||
      log?.briskWalkDone ||
      log?.sitStandDone ||
      log?.wallPushupDone ||
      log?.stretchDone
  );
}

function calcCompleted(log) {
  const items = [
    log.breakfastDone,
    log.lunchDone,
    log.dinnerDone,
    Number(log.water || 0) > 0,
    anyExerciseDone(log),
  ];
  return items.filter(Boolean).length;
}

const TOTAL_ITEMS = 5;

export default function CheckinPage({
  profile,
  selectedDate,
  selectedLog,
  selectedIndex,
  planDates,
  selectedMinKcal,
  selectedMaxKcal,
  selectedMealTotals,
  onUpdateLog,
  onToggleExercise,
  onGoDate,
  onSetSelectedDate,
  onFinalizeDay,
}) {
  // 本地状态管理输入框
  const [localWeight, setLocalWeight] = useState(selectedLog.weight);
  const [localWater, setLocalWater] = useState(selectedLog.water);
  const [localWalkMinutes, setLocalWalkMinutes] = useState(selectedLog.walkMinutes);
  const [localHeelPain, setLocalHeelPain] = useState(selectedLog.heelPain);
  
  // 食物记录本地状态
  const [foodDraft, setFoodDraft] = useState({
    mealType: "lunch",
    presetId: "milk",
    qty: 1,
    customName: "",
    customKcal: "",
  });

  // 当日期切换时更新本地状态
  useEffect(() => {
    setLocalWeight(selectedLog.weight);
    setLocalWater(selectedLog.water);
    setLocalWalkMinutes(selectedLog.walkMinutes);
    setLocalHeelPain(selectedLog.heelPain);
  }, [selectedDate, selectedLog.weight, selectedLog.water, selectedLog.walkMinutes, selectedLog.heelPain]);

  const handleWeightBlur = () => {
    onUpdateLog({ weight: localWeight === "" ? "" : Number(localWeight) });
  };

  const handleWaterBlur = () => {
    onUpdateLog({ water: localWater === "" ? "" : Number(localWater) });
  };

  const handleWalkMinutesBlur = () => {
    onUpdateLog({ walkMinutes: localWalkMinutes === "" ? "" : Number(localWalkMinutes) });
  };

  const handleHeelPainChange = (val) => {
    setLocalHeelPain(val);
    onUpdateLog({ heelPain: val });
  };

  const handleCheckboxChange = (key, checked) => {
    onUpdateLog({ [key]: checked });
  };

  const addFoodEntry = () => {
    const preset = FOOD_PRESETS.find((f) => f.id === foodDraft.presetId);
    const kcalPerUnit = foodDraft.presetId === "custom" ? Number(foodDraft.customKcal || 0) : preset?.kcal || 0;
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      meal: foodDraft.mealType,
      name: foodDraft.presetId === "custom" ? foodDraft.customName || "自定义" : preset?.name || "未知",
      qty: Number(foodDraft.qty) || 1,
      kcalPerUnit,
      totalKcal: Math.round((Number(foodDraft.qty) || 1) * kcalPerUnit),
    };
    const newEntries = [...(selectedLog.mealEntries || []), entry];
    
    // 如果是全天餐次，自动完成所有三餐打卡
    // 注意：全天餐次只勾选三餐，不触发自动切换下一天（需要用户手动完成其他打卡项）
    const updates = { mealEntries: newEntries };
    if (foodDraft.mealType === "allday") {
      updates.breakfastDone = true;
      updates.lunchDone = true;
      updates.dinnerDone = true;
    }
    
    // 使用 skipAutoAdvance 防止自动切换下一天
    // 只有用户手动点击"完成今天"按钮才能切换
    onUpdateLog(updates, { skipAutoAdvance: true });
    // 重置食物草稿
    setFoodDraft({
      mealType: "lunch",
      presetId: "milk",
      qty: 1,
      customName: "",
      customKcal: "",
    });
  };

  const removeFoodEntry = (id) => {
    const newEntries = (selectedLog.mealEntries || []).filter((e) => e.id !== id);
    onUpdateLog({ mealEntries: newEntries });
  };

  const remainingUpper = Math.max(0, selectedMaxKcal - selectedMealTotals.total);
  const overUpper = Math.max(0, selectedMealTotals.total - selectedMaxKcal);
  const belowMin = Math.max(0, selectedMinKcal - selectedMealTotals.total);

  // 日期导航可用性
  const today = todayStr();
  const planEndDate = planDates[planDates.length - 1];
  const maxAllowedDate = today < planEndDate ? today : planEndDate;
  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex < planDates.length - 1 && selectedDate < maxAllowedDate;

  // 打卡进度
  const completedCount = useMemo(() => calcCompleted(selectedLog), [selectedLog]);
  const progressPct = Math.round((completedCount / TOTAL_ITEMS) * 100);

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex items-center justify-between">
          <button
            onClick={() => onGoDate(-1)}
            disabled={!canGoPrev}
            className={`rounded-2xl p-2 transition-all duration-200 ${
              canGoPrev
                ? "bg-gray-100 hover:bg-gray-200 active:scale-95"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
            aria-label="上一天"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <input
              type="date"
              className="rounded-2xl border border-gray-200 px-3 py-2 text-sm"
              value={selectedDate}
              min={planDates[0]}
              max={planDates[planDates.length - 1]}
              onChange={(e) => onSetSelectedDate(e.target.value)}
            />
            <div className="mt-2 text-sm text-gray-500">
              第 {selectedIndex + 1} / {profile.totalDays} 天
            </div>
          </div>
          <button
            onClick={() => onGoDate(1)}
            disabled={!canGoNext}
            className={`rounded-2xl p-2 transition-all duration-200 ${
              canGoNext
                ? "bg-gray-100 hover:bg-gray-200 active:scale-95"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
            aria-label="下一天"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </GlassCard>

      {/* 打卡进度条 */}
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-700">打卡进度</div>
          <div className="text-sm font-semibold" style={{ color: completedCount >= TOTAL_ITEMS ? "#10b981" : completedCount >= 6 ? "#f59e0b" : "#6b7280" }}>
            {completedCount} / {TOTAL_ITEMS}
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPct}%`,
              backgroundColor: completedCount >= TOTAL_ITEMS ? "#10b981" : completedCount >= 6 ? "#f59e0b" : "#6b7280",
            }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-400 text-right">{progressPct}%</div>
      </GlassCard>

      <GlassCard>
        <div className="mb-3 text-lg font-semibold">今天打卡</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">晨起体重</div>
            <input
              type="text"
              inputMode="decimal"
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={localWeight}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*\.?\d*$/.test(val)) {
                  setLocalWeight(val);
                }
              }}
              onBlur={handleWeightBlur}
            />
          </label>
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">喝水（L）</div>
            <input
              type="text"
              inputMode="decimal"
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={localWater}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*\.?\d*$/.test(val)) {
                  setLocalWater(val);
                }
              }}
              onBlur={handleWaterBlur}
            />
          </label>
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">步行分钟</div>
            <input
              type="text"
              inputMode="numeric"
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={localWalkMinutes}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*$/.test(val)) {
                  setLocalWalkMinutes(val);
                }
              }}
              onBlur={handleWalkMinutesBlur}
            />
          </label>
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">足跟痛（0-10）</div>
            <input
              type="range"
              min="0"
              max="10"
              className="w-full"
              value={localHeelPain}
              onChange={(e) => handleHeelPainChange(e.target.value)}
            />
            <div className="text-sm font-medium">{localHeelPain}</div>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {[
            ["breakfastDone", "早餐按计划"],
            ["lunchDone", "午餐按计划"],
            ["dinnerDone", "晚餐按计划"],
          ].map(([key, label]) => (
            <label 
              key={key} 
              className={`flex items-center gap-2 rounded-2xl px-3 py-3 cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                selectedLog[key] 
                  ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" 
                  : "bg-gray-50 text-gray-800 hover:bg-gray-100 ring-1 ring-gray-200"
              }`}
            >
              <input
                type="checkbox"
                checked={Boolean(selectedLog[key])}
                onChange={(e) => handleCheckboxChange(key, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="font-medium">{label}</span>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-2 text-sm text-gray-500">运动完成情况</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {EXERCISE_OPTIONS.map((item) => (
              <button
                key={item.key}
                onClick={() => onToggleExercise(selectedDate, item.key)}
                className={`rounded-2xl px-3 py-3 text-left transition-all duration-200 active:scale-[0.98] ${
                  selectedLog[item.key] 
                    ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 ring-1 ring-emerald-200" 
                    : "bg-gray-50 text-gray-800 hover:bg-gray-100 hover:shadow-sm ring-1 ring-gray-200"
                }`}
              >
                <div className="font-medium">{item.label}</div>
                <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${selectedLog[item.key] ? "bg-emerald-200 text-emerald-900" : "bg-white text-gray-500"}`}>
                  {selectedLog[item.key] ? "✓ 已完成" : "点击完成"}
                </div>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">食物记录</div>
            <div className="text-sm text-gray-500">偏离计划时也能记录</div>
          </div>
          <UtensilsCrossed className="h-5 w-5 text-gray-400" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">餐次</div>
            <select
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={foodDraft.mealType}
              onChange={(e) => setFoodDraft((prev) => ({ ...prev, mealType: e.target.value }))}
            >
              <option value="breakfast">早餐</option>
              <option value="lunch">午餐</option>
              <option value="dinner">晚餐</option>
              <option value="snack">加餐</option>
              <option value="allday">全天</option>
            </select>
          </label>
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">食物</div>
            <select
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={foodDraft.presetId}
              onChange={(e) => setFoodDraft((prev) => ({ ...prev, presetId: e.target.value }))}
            >
              {FOOD_PRESETS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {foodDraft.presetId === "custom" ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="rounded-2xl bg-gray-50 p-3">
              <div className="mb-1 text-sm text-gray-500">自定义食物名</div>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={foodDraft.customName}
                onChange={(e) => setFoodDraft((prev) => ({ ...prev, customName: e.target.value }))}
              />
            </label>
            <label className="rounded-2xl bg-gray-50 p-3">
              <div className="mb-1 text-sm text-gray-500">每份估算 kcal</div>
              <input
                type="text"
                inputMode="numeric"
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
                value={foodDraft.customKcal}
                onChange={(e) => setFoodDraft((prev) => ({ ...prev, customKcal: e.target.value }))}
              />
            </label>
          </div>
        ) : (
          <div className="mt-3 rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-600">
            {(() => {
              const preset = FOOD_PRESETS.find((f) => f.id === foodDraft.presetId);
              return preset
                ? `基准：${preset.baseLabel} ≈ ${preset.kcal} kcal${preset.note ? `；${preset.note}` : ""}`
                : "";
            })()}
          </div>
        )}

        <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">份数</div>
            <input
              type="text"
              inputMode="decimal"
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={foodDraft.qty}
              onChange={(e) => setFoodDraft((prev) => ({ ...prev, qty: e.target.value }))}
            />
          </label>
          <button
            onClick={addFoodEntry}
            className="rounded-2xl bg-gray-900 px-4 py-3 font-medium text-white self-end hover:bg-gray-800 hover:shadow-lg transition-all duration-200 active:scale-95 active:bg-gray-950"
          >
            添加
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MetricCard
            title="今日已记录"
            value={`${selectedMealTotals.total.toFixed(0)} kcal`}
            sub={`目标 ${selectedMinKcal}–${selectedMaxKcal} kcal`}
            icon={Flame}
            tone="soft"
          />
          <MetricCard
            title="剩余卡路里"
            value={overUpper > 0 ? `+${overUpper.toFixed(0)} kcal` : `${remainingUpper.toFixed(0)} kcal`}
            sub={overUpper > 0 ? "已超过上限" : "到上限还剩"}
            icon={PanelTop}
            tone={overUpper > 0 ? "warn" : "soft"}
          />
        </div>
        <div className="mt-3 rounded-2xl bg-gray-50 p-3 text-sm text-gray-700">
          {selectedMealTotals.total < selectedMinKcal
            ? `距离建议下限还差约 ${belowMin.toFixed(0)} kcal；`
            : "已达到建议下限；"}{" "}
          餐次拆分：早 {selectedMealTotals.breakfast.toFixed(0)} / 午{" "}
          {selectedMealTotals.lunch.toFixed(0)} / 晚 {selectedMealTotals.dinner.toFixed(0)} / 加{" "}
          {selectedMealTotals.snack.toFixed(0)}
          {selectedMealTotals.allday > 0 && ` / 全天 ${selectedMealTotals.allday.toFixed(0)}`} kcal
        </div>

        {selectedLog.mealEntries?.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-sm font-medium text-gray-700">已记录食物</div>
            {selectedLog.mealEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-2"
              >
                <div className="text-sm">
                  <span className="font-medium">{entry.name}</span>
                  <span className="text-gray-500">
                    {" "}
                    × {entry.qty} = {entry.totalKcal} kcal
                  </span>
                </div>
                <button
                  onClick={() => removeFoodEntry(entry.id)}
                  className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 active:scale-90 active:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
      
      {/* 完成今天按钮 */}
      <div className="mt-4">
        <button
          onClick={onFinalizeDay}
          disabled={selectedIndex >= planDates.length - 1}
          className={`w-full rounded-2xl py-4 font-semibold text-white transition-all duration-200 ${
            selectedIndex >= planDates.length - 1
              ? completedCount >= TOTAL_ITEMS
                ? "bg-gradient-to-r from-emerald-500 to-green-600 opacity-70 cursor-not-allowed"
                : "bg-gray-400 cursor-not-allowed"
              : completedCount >= TOTAL_ITEMS
                ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 active:scale-95 shadow-lg"
                : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-95 shadow-lg"
          }`}
        >
          {selectedIndex >= planDates.length - 1
            ? completedCount >= TOTAL_ITEMS
              ? "✓ 今日已完成（最后一天）"
              : `完成今天 (${completedCount}/${TOTAL_ITEMS}) · 已是最后一天`
            : `✓ 完成今天 (${completedCount}/${TOTAL_ITEMS})`}
        </button>
      </div>
    </div>
  );
}
