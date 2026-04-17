import React, { useState, useEffect } from "react";
import { GlassCard, MetricCard } from "./App";
import { ChevronLeft, ChevronRight, UtensilsCrossed, Flame, PanelTop, Trash2 } from "lucide-react";

const EXERCISE_OPTIONS = [
  { key: "walkDone", label: "步行" },
  { key: "briskWalkDone", label: "快走" },
  { key: "sitStandDone", label: "椅子站起" },
  { key: "wallPushupDone", label: "扶墙俯卧撑" },
  { key: "stretchDone", label: "拉伸" },
];

const FOOD_PRESETS = [
  { id: "milk", name: "牛奶 250ml", kcal: 150, baseLabel: "牛奶 250ml" },
  { id: "egg", name: "鸡蛋 1个", kcal: 70, baseLabel: "鸡蛋 1个" },
  { id: "oats", name: "燕麦 50g", kcal: 190, baseLabel: "燕麦 50g" },
  { id: "bread", name: "全麦面包 2片", kcal: 160, baseLabel: "全麦面包 2片" },
  { id: "chicken", name: "鸡胸肉 100g", kcal: 165, baseLabel: "鸡胸肉 100g" },
  { id: "rice", name: "米饭 1碗", kcal: 200, baseLabel: "米饭 1碗（约150g）" },
  { id: "veggies", name: "蔬菜 200g", kcal: 60, baseLabel: "蔬菜 200g", note: "绿叶/瓜类/菌菇" },
  { id: "tofu", name: "豆腐 150g", kcal: 120, baseLabel: "豆腐 150g" },
  { id: "nuts", name: "坚果 15g", kcal: 90, baseLabel: "坚果 15g（约10颗）", note: "杏仁/核桃/腰果" },
  { id: "fruit", name: "水果 1份", kcal: 80, baseLabel: "水果 1份（约150g）", note: "苹果/梨/橙子" },
  { id: "custom", name: "自定义输入", kcal: 0, baseLabel: "" },
];

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
    onUpdateLog(selectedDate, { weight: localWeight === "" ? "" : Number(localWeight) });
  };

  const handleWaterBlur = () => {
    onUpdateLog(selectedDate, { water: localWater === "" ? 0 : Number(localWater) });
  };

  const handleWalkMinutesBlur = () => {
    onUpdateLog(selectedDate, { walkMinutes: localWalkMinutes === "" ? 0 : Number(localWalkMinutes) });
  };

  const handleHeelPainChange = (val) => {
    setLocalHeelPain(val);
    onUpdateLog(selectedDate, { heelPain: Number(val) });
  };

  const handleCheckboxChange = (key, checked) => {
    onUpdateLog(selectedDate, { [key]: checked });
  };

  const addFoodEntry = () => {
    const preset = FOOD_PRESETS.find((f) => f.id === foodDraft.presetId);
    const kcalPerUnit = foodDraft.presetId === "custom" ? Number(foodDraft.customKcal || 0) : preset?.kcal || 0;
    const entry = {
      id: Date.now(),
      meal: foodDraft.mealType,
      name: foodDraft.presetId === "custom" ? foodDraft.customName || "自定义" : preset?.name || "未知",
      qty: Number(foodDraft.qty) || 1,
      kcalPerUnit,
      totalKcal: Math.round((Number(foodDraft.qty) || 1) * kcalPerUnit),
    };
    const newEntries = [...(selectedLog.mealEntries || []), entry];
    onUpdateLog(selectedDate, { mealEntries: newEntries });
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
    onUpdateLog(selectedDate, { mealEntries: newEntries });
  };

  const remainingUpper = Math.max(0, selectedMaxKcal - selectedMealTotals.total);
  const overUpper = Math.max(0, selectedMealTotals.total - selectedMaxKcal);
  const belowMin = Math.max(0, selectedMinKcal - selectedMealTotals.total);

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex items-center justify-between">
          <button className="rounded-2xl bg-gray-100 p-2" onClick={() => onGoDate(-1)}>
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
          <button className="rounded-2xl bg-gray-100 p-2" onClick={() => onGoDate(1)}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
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
              onChange={(e) => setLocalWeight(e.target.value)}
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
              onChange={(e) => setLocalWater(e.target.value)}
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
              onChange={(e) => setLocalWalkMinutes(e.target.value)}
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
            ["dinnerCarbControlled", "晚餐主食守住"],
            ["noAlcohol", "无酒精"],
            ["noSugaryDrinks", "无甜饮料"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded-2xl bg-gray-50 px-3 py-3">
              <input
                type="checkbox"
                checked={Boolean(selectedLog[key])}
                onChange={(e) => handleCheckboxChange(key, e.target.checked)}
              />
              <span>{label}</span>
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
                className={`rounded-2xl px-3 py-3 text-left ${
                  selectedLog[item.key] ? "bg-emerald-50 text-emerald-800" : "bg-gray-50 text-gray-800"
                }`}
              >
                <div className="font-medium">{item.label}</div>
                <div className="text-xs">{selectedLog[item.key] ? "已完成" : "点此完成"}</div>
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
            className="rounded-2xl bg-gray-900 px-4 py-3 font-medium text-white self-end"
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
          {selectedMealTotals.snack.toFixed(0)} kcal
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
                  className="rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
