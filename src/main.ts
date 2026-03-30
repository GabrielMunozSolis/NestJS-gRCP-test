import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Punto de entrada de la aplicación NestJS.
 * Levanta el servidor HTTP en el puerto 3000.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  console.log('HTTP NestJS escuchando en http://localhost:3000');
  console.log('Endpoint REST: POST http://localhost:3000/test-grpc');
}

void bootstrap();
