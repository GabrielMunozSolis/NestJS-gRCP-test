import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';

/**
 * Tipos TypeScript que coinciden con los mensajes definidos en los archivos .proto.
 * Estos son solo para ayuda en tiempo de compilación dentro de este ejemplo.
 */
export type ConnectionRequest = {
  stringMessage: string;
  numericMessage: number;
};

export type ConnectionReply = {
  response: string;
};

/**
 * Tipo mínimo para describir un cliente gRPC con el método checkConnection.
 */
export type GrpcClientWithCheck = {
  checkConnection(
    request: ConnectionRequest,
    callback: grpc.requestCallback<ConnectionReply>,
  ): void;
};

/**
 * Paquete gRPC cargado dinámicamente desde el archivo .proto.
 */
export type LoadedGrpcPackage = {
  [serviceName: string]: grpc.ServiceClientConstructor;
};

/**
 * Carga el package gRPC desde un archivo .proto y devuelve el paquete cargado.
 * Este helper se usa para crear clientes gRPC en el servicio principal.
 */
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
