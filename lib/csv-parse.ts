/**
 * Minimal RFC 4180 style CSV parser.
 *
 * Handles quoted fields, escaped quotes (""), embedded commas/newlines,
 * CRLF or LF line endings, and a leading UTF-8 BOM.
 */
export function parseCsvRows(text: string): string[][] {
  const input = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < input.length) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      endField();
      i += 1;
      continue;
    }
    if (char === "\r") {
      if (input[i + 1] === "\n") i += 1;
      endRow();
      i += 1;
      continue;
    }
    if (char === "\n") {
      endRow();
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  // Flush trailing field/row unless the file ended exactly on a row break.
  if (field.length > 0 || row.length > 0) endRow();

  // Drop rows that are entirely empty (e.g. trailing blank lines).
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/**
 * Normalize a CSV header for lookup: lowercase, with every non-alphanumeric
 * character removed. This makes matching tolerant of spacing, underscores,
 * hyphens and punctuation — so "Coming with how many persons?",
 * "coming_with_how_many_persons" and "Coming With How Many Persons" all
 * resolve to the same key.
 */
export function normalizeCsvHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function parseCsvObjects(text: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const raw = parseCsvRows(text);
  if (raw.length === 0) return { headers: [], rows: [] };

  const headers = raw[0].map((h) => h.trim());
  const normalized = headers.map(normalizeCsvHeader);
  const rows = raw.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    normalized.forEach((key, idx) => {
      if (!key) return;
      obj[key] = (cells[idx] ?? "").trim();
    });
    return obj;
  });

  return { headers, rows };
}
