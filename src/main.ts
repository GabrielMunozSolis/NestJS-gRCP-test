import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { startGrpcServer1, startGrpcServer2 } from './app.config';

async function bootstrap(): Promise<void> {
  const grpcServer1 = startGrpcServer1();
  const grpcServer2 = startGrpcServer2();

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  console.log('HTTP NestJS escuchando en http://localhost:3000');
  console.log('Endpoint REST: POST http://localhost:3000/api/test-connection');

  const shutdown = async () => {
    console.log('Apagando servicios...');
    grpcServer1.forceShutdown();
    grpcServer2.forceShutdown();
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });
}

void bootstrap();
