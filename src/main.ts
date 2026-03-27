import "reflect-metadata";
import { BadRequestException, Body, Controller, Injectable, Module, OnModuleDestroy, Post } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { join } from "path";

// -----------------------------
// 1) Tipos basicos que usaremos en todo el ejemplo
// -----------------------------
type ConnectionRequest = {
  stringMessage: string;
  numericMessage: number;
};

type ConnectionReply = {
  response: string;
};

type GrpcClientWithCheck = {
  checkConnection(
    request: ConnectionRequest,
    callback: grpc.requestCallback<ConnectionReply>,
  ): void;
};

type LoadedGrpcPackage = {
  [serviceName: string]: grpc.ServiceClientConstructor;
};

// -----------------------------
// 2) Funcion util para cargar un .proto
//    La usamos para NO repetir codigo en gRPC1 y gRPC2
// -----------------------------
function loadGrpcPackage(protoFileName: string, packageName: string): LoadedGrpcPackage {
  const protoPath = join(__dirname, "proto", protoFileName);

  const packageDefinition = protoLoader.loadSync(protoPath, {
    // defaults=true para que gRPC rellene campos por defecto
    defaults: true,
    // oneofs=true por compatibilidad general
    oneofs: true,
    // keepCase=false deja nombres en camelCase en JS/TS
    keepCase: false,
  });

  const grpcObject = grpc.loadPackageDefinition(packageDefinition) as Record<string, unknown>;
  const loadedPackage = grpcObject[packageName] as LoadedGrpcPackage | undefined;

  if (!loadedPackage) {
    throw new Error(`No se pudo cargar el package '${packageName}' desde ${protoFileName}`);
  }

  return loadedPackage;
}

// -----------------------------
// 3) Levantamos un mini servidor gRPC #1 local
// -----------------------------
function startGrpcServer1(): grpc.Server {
  const grpc1Package = loadGrpcPackage("grpc1.proto", "grpc1");
  const FirstGrpcService = grpc1Package.FirstGrpcService;

  const server = new grpc.Server();

  server.addService(
    FirstGrpcService.service,
    {
      // Este metodo responde con el formato pedido para gRPC1
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

  server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
      console.error("Error levantando gRPC1:", error.message);
      return;
    }
    console.log(`gRPC1 escuchando en localhost:${port}`);
  });

  return server;
}

// -----------------------------
// 4) Levantamos un mini servidor gRPC #2 local
// -----------------------------
function startGrpcServer2(): grpc.Server {
  const grpc2Package = loadGrpcPackage("grpc2.proto", "grpc2");
  const SecondGrpcService = grpc2Package.SecondGrpcService;

  const server = new grpc.Server();

  server.addService(
    SecondGrpcService.service,
    {
      // Este metodo responde con el formato pedido para gRPC2
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

  server.bindAsync("0.0.0.0:50052", grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
      console.error("Error levantando gRPC2:", error.message);
      return;
    }
    console.log(`gRPC2 escuchando en localhost:${port}`);
  });

  return server;
}

// -----------------------------
// 5) Servicio Nest: crea 2 clientes gRPC y los consume
// -----------------------------
@Injectable()
class BridgeService implements OnModuleDestroy {
  private readonly grpc1Client: GrpcClientWithCheck;
  private readonly grpc2Client: GrpcClientWithCheck;

  constructor() {
    // Cargamos ambos .proto para construir los clientes
    const grpc1Package = loadGrpcPackage("grpc1.proto", "grpc1");
    const grpc2Package = loadGrpcPackage("grpc2.proto", "grpc2");

    const FirstGrpcService = grpc1Package.FirstGrpcService;
    const SecondGrpcService = grpc2Package.SecondGrpcService;

    // Cliente hacia gRPC1 (puerto 50051)
    this.grpc1Client = new FirstGrpcService(
      "localhost:50051",
      grpc.credentials.createInsecure(),
    ) as unknown as GrpcClientWithCheck;

    // Cliente hacia gRPC2 (puerto 50052)
    this.grpc2Client = new SecondGrpcService(
      "localhost:50052",
      grpc.credentials.createInsecure(),
    ) as unknown as GrpcClientWithCheck;
  }

  // Cerramos clientes al apagar la app para no dejar conexiones abiertas
  onModuleDestroy(): void {
    (this.grpc1Client as unknown as grpc.Client).close();
    (this.grpc2Client as unknown as grpc.Client).close();
  }

  // Helper: convierte callback de gRPC en Promise para usar async/await
  private callGrpc(client: GrpcClientWithCheck, payload: ConnectionRequest): Promise<ConnectionReply> {
    return new Promise((resolve, reject) => {
      client.checkConnection(payload, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response ?? { response: "" });
      });
    });
  }

  // Metodo principal que llama a gRPC1 y gRPC2 y arma la respuesta final
  async testConnection(payload: ConnectionRequest): Promise<{
    grpc1Response: string;
    grpc2Response: string;
    concatenated: string;
  }> {
    // Validacion basica para evitar errores simples de entrada
    if (typeof payload?.stringMessage !== "string") {
      throw new BadRequestException("stringMessage debe ser un string");
    }
    if (typeof payload?.numericMessage !== "number" || Number.isNaN(payload.numericMessage)) {
      throw new BadRequestException("numericMessage debe ser un number");
    }

    // Llamamos a ambos servicios gRPC en paralelo (mas simple y rapido)
    const [grpc1, grpc2] = await Promise.all([
      this.callGrpc(this.grpc1Client, payload),
      this.callGrpc(this.grpc2Client, payload),
    ]);

    // Devolvemos los 3 campos pedidos
    return {
      grpc1Response: grpc1.response,
      grpc2Response: grpc2.response,
      concatenated: `gRPC1 -> ${payload.stringMessage} - ${payload.numericMessage} | gRPC2 -> ${payload.stringMessage} - ${payload.numericMessage}`,
    };
  }
}

// -----------------------------
// 6) Controller REST: endpoint para Postman
// -----------------------------
@Controller("api")
class AppController {
  constructor(private readonly bridgeService: BridgeService) {}

  // POST http://localhost:3000/api/test-connection
  @Post("test-connection")
  async testConnection(@Body() body: ConnectionRequest) {
    return this.bridgeService.testConnection(body);
  }
}

// -----------------------------
// 7) Modulo Nest minimo
// -----------------------------
@Module({
  controllers: [AppController],
  providers: [BridgeService],
})
class AppModule {}

// -----------------------------
// 8) Bootstrap:
//    - Levanta gRPC1
//    - Levanta gRPC2
//    - Levanta HTTP Nest
// -----------------------------
async function bootstrap(): Promise<void> {
  const grpcServer1 = startGrpcServer1();
  const grpcServer2 = startGrpcServer2();

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  console.log("HTTP NestJS escuchando en http://localhost:3000");
  console.log("Endpoint REST: POST http://localhost:3000/api/test-connection");

  // Cierre limpio para no dejar procesos abiertos
  const shutdown = async () => {
    console.log("Apagando servicios...");
    grpcServer1.forceShutdown();
    grpcServer2.forceShutdown();
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
}

void bootstrap();
