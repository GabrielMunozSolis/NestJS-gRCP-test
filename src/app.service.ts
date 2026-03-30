import { Injectable, OnModuleDestroy, BadRequestException } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import { ConnectionRequest, ConnectionReply, GrpcClientWithCheck, loadGrpcPackage } from './app.config';

/**
 * Servicio que actúa como puente entre el controlador HTTP y los servidores gRPC.
 * Crea los clientes gRPC para grpc1 y grpc2 y expone un método para probar la conexión.
 */
@Injectable()
export class BridgeService implements OnModuleDestroy {
  private readonly grpc1Client: GrpcClientWithCheck;
  private readonly grpc2Client: GrpcClientWithCheck;

  constructor() {
    const grpc1Package = loadGrpcPackage('grpc1.proto', 'grpc1');
    const grpc2Package = loadGrpcPackage('grpc2.proto', 'grpc2');

    const FirstGrpcService = grpc1Package.FirstGrpcService;
    const SecondGrpcService = grpc2Package.SecondGrpcService;

    // Cliente hacia el servidor gRPC1 en localhost:50051
    this.grpc1Client = new FirstGrpcService(
      'localhost:50051',
      grpc.credentials.createInsecure(),
    ) as unknown as GrpcClientWithCheck;

    // Cliente hacia el servidor gRPC2 en localhost:50052
    this.grpc2Client = new SecondGrpcService(
      'localhost:50052',
      grpc.credentials.createInsecure(),
    ) as unknown as GrpcClientWithCheck;
  }

  /**
   * Cuando el módulo NestJS se destruye, cerramos los clientes gRPC.
   */
  onModuleDestroy(): void {
    (this.grpc1Client as unknown as grpc.Client).close();
    (this.grpc2Client as unknown as grpc.Client).close();
  }

  /**
   * Envoltorio que convierte la llamada gRPC en una Promise.
   * Esto permite usar `await` desde el método testConnection.
   */
  private callGrpc(client: GrpcClientWithCheck, payload: ConnectionRequest): Promise<ConnectionReply> {
    return new Promise((resolve, reject) => {
      client.checkConnection(payload, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response ?? { response: '' });
      });
    });
  }

  /**
   * Recibe el payload validado desde HTTP, llama a los dos servicios gRPC y devuelve ambas respuestas.
   */
  async testConnection(payload: ConnectionRequest): Promise<{
    grpc1Response: string;
    grpc2Response: string;
    concatenated: string;
  }> {
    if (typeof payload?.stringMessage !== 'string') {
      throw new BadRequestException('stringMessage debe ser un string');
    }
    if (typeof payload?.numericMessage !== 'number' || Number.isNaN(payload.numericMessage)) {
      throw new BadRequestException('numericMessage debe ser un number');
    }

    const [grpc1, grpc2] = await Promise.all([
      this.callGrpc(this.grpc1Client, payload),
      this.callGrpc(this.grpc2Client, payload),
    ]);

    return {
      grpc1Response: grpc1.response,
      grpc2Response: grpc2.response,
      concatenated: `gRPC1 -> ${payload.stringMessage} - ${payload.numericMessage} | gRPC2 -> ${payload.stringMessage} - ${payload.numericMessage}`,
    };
  }
}