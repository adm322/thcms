"use client";

/**
 * ProgramActionPanel — pill-group action buttons on the right side.
 * Shows the 4 main actions (Cancel, Save Draft, Save & Generate Studio,
 * Publish) as a compact rounded button group.
 */

import {
  X,
  Save,
  Sparkles,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type StudioLiveStatus = "idle" | "pending" | "generating" | "ready" | "failed";

interface ProgramActionPanelProps {
  titleValid: boolean;
  canGenerateStudio: boolean;
  saving: boolean;
  programId?: string;
  studioStatus?: StudioLiveStatus;
  filename?: string;
  onCancel: () => void;
  onSaveDraft: () => void;
  onSaveAndGenerate: () => void;
  onPublish: () => void;
}

export function ProgramActionPanel({
  titleValid,
  canGenerateStudio,
  saving,
  onCancel,
  onSaveDraft,
  onSaveAndGenerate,
  onPublish,
}: ProgramActionPanelProps) {
  return (
    <aside className="sticky top-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
        <div className="p-2 space-y-1">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={saving}
            className="w-full justify-start rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 h-10"
          >
            <X className="size-4 mr-2" />
            Cancel
          </Button>

          <Button
            variant="ghost"
            onClick={onSaveDraft}
            disabled={saving || !titleValid}
            className="w-full justify-start rounded-xl h-10"
          >
            {saving ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            Save Draft
          </Button>

          {canGenerateStudio ? (
            <Button
              onClick={onSaveAndGenerate}
              disabled={saving || !titleValid}
              className="w-full rounded-xl h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              {saving ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="size-4 mr-2" />
              )}
              Save &amp; Generate
            </Button>
          ) : null}

          <Button
            onClick={onPublish}
            disabled={saving || !titleValid}
            className="w-full rounded-xl h-10"
          >
            {saving ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Send className="size-4 mr-2" />
            )}
            Publish
          </Button>
        </div>
      </div>
    </aside>
  );
}
