import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BridgeService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [BridgeService],
})
export class AppModule {}