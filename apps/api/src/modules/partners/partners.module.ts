import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';

@Module({
  imports: [ConfigModule],
  controllers: [PartnersController],
  providers: [PartnersService],
  exports: [PartnersService],
})
export class PartnersModule {}
