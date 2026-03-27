import { Injectable, OnModuleDestroy, BadRequestException } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import { ConnectionRequest, ConnectionReply, GrpcClientWithCheck, loadGrpcPackage } from './app.config';

@Injectable()
export class BridgeService implements OnModuleDestroy {
  private readonly grpc1Client: GrpcClientWithCheck;
  private readonly grpc2Client: GrpcClientWithCheck;

  constructor() {
    const grpc1Package = loadGrpcPackage('grpc1.proto', 'grpc1');
    const grpc2Package = loadGrpcPackage('grpc2.proto', 'grpc2');

    const FirstGrpcService = grpc1Package.FirstGrpcService;
    const SecondGrpcService = grpc2Package.SecondGrpcService;

    this.grpc1Client = new FirstGrpcService(
      'localhost:50051',
      grpc.credentials.createInsecure(),
    ) as unknown as GrpcClientWithCheck;

    this.grpc2Client = new SecondGrpcService(
      'localhost:50052',
      grpc.credentials.createInsecure(),
    ) as unknown as GrpcClientWithCheck;
  }

  onModuleDestroy(): void {
    (this.grpc1Client as unknown as grpc.Client).close();
    (this.grpc2Client as unknown as grpc.Client).close();
  }

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