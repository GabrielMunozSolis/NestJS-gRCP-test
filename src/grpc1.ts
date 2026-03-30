import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';
import { ConnectionReply, ConnectionRequest } from './app.config';

/**
 * Servidor gRPC independiente para el servicio #1.
 * Responde en el puerto 50051.
 */
const PROTO_PATH = join(__dirname, 'proto', 'grpc1.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  defaults: true,
  oneofs: true,
  keepCase: false,
});

const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any;
const grpc1Package = grpcObject.grpc1;
const FirstGrpcService = grpc1Package.FirstGrpcService;

const server = new grpc.Server();
server.addService(FirstGrpcService.service, {
  checkConnection: (
    call: grpc.ServerUnaryCall<ConnectionRequest, ConnectionReply>,
    callback: grpc.sendUnaryData<ConnectionReply>,
  ) => {
    // Implementación del método CheckConnection de grpc1.
    const { stringMessage, numericMessage } = call.request;
    callback(null, {
      response: `Conexión OK con gRPC1: ${stringMessage} - ${numericMessage}`,
    });
  },
});

const address = '0.0.0.0:50051';
server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, port) => {
  if (error) {
    console.error('Error levantando gRPC1:', error.message);
    process.exit(1);
  }
  console.log(`gRPC1 escuchando en localhost:${port}`);
});
