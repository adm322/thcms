"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Save, Loader2, Bot, Bell, FileText, CheckCircle, Zap, Settings2, Key, Globe, Cpu,
} from "lucide-react";

interface AutomationSettings {
  autoNotifications: boolean;
  autoInvoicing: boolean;
  autoHrdfSubmission: boolean;
  autoProgramMatching: boolean;
  aiFeatures: boolean;
}

interface ApiModelSettings {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  embedModel: string;
  embedApiKey: string;
}

interface SystemSettings {
  automation: AutomationSettings;
  apiModel: ApiModelSettings;
}

const PROVIDERS = [
  { value: "deepseek", label: "DeepSeek" },
  { value: "openai", label: "OpenAI" },
  { value: "custom", label: "Custom (OpenAI-compatible)" },
];

export function SettingsClient() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load settings");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleAutomation = (key: keyof AutomationSettings) => {
    if (!settings) return;
    setSettings({
      ...settings,
      automation: { ...settings.automation, [key]: !settings.automation[key] },
    });
  };

  const updateApiModel = (key: keyof ApiModelSettings, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      apiModel: { ...settings.apiModel, [key]: value },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return <div className="text-center py-20 text-muted-foreground">{error || "Failed to load settings"}</div>;
  }

  const automations = [
    {
      key: "autoNotifications" as const,
      label: "Auto Notifications",
      description: "Send email/push notifications when bookings, evaluations, or training plans change",
      icon: Bell,
    },
    {
      key: "autoInvoicing" as const,
      label: "Auto Invoicing",
      description: "Automatically generate invoices when bookings are confirmed",
      icon: FileText,
    },
    {
      key: "autoHrdfSubmission" as const,
      label: "Auto HRDF Submission",
      description: "Automatically submit HRDF claims when training is completed",
      icon: CheckCircle,
    },
    {
      key: "autoProgramMatching" as const,
      label: "Auto Program Matching",
      description: "Suggest matching programs when HR creates training plan items",
      icon: Zap,
    },
    {
      key: "aiFeatures" as const,
      label: "AI Features",
      description: "Enable AI-powered features: Learning Studio, quiz generation, proposal drafts, needs analysis",
      icon: Bot,
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="text-xs uppercase tracking-[0.08em] font-semibold text-muted-foreground">
          Admin
        </div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings2 className="h-6 w-6" />
          Settings
        </h1>
      </div>

      {/* Automation Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Automation</CardTitle>
          <CardDescription>Toggle system-wide automation features on or off</CardDescription>
        </CardHeader>
        <CardContent className="pb-6 space-y-1">
          {automations.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-accent/30 transition-colors cursor-pointer"
            >
              <div className="size-9 rounded-lg bg-muted grid place-items-center flex-shrink-0">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
              <Checkbox
                checked={settings.automation[item.key]}
                onCheckedChange={() => toggleAutomation(item.key)}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      {/* API Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Model Configuration</CardTitle>
          <CardDescription>Configure the AI provider used for chat, embeddings, and generation</CardDescription>
        </CardHeader>
        <CardContent className="pb-6 space-y-4">
          {/* Provider */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              Provider
            </label>
            <select
              value={settings.apiModel.provider}
              onChange={(e) => updateApiModel("provider", e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Base URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Base URL
            </label>
            <Input
              value={settings.apiModel.baseUrl}
              onChange={(e) => updateApiModel("baseUrl", e.target.value)}
              placeholder="https://api.deepseek.com"
            />
          </div>

          {/* Model */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              Chat Model
            </label>
            <Input
              value={settings.apiModel.model}
              onChange={(e) => updateApiModel("model", e.target.value)}
              placeholder="deepseek-chat"
            />
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              API Key
            </label>
            <Input
              type="password"
              value={settings.apiModel.apiKey}
              onChange={(e) => updateApiModel("apiKey", e.target.value)}
              placeholder="sk-..."
            />
          </div>

          {/* Embed Model */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              Embedding Model
            </label>
            <Input
              value={settings.apiModel.embedModel}
              onChange={(e) => updateApiModel("embedModel", e.target.value)}
              placeholder="nomic-embed-text-v1.5"
            />
          </div>

          {/* Embed API Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              Embedding API Key
            </label>
            <Input
              type="password"
              value={settings.apiModel.embedApiKey}
              onChange={(e) => updateApiModel("embedApiKey", e.target.value)}
              placeholder="Optional — leave blank to use same key"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
        {saved && (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Saved
          </Badge>
        )}
        {error && (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {error}
          </Badge>
        )}
      </div>
    </div>
  );
}
