import { Module } from '@nestjs/common';

import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { WatchHistoryService } from './watch-history.service';
import { WatchHistoryController } from './watch-history.controller';

@Module({
  controllers: [ContentController, WatchHistoryController],
  providers: [ContentService, WatchHistoryService],
  exports: [ContentService, WatchHistoryService],
})
export class ContentModule {}
