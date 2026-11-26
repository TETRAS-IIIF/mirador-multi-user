import { Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory/casl-ability.factory';

@Module({
  providers: [CaslAbilityFactory],
  imports: [],
  exports: [CaslAbilityFactory],
})
export class CaslModule {}
