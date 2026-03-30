import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';
import { ConnectionReply, ConnectionRequest } from './app.config';

/**
 * Servidor gRPC independiente para el servicio #2.
 * Responde en el puerto 50052.
 */
const PROTO_PATH = join(__dirname, 'proto', 'grpc2.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  defaults: true,
  oneofs: true,
  keepCase: false,
});

const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any;
const grpc2Package = grpcObject.grpc2;
const SecondGrpcService = grpc2Package.SecondGrpcService;

const server = new grpc.Server();

// Registramos el servicio y la implementación del método checkConnection.
server.addService(SecondGrpcService.service, {
  checkConnection: (
    call: grpc.ServerUnaryCall<ConnectionRequest, ConnectionReply>,
    callback: grpc.sendUnaryData<ConnectionReply>,
  ) => {
    // Implementación del método CheckConnection de grpc2.
    // Se lee la petición enviada por el cliente y se devuelve un mensaje de confirmación.
    const { stringMessage, numericMessage } = call.request;
    callback(null, {
      response: `Conexión OK con gRPC2: ${stringMessage} - ${numericMessage}`,
    });
  },
});

const address = '0.0.0.0:50052';
server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, port) => {
  if (error) {
    console.error('Error levantando gRPC2:', error.message);
    process.exit(1);
  }

  // El servidor comienza a aceptar conexiones solo después de bindAsync.
  server.start();
  console.log(`gRPC2 escuchando en localhost:${port}`);
});
