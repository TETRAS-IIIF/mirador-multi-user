import { Module } from '@nestjs/common';
import { SanityCheckController } from './sanity-check.controller';
import { SanityCheckService } from './sanity-check.service';

@Module({
  controllers: [SanityCheckController],
  providers: [SanityCheckService],
})
export class SanityCheckModule {}
