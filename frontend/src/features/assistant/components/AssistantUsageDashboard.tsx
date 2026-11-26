import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useTranslation } from 'react-i18next';
import {
  getUsageSummary,
  type UsageSummary,
  type UsageTotals,
} from '../api.ts';
import {
  daysOf,
  modelColors,
  niceMax,
  presetRange,
  summaryToCsv,
} from '../usageDashboard.ts';

function downloadCsv(summary: UsageSummary) {
  const blob = new Blob([summaryToCsv(summary)], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `assistant-usage-${summary.from}-${summary.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Admin panel section: usage and estimated cost of the assistant. */
export function AssistantUsageDashboard() {
  const { t, i18n } = useTranslation();
  const [range, setRange] = useState(() => presetRange('thisMonth'));
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!range.from || !range.to || range.from > range.to) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    getUsageSummary(range.from, range.to)
      .then((s) => !cancelled && setSummary(s))
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to]);

  const number = (n: number) => n.toLocaleString(i18n.language);
  const money = (n: number) =>
    `$${n.toLocaleString(i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const percent = (n: number) =>
    n.toLocaleString(i18n.language, { style: 'percent' });

  return (
    <Stack spacing={2} sx={{ m: 1 }} data-testid="assistant-usage-dashboard">
      <Typography variant="h6">{t('assistantUsage.title')}</Typography>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <ButtonGroup size="small" variant="outlined">
          {(['thisMonth', 'lastMonth', 'last30'] as const).map((preset) => (
            <Button key={preset} onClick={() => setRange(presetRange(preset))}>
              {t(`assistantUsage.${preset}`)}
            </Button>
          ))}
        </ButtonGroup>
        <TextField
          size="small"
          type="date"
          label={t('assistantUsage.from')}
          value={range.from}
          onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size="small"
          type="date"
          label={t('assistantUsage.to')}
          value={range.to}
          onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          disabled={!summary}
          onClick={() => summary && downloadCsv(summary)}
        >
          {t('assistantUsage.exportCsv')}
        </Button>
        {loading && <CircularProgress size={20} />}
      </Stack>

      {error && <Alert severity="error">{t('assistantUsage.error')}</Alert>}

      {summary && (
        <>
          <Grid container spacing={2}>
            {[
              [t('assistantUsage.cost'), money(summary.totals.costUsd)],
              [t('assistantUsage.tokens'), number(summary.totals.tokens)],
              [t('assistantUsage.answers'), number(summary.totals.answers)],
              [
                t('assistantUsage.cacheHitRate'),
                percent(summary.totals.cacheHitRate),
              ],
            ].map(([label, value]) => (
              <Grid key={label} size={{ xs: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="h5">{value}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Typography variant="caption" color="text.secondary">
            {t('assistantUsage.estimateNote')}
          </Typography>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('assistantUsage.costPerDay')}
            </Typography>
            <CostChart summary={summary} money={money} />
          </Paper>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <UsageTable
                title={t('assistantUsage.byUser')}
                rows={summary.byUser.map((u) => ({
                  key: `u${u.userId}`,
                  name: u.userName ?? `#${u.userId}`,
                  totals: u,
                }))}
                number={number}
                money={money}
                percent={percent}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <UsageTable
                title={t('assistantUsage.byProject')}
                rows={summary.byProject.map((p) => ({
                  key: `p${p.projectId}`,
                  name: p.projectTitle ?? `#${p.projectId}`,
                  totals: p,
                }))}
                number={number}
                money={money}
                percent={percent}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <UsageTable
                title={t('assistantUsage.byModel')}
                rows={summary.byModel.map((m) => ({
                  key: m.model,
                  name: m.model,
                  totals: m,
                }))}
                number={number}
                money={money}
                percent={percent}
              />
            </Grid>
          </Grid>
        </>
      )}
    </Stack>
  );
}

function UsageTable({
  title,
  rows,
  number,
  money,
  percent,
}: {
  title: string;
  rows: { key: string; name: string; totals: UsageTotals }[];
  number: (n: number) => string;
  money: (n: number) => string;
  percent: (n: number) => string;
}) {
  const { t } = useTranslation();
  return (
    <Paper variant="outlined" sx={{ p: 2, overflowX: 'auto' }}>
      <Typography variant="subtitle1" gutterBottom>
        {title}
      </Typography>
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('assistantUsage.noUsage')}
        </Typography>
      ) : (
        <Table
          size="small"
          aria-label={title}
          sx={{
            '& td:not(:first-of-type), & th': { whiteSpace: 'nowrap' },
            '& td:first-of-type': { minWidth: 140 },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>{t('assistantUsage.name')}</TableCell>
              <TableCell align="right">{t('assistantUsage.answers')}</TableCell>
              <TableCell align="right">{t('assistantUsage.tokens')}</TableCell>
              <TableCell align="right">
                {t('assistantUsage.cacheHitRate')}
              </TableCell>
              <TableCell align="right">{t('assistantUsage.cost')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>{row.name}</TableCell>
                <TableCell align="right">
                  {number(row.totals.answers)}
                </TableCell>
                <TableCell align="right">{number(row.totals.tokens)}</TableCell>
                <TableCell align="right">
                  {percent(row.totals.cacheHitRate)}
                </TableCell>
                <TableCell align="right">{money(row.totals.costUsd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}

const CHART = { width: 720, height: 220, left: 56, bottom: 24, top: 8 };

/** Cost per day, stacked by model. Hover a bar for the day's detail. */
function CostChart({
  summary,
  money,
}: {
  summary: UsageSummary;
  money: (n: number) => string;
}) {
  const { t } = useTranslation();
  const days = useMemo(
    () => daysOf(summary.from, summary.to),
    [summary.from, summary.to],
  );
  const byDay = useMemo(
    () => new Map(summary.byDay.map((d) => [d.day, d])),
    [summary.byDay],
  );
  const models = summary.byModel.map((m) => m.model);
  const colors = modelColors(models);
  const max = niceMax(Math.max(0, ...summary.byDay.map((d) => d.costUsd)));
  const [hover, setHover] = useState<string | null>(null);

  if (max === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('assistantUsage.noUsage')}
      </Typography>
    );
  }

  const plotW = CHART.width - CHART.left;
  const plotH = CHART.height - CHART.top - CHART.bottom;
  const slot = plotW / days.length;
  const barW = Math.max(1, Math.min(24, slot - 2));
  const y = (v: number) => (v / max) * plotH;
  const ticks = [0, max / 2, max];
  const labelDays = [
    ...new Set([days[0], days[Math.floor(days.length / 2)], days.at(-1)!]),
  ];
  const hovered = hover ? byDay.get(hover) : undefined;

  return (
    <Box>
      {models.length > 1 && (
        <Stack direction="row" spacing={2} sx={{ mb: 1 }} flexWrap="wrap">
          {models.map((m) => (
            <Stack key={m} direction="row" spacing={0.5} alignItems="center">
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '2px',
                  bgcolor: colors[m],
                }}
              />
              <Typography variant="caption">{m}</Typography>
            </Stack>
          ))}
        </Stack>
      )}
      <svg
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        width="100%"
        role="img"
        aria-label={t('assistantUsage.costPerDay')}
        data-testid="cost-chart"
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((v) => {
          const ty = CHART.top + plotH - y(v);
          return (
            <g key={v}>
              <line
                x1={CHART.left}
                x2={CHART.width}
                y1={ty}
                y2={ty}
                stroke="#e0e0e0"
                strokeWidth={1}
              />
              <text
                x={CHART.left - 6}
                y={ty + 4}
                textAnchor="end"
                fontSize={11}
                fill="#616161"
              >
                {money(v)}
              </text>
            </g>
          );
        })}
        {days.map((day, i) => {
          const entry = byDay.get(day);
          const x = CHART.left + i * slot + (slot - barW) / 2;
          let top = CHART.top + plotH;
          return (
            <g
              key={day}
              data-testid={entry ? 'cost-bar' : undefined}
              onMouseEnter={() => setHover(entry ? day : null)}
              opacity={hover && hover !== day ? 0.5 : 1}
            >
              {/* Hit target: the whole column, taller than the bar. */}
              <rect
                x={CHART.left + i * slot}
                y={CHART.top}
                width={slot}
                height={plotH}
                fill="transparent"
              />
              {entry &&
                models.map((m) => {
                  const h = y(entry.costByModel[m] ?? 0);
                  if (h <= 0) return null;
                  top -= h;
                  // 2px surface gap between stacked segments.
                  return (
                    <rect
                      key={m}
                      x={x}
                      y={top}
                      width={barW}
                      height={Math.max(1, h - 2)}
                      fill={colors[m]}
                    />
                  );
                })}
            </g>
          );
        })}
        {labelDays.map((day, i) => (
          <text
            key={`${day}-${i}`}
            x={CHART.left + days.indexOf(day) * slot + slot / 2}
            y={CHART.height - 6}
            textAnchor={
              i === 0 ? 'start' : i === labelDays.length - 1 ? 'end' : 'middle'
            }
            fontSize={11}
            fill="#616161"
          >
            {day}
          </text>
        ))}
      </svg>
      <Typography
        variant="caption"
        color="text.secondary"
        component="div"
        sx={{ minHeight: 20 }}
        data-testid="cost-chart-detail"
      >
        {hovered
          ? `${hovered.day}: ${money(hovered.costUsd)} · ${t(
              'assistantUsage.answersCount',
              { count: hovered.answers },
            )}${
              models.length > 1
                ? ` (${models
                    .filter((m) => hovered.costByModel[m])
                    .map((m) => `${m} ${money(hovered.costByModel[m])}`)
                    .join(', ')})`
                : ''
            }`
          : t('assistantUsage.hoverHint')}
      </Typography>
    </Box>
  );
}
