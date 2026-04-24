import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Download, Upload, AlertCircle, Save, Settings2, Cloud, Database, Trash2, Target, Calendar, Weight, Sun, Moon } from "lucide-react";

export default function SettingsPage({
  profile, ai, planEndDate, syncStatus, syncError, userId,
  onUpdateProfile, onUpdateAI, onSetUserId, onSyncFromCloud, onSyncToCloud,
  onExportData, onImportClick, onShowResetModal, onShowCorrectionModal,
  importRef, onImportData, theme, onToggleTheme,
}) {
  const [localStartDate, setLocalStartDate] = useState(profile.startDate);
  const [localTotalDays, setLocalTotalDays] = useState(profile.totalDays);
  const [localStartWeight, setLocalStartWeight] = useState(profile.startWeight);
  const [localTargetWeight, setLocalTargetWeight] = useState(profile.targetWeight);
  const [saved, setSaved] = useState(false);
  const isFirstRender = useRef(true);
  const lastSyncedProfile = useRef({ startDate: profile.startDate, totalDays: profile.totalDays, startWeight: profile.startWeight, targetWeight: profile.targetWeight });

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (profile.startDate !== lastSyncedProfile.current.startDate) { setLocalStartDate(profile.startDate); lastSyncedProfile.current.startDate = profile.startDate; }
    if (profile.totalDays !== lastSyncedProfile.current.totalDays) { setLocalTotalDays(profile.totalDays); lastSyncedProfile.current.totalDays = profile.totalDays; }
    if (profile.startWeight !== lastSyncedProfile.current.startWeight) { setLocalStartWeight(profile.startWeight); lastSyncedProfile.current.startWeight = profile.startWeight; }
    if (profile.targetWeight !== lastSyncedProfile.current.targetWeight) { setLocalTargetWeight(profile.targetWeight); lastSyncedProfile.current.targetWeight = profile.targetWeight; }
  }, [profile.startDate, profile.totalDays, profile.startWeight, profile.targetWeight]);

  const handleSave = () => {
    let hasCorrection = false; let correctionMsg = [];
    let days = Number(localTotalDays) || 120;
    if (days < 1 || days > 365) { hasCorrection = true; correctionMsg.push(`计划天数 ${days} 天已调整为 ${Math.max(1, Math.min(365, days))} 天`); days = Math.max(1, Math.min(365, days)); }
    let startWeight = Number(localStartWeight) || 80; let targetWeight = Number(localTargetWeight) || 75;
    if (startWeight < 20 || startWeight > 300) { hasCorrection = true; correctionMsg.push(`起始体重已调整为 ${Math.max(20, Math.min(300, startWeight))} kg`); startWeight = Math.max(20, Math.min(300, startWeight)); }
    if (targetWeight < 20 || targetWeight > 300) { hasCorrection = true; correctionMsg.push(`目标体重已调整为 ${Math.max(20, Math.min(300, targetWeight))} kg`); targetWeight = Math.max(20, Math.min(300, targetWeight)); }
    let validTargetWeight = targetWeight;
    if (targetWeight > startWeight * 2) { hasCorrection = true; validTargetWeight = startWeight * 2; correctionMsg.push(`目标体重不能超过起始体重的2倍，已调整为 ${validTargetWeight} kg`); }
    const today = new Date().toISOString().split('T')[0]; let validStartDate = localStartDate;
    if (localStartDate > today) { hasCorrection = true; validStartDate = today; correctionMsg.push(`开始日期不能是未来，已调整为今天`); }
    lastSyncedProfile.current = { startDate: validStartDate, totalDays: days, startWeight, targetWeight: validTargetWeight };
    setLocalStartDate(validStartDate); setLocalTotalDays(days); setLocalStartWeight(startWeight); setLocalTargetWeight(validTargetWeight);
    onUpdateProfile("startDate", validStartDate); onUpdateProfile("totalDays", days); onUpdateProfile("startWeight", startWeight); onUpdateProfile("targetWeight", validTargetWeight);
    if (hasCorrection) onShowCorrectionModal(correctionMsg);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const goalLoss = (localStartWeight - localTargetWeight).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
              {theme === 'dark' ? <Moon className="h-3.5 w-3.5 text-accent" /> : <Sun className="h-3.5 w-3.5 text-accent" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-on-surface">外观模式</div>
              <div className="text-[10px] text-text-secondary">当前：{theme === 'dark' ? '夜间模式' : '日间模式'}</div>
            </div>
          </div>
          <button onClick={onToggleTheme}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-accent text-white glow-accent transition-all duration-300 active:scale-95">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? '切换日间' : '切换夜间'}
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
            <Target className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-sm font-semibold text-on-surface">目标设置</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="rounded-xl bg-bg-input p-3 border border-border">
            <div className="mb-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">开始日期</div>
            <input type="date" className="w-full rounded-lg bg-bg-card border border-border px-2 py-1.5 text-sm text-text-primary" value={localStartDate} onChange={(e) => setLocalStartDate(e.target.value)} />
          </label>
          <label className="rounded-xl bg-bg-input p-3 border border-border">
            <div className="mb-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">计划天数</div>
            <input type="text" inputMode="numeric" className="w-full rounded-lg bg-bg-card border border-border px-2 py-1.5 text-sm text-text-primary" value={localTotalDays} onChange={(e) => setLocalTotalDays(e.target.value)} />
          </label>
          <label className="rounded-xl bg-bg-input p-3 border border-border">
            <div className="mb-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">起始体重</div>
            <input type="text" inputMode="decimal" className="w-full rounded-lg bg-bg-card border border-border px-2 py-1.5 text-sm text-text-primary" value={localStartWeight} onChange={(e) => setLocalStartWeight(e.target.value)} />
          </label>
          <label className="rounded-xl bg-bg-input p-3 border border-border">
            <div className="mb-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">目标减重 kg</div>
            <input type="text" inputMode="decimal" className="w-full rounded-lg bg-bg-card border border-border px-2 py-1.5 text-sm text-text-primary" value={goalLoss} onChange={(e) => { const loss = Number(e.target.value) || 0; setLocalTargetWeight(Number((localStartWeight - loss).toFixed(1))); }} />
          </label>
          <label className="rounded-xl bg-bg-input p-3 border border-border">
            <div className="mb-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">目标体重</div>
            <input type="text" inputMode="decimal" className="w-full rounded-lg bg-bg-card border border-border px-2 py-1.5 text-sm text-text-primary" value={localTargetWeight} onChange={(e) => setLocalTargetWeight(e.target.value)} />
          </label>
          <label className="rounded-xl bg-bg-input p-3 border border-border">
            <div className="mb-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">结束日期</div>
            <div className="w-full rounded-lg bg-bg-card border border-border px-2 py-1.5 text-sm text-text-secondary">{planEndDate}</div>
          </label>
        </div>
        <button onClick={handleSave}
          className={`mt-3 w-full rounded-xl px-4 py-3 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] ${
            saved ? "bg-success text-white glow-success" : "bg-accent text-white glow-accent hover:opacity-90"
          }`}>
          <Save className="h-3.5 w-3.5" />
          {saved ? "已保存" : "保存设置"}
        </button>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-soft">
            <Sparkles className="h-3.5 w-3.5 text-violet" />
          </div>
          <span className="text-sm font-semibold text-on-surface">AI 热量估算</span>
        </div>
        <div className="space-y-2.5">
          <label className={`flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all ${ai.enabled ? "bg-violet-soft border border-violet/25" : "bg-bg-input border border-border"}`}>
            <input type="checkbox" checked={ai.enabled} onChange={(e) => onUpdateAI("enabled", e.target.checked)} className="w-4 h-4 rounded border-border bg-bg-input text-violet focus:ring-violet/50 cursor-pointer" />
            <span className="text-sm font-semibold text-on-surface">启用预留</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="rounded-xl bg-bg-input p-3 border border-border">
              <div className="mb-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Provider</div>
              <input className="w-full rounded-lg bg-bg-card border border-border px-2 py-1.5 text-xs text-text-primary" value={ai.provider} onChange={(e) => onUpdateAI("provider", e.target.value)} />
            </label>
            <label className="rounded-xl bg-bg-input p-3 border border-border">
              <div className="mb-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Model</div>
              <input className="w-full rounded-lg bg-bg-card border border-border px-2 py-1.5 text-xs text-text-primary" value={ai.model} onChange={(e) => onUpdateAI("model", e.target.value)} />
            </label>
          </div>
          <label className="rounded-xl bg-bg-input p-3 border border-border">
            <div className="mb-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Endpoint</div>
            <input className="w-full rounded-lg bg-bg-card border border-border px-2 py-1.5 text-xs text-text-primary" value={ai.endpoint} onChange={(e) => onUpdateAI("endpoint", e.target.value)} />
          </label>
          <label className="rounded-xl bg-bg-input p-3 border border-border">
            <div className="mb-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">API Key</div>
            <input className="w-full rounded-lg bg-bg-card border border-border px-2 py-1.5 text-xs text-text-primary" value={ai.apiKey} onChange={(e) => onUpdateAI("apiKey", e.target.value)} />
          </label>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-soft">
            <Cloud className="h-3.5 w-3.5 text-cyan" />
          </div>
          <span className="text-sm font-semibold text-on-surface">云端同步</span>
          <div className="ml-auto">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              syncStatus === "synced" ? "bg-success-soft text-success"
                : syncStatus === "syncing" || syncStatus === "loading" ? "bg-cyan-soft text-cyan"
                : syncStatus === "error" ? "bg-danger-soft text-danger"
                : "bg-surface-1 text-text-muted"
            }`}>
              {syncStatus === "idle" && "就绪"}
              {syncStatus === "syncing" && "同步中..."}
              {syncStatus === "loading" && "加载中..."}
              {syncStatus === "synced" && "已同步"}
              {syncStatus === "error" && "失败"}
            </span>
          </div>
        </div>
        <div className="space-y-2.5">
          <label className="rounded-xl bg-bg-input p-3 border border-border">
            <div className="mb-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">用户ID</div>
            <input className="w-full rounded-lg bg-bg-card border border-border px-2 py-1.5 text-xs text-text-primary" value={userId} onChange={(e) => onSetUserId(e.target.value)} />
          </label>
          {syncError && (
            <div className="rounded-lg bg-danger-soft border border-danger/20 p-2.5 text-[11px] text-danger">{syncError}</div>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={onSyncFromCloud} className="flex items-center justify-center gap-1.5 rounded-xl bg-surface-1 border border-border px-3 py-3 text-xs font-bold text-text-secondary hover:bg-surface-2 transition-all active:scale-95">
              <Upload className="h-3.5 w-3.5" /> 从云端加载
            </button>
            <button onClick={onSyncToCloud} className="flex items-center justify-center gap-1.5 rounded-xl bg-cyan text-white px-3 py-3 text-xs font-bold glow-accent transition-all active:scale-95">
              <Download className="h-3.5 w-3.5" /> 同步到云端
            </button>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
            <Database className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-sm font-semibold text-on-surface">备份</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={onExportData} className="flex items-center justify-center gap-1.5 rounded-xl bg-accent text-white px-3 py-3 text-xs font-bold glow-accent transition-all active:scale-95">
            <Download className="h-3.5 w-3.5" /> 导出
          </button>
          <button onClick={onImportClick} className="flex items-center justify-center gap-1.5 rounded-xl bg-surface-1 border border-border px-3 py-3 text-xs font-bold text-text-secondary hover:bg-surface-2 transition-all active:scale-95">
            <Upload className="h-3.5 w-3.5" /> 导入
          </button>
          <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={onImportData} />
        </div>
      </div>

      <div className="rounded-2xl bg-danger-soft border border-danger/15 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger/15">
            <Trash2 className="h-3.5 w-3.5 text-danger" />
          </div>
          <div>
            <div className="text-sm font-semibold text-danger">重新初始化</div>
            <div className="text-[10px] text-danger/50">清空所有数据，回到第1天</div>
          </div>
        </div>
        <button onClick={onShowResetModal} className="w-full rounded-xl bg-danger px-4 py-3 text-sm font-bold text-white glow-danger transition-all active:scale-95">
          重新初始化
        </button>
      </div>
    </div>
  );
}
