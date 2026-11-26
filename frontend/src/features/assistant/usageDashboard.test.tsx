import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

vi.mock('./api.ts', async () => {
  const actual = await vi.importActual<object>('./api.ts');
  return { ...actual, getUsageSummary: vi.fn() };
});

import * as api from './api.ts';
import type { UsageSummary, UsageTotals } from './api.ts';
import { AssistantUsageDashboard } from './components/AssistantUsageDashboard.tsx';
import {
  daysOf,
  modelColors,
  niceMax,
  presetRange,
  summaryToCsv,
} from './usageDashboard.ts';

const totals = (costUsd: number, answers = 1): UsageTotals => ({
  inputTokens: 1000,
  outputTokens: 100,
  cacheReadTokens: 500,
  cacheWriteTokens: 0,
  tokens: 1600,
  costUsd,
  answers,
  apiCalls: answers * 2,
  cacheHitRate: 1 / 3,
});

const summary: UsageSummary = {
  from: '2026-11-01',
  to: '2026-11-30',
  totals: { ...totals(3.75, 3), tokens: 4800 },
  byDay: [
    {
      day: '2026-11-02',
      ...totals(1.75, 2),
      costByModel: { 'claude-opus-5-5': 1.5, 'claude-haiku-5-5': 0.25 },
    },
    {
      day: '2026-11-20',
      ...totals(2),
      costByModel: { 'claude-opus-5-5': 2 },
    },
  ],
  byModel: [
    { model: 'claude-opus-5-5', ...totals(3.5, 2) },
    { model: 'claude-haiku-5-5', ...totals(0.25) },
  ],
  byUser: [
    { userId: 4, userName: 'bob', ...totals(2) },
    // A record saved before names were kept.
    { userId: 3, userName: null, ...totals(1.75, 2) },
  ],
  byProject: [{ projectId: 8, projectTitle: 'Codex, "draft"', ...totals(2) }],
};

describe('usage dashboard helpers', () => {
  it('computes the preset ranges in UTC days', () => {
    const now = new Date('2026-03-15T23:30:00Z');
    expect(presetRange('thisMonth', now)).toEqual({
      from: '2026-03-01',
      to: '2026-03-15',
    });
    expect(presetRange('lastMonth', now)).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
    expect(presetRange('last30', now)).toEqual({
      from: '2026-02-14',
      to: '2026-03-15',
    });
    expect(presetRange('lastMonth', new Date('2026-01-10T00:00:00Z'))).toEqual({
      from: '2025-12-01',
      to: '2025-12-31',
    });
  });

  it('rounds the chart scale up to a round value', () => {
    expect(niceMax(1.35)).toBe(2);
    expect(niceMax(2.2)).toBe(2.5);
    expect(niceMax(0.07)).toBe(0.1);
    expect(niceMax(40)).toBe(50);
    expect(niceMax(0)).toBe(0);
  });

  it('lists every day of a range, both ends included', () => {
    expect(daysOf('2026-02-27', '2026-03-02')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ]);
    expect(daysOf('2026-03-02', '2026-03-01')).toEqual([]);
  });

  it('gives each model the same color whatever the other models', () => {
    const both = modelColors(['claude-haiku-5-5', 'claude-opus-5-5']);
    const alone = modelColors(['claude-opus-5-5']);
    expect(both['claude-opus-5-5']).toBe(alone['claude-opus-5-5']);
    expect(both['claude-haiku-5-5']).not.toBe(both['claude-opus-5-5']);
  });

  it('exports the whole summary as one CSV, quoting where needed', () => {
    const lines = summaryToCsv(summary).split('\n');
    expect(lines[0]).toBe(
      'group,id,name,answers,apiCalls,inputTokens,outputTokens,cacheReadTokens,cacheWriteTokens,tokens,costUsd',
    );
    expect(lines[1]).toBe(
      'total,2026-11-01..2026-11-30,,3,6,1000,100,500,0,4800,3.75',
    );
    expect(lines.filter((l) => l.startsWith('day,'))).toHaveLength(2);
    expect(lines).toContain('user,3,,2,4,1000,100,500,0,1600,1.75');
    expect(lines).toContain(
      'project,8,"Codex, ""draft""",1,2,1000,100,500,0,1600,2',
    );
  });
});

describe('AssistantUsageDashboard', () => {
  beforeEach(() => {
    vi.mocked(api.getUsageSummary).mockReset();
    vi.mocked(api.getUsageSummary).mockResolvedValue(summary);
  });

  it('loads this month, shows the totals, the chart and the tables', async () => {
    render(<AssistantUsageDashboard />);
    const range = presetRange('thisMonth');
    await waitFor(() =>
      expect(api.getUsageSummary).toHaveBeenCalledWith(range.from, range.to),
    );
    expect(await screen.findByText('$3.75')).toBeInTheDocument();
    expect(screen.getByText('4,800')).toBeInTheDocument();

    // One bar per day with usage; legend for the two models.
    expect(screen.getAllByTestId('cost-bar')).toHaveLength(2);
    expect(screen.getAllByText('claude-opus-5-5').length).toBeGreaterThan(0);

    const users = screen.getByRole('table', { name: 'assistantUsage.byUser' });
    expect(within(users).getByText('bob')).toBeInTheDocument();
    // No name kept: the id.
    expect(within(users).getByText('#3')).toBeInTheDocument();
    const projects = screen.getByRole('table', {
      name: 'assistantUsage.byProject',
    });
    expect(within(projects).getByText('Codex, "draft"')).toBeInTheDocument();

    // Hovering a bar gives the day's detail, per model.
    fireEvent.mouseEnter(screen.getAllByTestId('cost-bar')[0]);
    expect(screen.getByTestId('cost-chart-detail')).toHaveTextContent(
      '2026-11-02: $1.75',
    );
    expect(screen.getByTestId('cost-chart-detail')).toHaveTextContent(
      'claude-haiku-5-5 $0.25',
    );
  });

  it('reloads for another range', async () => {
    render(<AssistantUsageDashboard />);
    await screen.findByText('$3.75');
    fireEvent.click(screen.getByText('assistantUsage.lastMonth'));
    const last = presetRange('lastMonth');
    await waitFor(() =>
      expect(api.getUsageSummary).toHaveBeenLastCalledWith(last.from, last.to),
    );
  });

  it('says so when the summary cannot be loaded', async () => {
    vi.mocked(api.getUsageSummary).mockRejectedValue(new Error('403'));
    render(<AssistantUsageDashboard />);
    expect(await screen.findByText('assistantUsage.error')).toBeInTheDocument();
  });
});
