"use client";

import {
  EMAIL_SEQUENCE_ORDER,
  EMAIL_SEQUENCE_LABELS,
  EMAIL_SEQUENCE_SCHEDULE,
  type EmailSequenceKey,
} from "@/lib/email-sequence";

export type EmailsEnabled = Record<EmailSequenceKey, boolean>;

export const DEFAULT_EMAILS_ENABLED: EmailsEnabled = {
  seq1: true,
  seq2: true,
  seq3: true,
  seq4: true,
};

/** Build the enabled map from a stored event value (missing keys default on). */
export function emailsEnabledFrom(value: Partial<Record<string, unknown>> | undefined): EmailsEnabled {
  const v = value ?? {};
  return {
    seq1: v.seq1 !== false,
    seq2: v.seq2 !== false,
    seq3: v.seq3 !== false,
    seq4: v.seq4 !== false,
  };
}

export function EventEmailToggles({
  value,
  onChange,
}: {
  value: EmailsEnabled;
  onChange: (value: EmailsEnabled) => void;
}) {
  return (
    <fieldset className="rounded-md border border-zinc-200 p-3">
      <legend className="px-1 text-sm font-medium text-zinc-700">Automated emails to send</legend>
      <p className="mb-2 text-xs text-zinc-500">
        Turn an email off to stop it sending automatically for this event. The manual “Send now”
        trigger on Email Stats still works.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {EMAIL_SEQUENCE_ORDER.map((key) => (
          <label key={key} className="flex items-start gap-2 text-sm text-zinc-800">
            <input
              type="checkbox"
              checked={value[key]}
              onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              {EMAIL_SEQUENCE_LABELS[key]}
              <span className="block text-xs text-zinc-500">{EMAIL_SEQUENCE_SCHEDULE[key]}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
