import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

@Injectable()
export class MetricsService implements OnModuleInit {
  public readonly registry = new Registry();

  // Generic HTTP metrics
  public readonly httpRequestDuration: Histogram<'method' | 'route' | 'code'>;
  public readonly httpRequestsTotal: Counter<'method' | 'route' | 'code'>;

  // Business metrics
  public readonly projectsCreatedTotal: Counter<string>;
  public readonly usersLoginsTotal: Counter<'method'>;
  public readonly usersActiveGauge: Gauge<'env'>;
  public readonly routeUsageTotal: Counter<'route' | 'action'>;
  public readonly projectLockState: Gauge<'project_id'>;
  public readonly uploadFolderSizeBytes: Gauge<'path'>;
  public readonly lockDuration: Histogram<'project_id' | 'user_id'>;
  constructor() {
    const execFileAsync = promisify(execFile);
    const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER ?? '/data/uploads';

    this.lockDuration = new Histogram({
      name: 'project_lock_duration_seconds',
      help: 'Duration of a lock session in seconds (observed at unlock)',
      labelNames: ['project_id', 'user_id'],
      registers: [this.registry],
      buckets: [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1200, 1800, 3600],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Request duration in seconds',
      buckets: [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      labelNames: ['method', 'route', 'code'],
      registers: [this.registry],
    });

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total count of HTTP requests',
      labelNames: ['method', 'route', 'code'],
      registers: [this.registry],
    });

    this.projectsCreatedTotal = new Counter({
      name: 'projects_created_total',
      help: 'Number of projects created',
      registers: [this.registry],
    });

    this.usersLoginsTotal = new Counter({
      name: 'users_logins_total',
      help: 'Number of user logins',
      labelNames: ['method'],
      registers: [this.registry],
    });

    this.usersActiveGauge = new Gauge({
      name: 'users_active_gauge',
      help: 'Current active users (approx.)',
      labelNames: ['env'],
      registers: [this.registry],
    });

    this.routeUsageTotal = new Counter({
      name: 'route_usage_total',
      help: 'Counts important business actions per route',
      labelNames: ['route', 'action'],
      registers: [this.registry],
    });

    this.projectLockState = new Gauge({
      name: 'project_lock_state',
      help: 'Lock state per project (1=locked, 0=unlocked)',
      labelNames: ['project_id'],
      registers: [this.registry],
    });

    this.uploadFolderSizeBytes = new Gauge({
      name: 'upload_folder_size_bytes',
      help: 'Size of the upload folder in bytes',
      labelNames: ['path'],
      registers: [this.registry],
      collect: async () => {
        try {
          const { stdout } = await execFileAsync('du', ['-sb', UPLOAD_FOLDER], {
            timeout: 10_000,
          });
          const bytes = parseInt(stdout.split(/\s+/)[0], 10);
          if (Number.isFinite(bytes))
            this.uploadFolderSizeBytes.labels(UPLOAD_FOLDER).set(bytes);
        } catch {}
      },
    });
  }

  onModuleInit() {
    this.registry.setDefaultLabels({ app: 'mirador-multi-user' });
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
