import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { MetricsService } from './metrics.service';
import { Request, Response } from 'express';

function routeTemplate(ctx: ExecutionContext): string {
  const req = ctx.switchToHttp().getRequest<Request>();
  const path = (req as any)?.route?.path;
  if (path) return path;

  const url = req.path || '/unknown';
  const parts = url.split('/').filter(Boolean);
  if (parts.length === 0) return '/';
  if (parts.length === 1) return `/${parts[0]}`;
  return `/${parts[0]}/:id/*`;
}

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const path = req.path || '/';
    if (path === '/metrics') return next.handle();

    const method = req.method || 'UNKNOWN';
    const route = routeTemplate(context);

    const end = this.metrics.httpRequestDuration.startTimer({ method, route });
    res.on('finish', () => {
      const code = String(res.statusCode ?? 0);
      end({ code });
      this.metrics.httpRequestsTotal.inc({ method, route, code });
    });

    return next.handle();
  }
}
