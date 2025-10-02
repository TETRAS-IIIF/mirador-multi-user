import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
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
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const rawPath = req.path || '/';
    if (rawPath === '/metrics') {
      return next.handle();
    }

    const method = req.method;
    const route = routeTemplate(context);
    const end = this.metrics.httpRequestDuration.startTimer({ method, route });

    return next.handle().pipe(
      tap({
        next: () => {
          const code = res.statusCode?.toString() || '200';
          end({ code });
          this.metrics.httpRequestsTotal.inc({ method, route, code });
        },
        error: () => {
          const code = res.statusCode?.toString() || '500';
          end({ code });
          this.metrics.httpRequestsTotal.inc({ method, route, code });
        },
      }),
    );
  }
}
