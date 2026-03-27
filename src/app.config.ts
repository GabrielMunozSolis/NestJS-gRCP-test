import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';

export type ConnectionRequest = {
  stringMessage: string;
  numericMessage: number;
};

export type ConnectionReply = {
  response: string;
};

export type GrpcClientWithCheck = {
  checkConnection(
    request: ConnectionRequest,
    callback: grpc.requestCallback<ConnectionReply>,
  ): void;
};

export type LoadedGrpcPackage = {
  [serviceName: string]: grpc.ServiceClientConstructor;
};

export function loadGrpcPackage(protoFileName: string, packageName: string): LoadedGrpcPackage {
  const protoPath = join(__dirname, 'proto', protoFileName);

  const packageDefinition = protoLoader.loadSync(protoPath, {
    defaults: true,
    oneofs: true,
    keepCase: false,
  });

  const grpcObject = grpc.loadPackageDefinition(packageDefinition) as Record<string, unknown>;
  const loadedPackage = grpcObject[packageName] as LoadedGrpcPackage | undefined;

  if (!loadedPackage) {
    throw new Error(`No se pudo cargar el package '${packageName}' desde ${protoFileName}`);
  }

  return loadedPackage;
}

export function startGrpcServer1(): grpc.Server {
  const grpc1Package = loadGrpcPackage('grpc1.proto', 'grpc1');
  const FirstGrpcService = grpc1Package.FirstGrpcService;

  const server = new grpc.Server();

  server.addService(
    FirstGrpcService.service,
    {
      checkConnection: (
        call: grpc.ServerUnaryCall<ConnectionRequest, ConnectionReply>,
        callback: grpc.sendUnaryData<ConnectionReply>,
      ) => {
        const { stringMessage, numericMessage } = call.request;
        callback(null, {
          response: `Conexión OK con gRPC1: ${stringMessage} - ${numericMessage}`,
        });
      },
    } as grpc.UntypedServiceImplementation,
  );

  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
      console.error('Error levantando gRPC1:', error.message);
      return;
    }
    console.log(`gRPC1 escuchando en localhost:${port}`);
  });

  return server;
}

export function startGrpcServer2(): grpc.Server {
  const grpc2Package = loadGrpcPackage('grpc2.proto', 'grpc2');
  const SecondGrpcService = grpc2Package.SecondGrpcService;

  const server = new grpc.Server();

  server.addService(
    SecondGrpcService.service,
    {
      checkConnection: (
        call: grpc.ServerUnaryCall<ConnectionRequest, ConnectionReply>,
        callback: grpc.sendUnaryData<ConnectionReply>,
      ) => {
        const { stringMessage, numericMessage } = call.request;
        callback(null, {
          response: `Conexión OK con gRPC2: ${stringMessage} - ${numericMessage}`,
        });
      },
    } as grpc.UntypedServiceImplementation,
  );

  server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
      console.error('Error levantando gRPC2:', error.message);
      return;
    }
    console.log(`gRPC2 escuchando en localhost:${port}`);
  });

  return server;
}