import React, { useState } from "react";
import { GlassCard } from "./App";
import { Sparkles, Download, Upload, AlertCircle, Save } from "lucide-react";

export default function SettingsPage({
  profile,
  ai,
  planEndDate,
  syncStatus,
  syncError,
  userId,
  onUpdateProfile,
  onUpdateAI,
  onSetUserId,
  onSyncFromCloud,
  onSyncToCloud,
  onExportData,
  onImportClick,
  onShowResetModal,
  importRef,
  onImportData,
}) {
  // 本地状态 - 完全独立，不监听外部变化
  const [localStartDate, setLocalStartDate] = useState(profile.startDate);
  const [localTotalDays, setLocalTotalDays] = useState(profile.totalDays);
  const [localStartWeight, setLocalStartWeight] = useState(profile.startWeight);
  const [localTargetWeight, setLocalTargetWeight] = useState(profile.targetWeight);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdateProfile("startDate", localStartDate);
    onUpdateProfile("totalDays", Number(localTotalDays) || 120);
    onUpdateProfile("startWeight", Number(localStartWeight) || 80);
    onUpdateProfile("targetWeight", Number(localTargetWeight) || 75);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const goalLoss = (localStartWeight - localTargetWeight).toFixed(1);

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="mb-3 text-lg font-semibold">目标设置</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">开始日期</div>
            <input
              type="date"
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
            />
          </label>
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">计划天数</div>
            <input
              type="text"
              inputMode="numeric"
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={localTotalDays}
              onChange={(e) => setLocalTotalDays(e.target.value)}
            />
          </label>
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">起始体重</div>
            <input
              type="text"
              inputMode="decimal"
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={localStartWeight}
              onChange={(e) => setLocalStartWeight(e.target.value)}
            />
          </label>
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">目标减重 kg</div>
            <input
              type="text"
              inputMode="decimal"
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={goalLoss}
              onChange={(e) => {
                const loss = Number(e.target.value) || 0;
                setLocalTargetWeight(Number((localStartWeight - loss).toFixed(1)));
              }}
            />
          </label>
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">目标体重</div>
            <input
              type="text"
              inputMode="decimal"
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={localTargetWeight}
              onChange={(e) => setLocalTargetWeight(e.target.value)}
            />
          </label>
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">结束日期（联动）</div>
            <div className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
              {planEndDate}
            </div>
          </label>
        </div>
        <button
          onClick={handleSave}
          className="mt-4 w-full rounded-2xl bg-gray-900 px-4 py-3 font-medium text-white flex items-center justify-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saved ? "已保存！" : "保存设置"}
        </button>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">AI 热量估算预留</div>
            <div className="text-sm text-gray-500">当前仍以手动模板为主</div>
          </div>
          <Sparkles className="h-5 w-5 text-gray-400" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 rounded-2xl bg-gray-50 px-3 py-3">
            <input
              type="checkbox"
              checked={ai.enabled}
              onChange={(e) => onUpdateAI("enabled", e.target.checked)}
            />
            <span className="text-sm">启用预留配置</span>
          </label>
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">Provider</div>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={ai.provider}
              onChange={(e) => onUpdateAI("provider", e.target.value)}
            />
          </label>
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">Endpoint</div>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={ai.endpoint}
              onChange={(e) => onUpdateAI("endpoint", e.target.value)}
              placeholder="后续接你自己的服务或代理"
            />
          </label>
          <label className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">Model</div>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={ai.model}
              onChange={(e) => onUpdateAI("model", e.target.value)}
              placeholder="例如千帆里的模型名"
            />
          </label>
          <label className="col-span-2 rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">API Key（占位）</div>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={ai.apiKey}
              onChange={(e) => onUpdateAI("apiKey", e.target.value)}
              placeholder="当前仅预留，不会直接调用"
            />
          </label>
        </div>
        <div className="mt-3 rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800">
          当前版本已经是可部署的前端 SPA，本地状态可联动。后续如果要云同步，优先建议轻量方案：Cloudflare D1 / KV 或 SQLite/Turso，不需要上常规重数据库。
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-3 text-lg font-semibold">云端同步</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">同步状态</span>
            <span
              className={`text-sm font-medium ${
                syncStatus === "synced"
                  ? "text-emerald-600"
                  : syncStatus === "syncing" || syncStatus === "loading"
                  ? "text-blue-600"
                  : syncStatus === "error"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {syncStatus === "idle" && "就绪"}
              {syncStatus === "syncing" && "同步中..."}
              {syncStatus === "loading" && "加载中..."}
              {syncStatus === "synced" && "已同步"}
              {syncStatus === "error" && "同步失败"}
            </span>
          </div>
          <label className="block rounded-2xl bg-gray-50 p-3">
            <div className="mb-1 text-sm text-gray-500">用户ID（多设备同步用）</div>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              value={userId}
              onChange={(e) => onSetUserId(e.target.value)}
              placeholder="输入相同ID可在多设备同步"
            />
          </label>
          {syncError && (
            <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              {syncError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onSyncFromCloud}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 font-medium text-gray-700 hover:bg-gray-200"
            >
              <Upload className="h-4 w-4" /> 从云端加载
            </button>
            <button
              onClick={onSyncToCloud}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 font-medium text-white hover:bg-gray-800"
            >
              <Download className="h-4 w-4" /> 同步到云端
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-3 text-lg font-semibold">备份</div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onExportData}
            className="flex items-center justify-center gap-2 rounded-3xl bg-gray-900 px-4 py-3 font-medium text-white"
          >
            <Download className="h-4 w-4" /> 导出备份
          </button>
          <button
            onClick={onImportClick}
            className="flex items-center justify-center gap-2 rounded-3xl bg-white px-4 py-3 font-medium text-gray-900 ring-1 ring-black/10"
          >
            <Upload className="h-4 w-4" /> 导入备份
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onImportData}
          />
        </div>
      </GlassCard>

      <GlassCard className="border-red-200 bg-red-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-red-900">重新初始化计划</div>
            <div className="text-sm text-red-700">清空所有数据，回到第1天重新开始</div>
          </div>
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <button
          onClick={onShowResetModal}
          className="mt-4 w-full rounded-2xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 active:bg-red-800 transition-colors"
        >
          重新初始化
        </button>
      </GlassCard>
    </div>
  );
}
