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
