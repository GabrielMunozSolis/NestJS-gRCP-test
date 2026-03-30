import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BridgeService } from './app.service';

/**
 * Módulo raíz de NestJS.
 * Aquí se registra el controlador HTTP y el servicio que hace de puente hacia gRPC.
 */
@Module({
  controllers: [AppController],
  providers: [BridgeService],
})
export class AppModule {}