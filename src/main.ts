import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  console.log('HTTP NestJS escuchando en http://localhost:3000');
  console.log('Endpoint REST: POST http://localhost:3000/test-grpc');
}

void bootstrap();
