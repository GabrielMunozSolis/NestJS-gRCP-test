import { Controller, Post, Body } from '@nestjs/common';
import { BridgeService } from './app.service';
import { ConnectionRequest } from './app.config';

@Controller()
export class AppController {
  constructor(private readonly bridgeService: BridgeService) {}

  @Post('test-grpc')
  async testConnection(@Body() body: ConnectionRequest) {
    return this.bridgeService.testConnection(body);
  }
}