import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';

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

  constructor() {
    // HTTP metrics
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

    // Business metrics
    this.projectsCreatedTotal = new Counter({
      name: 'projects_created_total',
      help: 'Number of projects created',
      // no labels (per your latest DTO)
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
  }

  onModuleInit() {
    this.registry.setDefaultLabels({ app: 'mirador-multi-user' });
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
