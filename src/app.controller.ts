import { Controller, Post, Body } from '@nestjs/common';
import { BridgeService } from './app.service';
import { ConnectionRequest } from './app.config';

/**
 * Controlador HTTP principal de la aplicación.
 * Define la ruta REST que recibe peticiones JSON y las envía al servicio gRPC.
 */
@Controller()
export class AppController {
  // Nest inyecta BridgeService para que el controlador pueda delegar la lógica de negocio.
  constructor(private readonly bridgeService: BridgeService) {}

  /**
   * Ruta POST /test-grpc
   * Recibe el payload JSON del cliente y delega la llamada a BridgeService.
   * El body debe cumplir con el tipo ConnectionRequest definido en app.config.ts.
   */
  @Post('test-grpc')
  async testConnection(@Body() body: ConnectionRequest) {
    return this.bridgeService.testConnection(body);
  }
}