import { prisma } from "@/lib/prisma";

export interface AutomationSettings {
  autoNotifications: boolean;
  autoInvoicing: boolean;
  autoHrdfSubmission: boolean;
  autoProgramMatching: boolean;
  aiFeatures: boolean;
}

export interface ApiModelSettings {
  provider: string;       // openai | deepseek | custom
  apiKey: string;
  baseUrl: string;
  model: string;
  embedModel: string;
  embedApiKey: string;
}

export interface SystemSettings {
  automation: AutomationSettings;
  apiModel: ApiModelSettings;
}

const DEFAULTS: SystemSettings = {
  automation: {
    autoNotifications: true,
    autoInvoicing: true,
    autoHrdfSubmission: false,
    autoProgramMatching: true,
    aiFeatures: true,
  },
  apiModel: {
    provider: "deepseek",
    apiKey: "",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
    embedModel: "nomic-embed-text-v1.5",
    embedApiKey: "",
  },
};

export async function getSettings(): Promise<SystemSettings> {
  const rows = await prisma.systemSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const automation: AutomationSettings = {
    autoNotifications: map.get("autoNotifications") !== "false",
    autoInvoicing: map.get("autoInvoicing") !== "false",
    autoHrdfSubmission: map.get("autoHrdfSubmission") === "true",
    autoProgramMatching: map.get("autoProgramMatching") !== "false",
    aiFeatures: map.get("aiFeatures") !== "false",
  };

  const apiModel: ApiModelSettings = {
    provider: map.get("apiProvider") || DEFAULTS.apiModel.provider,
    apiKey: map.get("apiKey") || DEFAULTS.apiModel.apiKey,
    baseUrl: map.get("apiBaseUrl") || DEFAULTS.apiModel.baseUrl,
    model: map.get("apiModel") || DEFAULTS.apiModel.model,
    embedModel: map.get("embedModel") || DEFAULTS.apiModel.embedModel,
    embedApiKey: map.get("embedApiKey") || DEFAULTS.apiModel.embedApiKey,
  };

  return { automation, apiModel };
}

export async function updateSettings(input: {
  automation?: Partial<AutomationSettings>;
  apiModel?: Partial<ApiModelSettings>;
}): Promise<SystemSettings> {
  const upserts: Promise<any>[] = [];

  if (input.automation) {
    for (const [k, v] of Object.entries(input.automation)) {
      upserts.push(
        prisma.systemSetting.upsert({
          where: { key: k },
          update: { value: String(v) },
          create: { key: k, value: String(v) },
        })
      );
    }
  }

  if (input.apiModel) {
    const keyMap: Record<string, string> = {
      provider: "apiProvider",
      apiKey: "apiKey",
      baseUrl: "apiBaseUrl",
      model: "apiModel",
      embedModel: "embedModel",
      embedApiKey: "embedApiKey",
    };
    for (const [k, v] of Object.entries(input.apiModel)) {
      const dbKey = keyMap[k] || k;
      upserts.push(
        prisma.systemSetting.upsert({
          where: { key: dbKey },
          update: { value: v ?? "" },
          create: { key: dbKey, value: v ?? "" },
        })
      );
    }
  }

  await Promise.all(upserts);
  return getSettings();
}

/** Read-only helper used by AI utils to check if features are enabled. */
export async function isAutomationEnabled(key: keyof AutomationSettings): Promise<boolean> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  if (!row) return DEFAULTS.automation[key] ?? true;
  return row.value !== "false";
}

/** Read-only helper to get the active API model config. */
export async function getApiModelConfig(): Promise<ApiModelSettings> {
  const settings = await getSettings();
  return settings.apiModel;
}
