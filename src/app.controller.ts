import { Controller, Post, Body } from '@nestjs/common';
import { BridgeService } from './app.service';
import { ConnectionRequest } from './app.config';

@Controller('api')
export class AppController {
  constructor(private readonly bridgeService: BridgeService) {}

  @Post('test-connection')
  async testConnection(@Body() body: ConnectionRequest) {
    return this.bridgeService.testConnection(body);
  }
}