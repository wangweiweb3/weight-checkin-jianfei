import React, { useState, useEffect, useMemo, useRef } from "react";
import { CircularProgress } from "./App";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  GlassWater,
} from "lucide-react";

const CUP_SIZE = 300;
const MIN_WATER_TARGET = 1800;

export default function WaterPage({
  profile,
  selectedDate,
  selectedLog,
  selectedIndex,
  planDates,
  onUpdateLog,
  onGoDate,
  maxReachedDate,
}) {
  const [customInput, setCustomInput] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [inputError, setInputError] = useState("");
  const [animatingDrop, setAnimatingDrop] = useState(false);
  const disabledRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setCustomInput("");
    setShowMessage(false);
    setMessageText("");
    setInputError("");
    disabledRef.current = false;
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const currentWaterML = useMemo(() => {
    return (selectedLog.water || 0) * 1000;
  }, [selectedLog.water]);

  const remaining = Math.max(0, MIN_WATER_TARGET - currentWaterML);
  const exceeded = currentWaterML > MIN_WATER_TARGET ? currentWaterML - MIN_WATER_TARGET : 0;
  const progressPct = Math.min(100, Math.round((currentWaterML / MIN_WATER_TARGET) * 100));
  const cupCount = Math.floor(currentWaterML / CUP_SIZE);

  const disableButton = () => {
    disabledRef.current = true;
    setShowMessage(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      disabledRef.current = false;
      setShowMessage(false);
    }, 3000);
  };

  const handleCupClick = () => {
    if (disabledRef.current) return;
    setAnimatingDrop(true);
    setTimeout(() => setAnimatingDrop(false), 600);
    const newWaterLiters = (selectedLog.water || 0) + CUP_SIZE / 1000;
    const newWaterML = Math.round(newWaterLiters * 1000);
    onUpdateLog({ water: newWaterLiters });
    setMessageText(`已喝 ${newWaterML}ml${newWaterML >= MIN_WATER_TARGET ? "，达标！" : "，继续加油"}`);
    disableButton();
  };

  const handleCustomSubmit = () => {
    if (disabledRef.current) return;
    if (!customInput || customInput.trim() === "") {
      setInputError("请输入饮水量数值");
      return;
    }
    const val = Number(customInput);
    if (Number.isNaN(val) || val <= 0) {
      setInputError("请输入大于0的整数");
      return;
    }
    const newWaterLiters = (selectedLog.water || 0) + val / 1000;
    onUpdateLog({ water: newWaterLiters });
    setMessageText(`已添加 ${val}ml，累计 ${Math.round(newWaterLiters * 1000)}ml`);
    setCustomInput("");
    setInputError("");
    disableButton();
  };

  const canGoPrev = selectedIndex > 0;
  const nextDate = planDates[selectedIndex + 1];
  const canGoNext = selectedIndex < planDates.length - 1 && nextDate <= maxReachedDate;

  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const dateObj = new Date(selectedDate + "T00:00:00");
  const weekdayStr = weekdays[dateObj.getDay()];
  const monthStr = `${dateObj.getMonth() + 1}月`;
  const dayStr = `${dateObj.getDate()}日`;

  const isComplete = progressPct >= 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
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

      <div className="relative overflow-hidden rounded-[28px] bg-mesh p-6">
        <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-cyan/8 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-accent/6 blur-3xl" />

        <div className="relative flex flex-col items-center">
          <CircularProgress value={progressPct} size={160} strokeWidth={12} gradient={isComplete ? "emerald" : "blue"}>
            <Droplets className={`h-6 w-6 mb-1 ${isComplete ? "text-success" : "text-cyan"} ${animatingDrop ? "animate-drop-fill" : ""}`} />
            <span className="text-3xl font-black text-text-primary">{currentWaterML}</span>
            <span className="text-[10px] text-text-muted">/ {MIN_WATER_TARGET} ml</span>
          </CircularProgress>

          <div className="mt-4 text-center">
            {isComplete ? (
              <div className="text-sm font-bold text-success">已达标！</div>
            ) : (
              <div className="text-sm text-text-secondary">还差 <span className="font-bold text-text-primary">{remaining}</span> ml</div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            {Array.from({ length: Math.ceil(MIN_WATER_TARGET / CUP_SIZE) }, (_, i) => (
              <div key={i} className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-500 ${i < cupCount ? "bg-cyan/20 border border-cyan/30" : "bg-surface-1 border border-border"}`}>
                <GlassWater className={`h-3 w-3 ${i < cupCount ? "text-cyan" : "text-hint"}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {showMessage && (
        <div className="glass rounded-xl px-4 py-3 flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
          <div className="text-[11px] text-success font-semibold">{messageText}</div>
        </div>
      )}

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-soft">
            <Plus className="h-3.5 w-3.5 text-cyan" />
          </div>
          <span className="text-sm font-semibold text-on-surface">快捷添加</span>
        </div>
        <button onClick={handleCupClick} disabled={disabledRef.current}
          className={`w-full rounded-xl py-4 font-bold text-base transition-all duration-300 active:scale-[0.98] ${
            disabledRef.current
              ? "bg-surface-1 text-text-muted cursor-not-allowed"
              : isComplete
                ? "bg-success text-white glow-success"
                : "bg-cyan text-white glow-accent hover:opacity-90"
          }`}>
          <span className="flex items-center justify-center gap-2">
            <Droplets className="h-5 w-5" />
            {currentWaterML === 0 ? "喝1杯水" : "再喝1杯"} ({CUP_SIZE}ml)
          </span>
        </button>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
            <GlassWater className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-sm font-semibold text-on-surface">自定义饮水量</span>
        </div>
        <div className="flex gap-2">
          <input type="text" inputMode="numeric"
            className={`flex-1 rounded-xl bg-bg-input border-2 px-3.5 py-3 text-sm text-center text-text-primary placeholder:text-hint transition-colors ${inputError ? "border-danger/40" : "border-border focus:border-accent/40"}`}
            value={customInput}
            onChange={(e) => { const val = e.target.value; if (val === "" || /^\d*$/.test(val)) { setCustomInput(val); setInputError(""); } }}
            placeholder="输入 ml"
            disabled={disabledRef.current} />
          <button onClick={handleCustomSubmit} disabled={disabledRef.current || !customInput}
            className={`rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 ${
              disabledRef.current || !customInput
                ? "bg-surface-1 text-text-muted cursor-not-allowed"
                : "bg-accent text-white glow-accent active:scale-95"
            }`}>
            添加
          </button>
        </div>
        {inputError && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-danger font-semibold">
            <AlertCircle className="h-3 w-3" />
            {inputError}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="h-3.5 w-3.5 text-cyan/50" />
            <span className="text-[10px] font-semibold text-text-muted">每日目标</span>
          </div>
          <div className="text-xl font-black text-text-primary">{MIN_WATER_TARGET}<span className="text-xs text-text-muted ml-1">ml</span></div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <GlassWater className="h-3.5 w-3.5 text-accent/50" />
            <span className="text-[10px] font-semibold text-text-muted">每杯</span>
          </div>
          <div className="text-xl font-black text-text-primary">{CUP_SIZE}<span className="text-xs text-text-muted ml-1">ml</span></div>
        </div>
      </div>
    </div>
  );
}
