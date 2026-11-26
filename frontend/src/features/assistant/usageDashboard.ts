import type { UsageSummary, UsageTotals } from './api.ts';

/** UTC day, YYYY-MM-DD. */
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export function presetRange(
  preset: 'thisMonth' | 'lastMonth' | 'last30',
  now = new Date(),
): { from: string; to: string } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  if (preset === 'lastMonth') {
    return {
      from: isoDay(new Date(Date.UTC(y, m - 1, 1))),
      to: isoDay(new Date(Date.UTC(y, m, 0))),
    };
  }
  if (preset === 'last30') {
    const from = new Date(now);
    from.setUTCDate(from.getUTCDate() - 29);
    return { from: isoDay(from), to: isoDay(now) };
  }
  return { from: isoDay(new Date(Date.UTC(y, m, 1))), to: isoDay(now) };
}

/** Every day of the range, so days without usage show as empty bars. */
export function daysOf(from: string, to: string): string[] {
  const days: string[] = [];
  const d = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (d <= end && days.length < 367) {
    days.push(isoDay(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

/**
 * Model colors, by a fixed model order so a model keeps its color whatever the
 * range (validated categorical slots; low-contrast slots are backed by the
 * legend and the tables).
 */
const MODEL_ORDER = [
  'claude-opus-5-5',
  'claude-sonnet-5-5',
  'claude-haiku-5-5',
];
const SERIES = ['#257de0', '#f47230', '#00b894', '#f2a600'];
const OTHER = '#9e9e9e';

export function modelColors(models: string[]): Record<string, string> {
  const known = MODEL_ORDER.filter((m) => models.includes(m));
  const rest = models.filter((m) => !MODEL_ORDER.includes(m)).sort();
  const colors: Record<string, string> = {};
  [...known, ...rest].forEach((m, i) => {
    colors[m] = SERIES[i] ?? OTHER;
  });
  return colors;
}

const CSV_COLUMNS: (keyof UsageTotals)[] = [
  'answers',
  'apiCalls',
  'inputTokens',
  'outputTokens',
  'cacheReadTokens',
  'cacheWriteTokens',
  'tokens',
  'costUsd',
];

/** One CSV for the whole summary: a `group` column says which table a row is from. */
export function summaryToCsv(summary: UsageSummary): string {
  const cell = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const line = (group: string, id: unknown, name: unknown, t: UsageTotals) =>
    [group, id, name, ...CSV_COLUMNS.map((c) => t[c])].map(cell).join(',');
  return [
    ['group', 'id', 'name', ...CSV_COLUMNS].join(','),
    line('total', `${summary.from}..${summary.to}`, '', summary.totals),
    ...summary.byDay.map((d) => line('day', d.day, '', d)),
    ...summary.byModel.map((m) => line('model', m.model, '', m)),
    ...summary.byUser.map((u) => line('user', u.userId, u.userName, u)),
    ...summary.byProject.map((p) =>
      line('project', p.projectId, p.projectTitle, p),
    ),
  ].join('\n');
}

/** A round top for the y axis (1, 2, 2.5 or 5 times a power of ten), so ticks at 0, ½ and the top read well. */
export function niceMax(value: number): number {
  if (value <= 0) return 0;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * power >= value) ?? 10;
  return step * power;
}

/** User names from MMU (current), over the names saved with the usage records. */
export function withUserNames(
  summary: UsageSummary,
  names: Map<number, string>,
): UsageSummary {
  return {
    ...summary,
    byUser: summary.byUser.map((u) => ({
      ...u,
      userName: names.get(u.userId) ?? u.userName,
    })),
  };
}

/** "Codex Xolotl (#9)", or "#9" when no name is known (e.g. deleted). */
export const displayName = (name: string | null | undefined, id: number) =>
  name ? `${name} (#${id})` : `#${id}`;
