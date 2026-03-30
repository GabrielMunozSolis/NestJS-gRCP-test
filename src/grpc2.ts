import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';
import { ConnectionReply, ConnectionRequest } from './app.config';

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
server.addService(SecondGrpcService.service, {
  checkConnection: (
    call: grpc.ServerUnaryCall<ConnectionRequest, ConnectionReply>,
    callback: grpc.sendUnaryData<ConnectionReply>,
  ) => {
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
  console.log(`gRPC2 escuchando en localhost:${port}`);
});
