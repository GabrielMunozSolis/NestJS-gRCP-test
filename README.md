# NestJS + 2 gRPC (ejemplo minimo local)

Este ejemplo levanta, en local:

- 1 servidor HTTP NestJS (`localhost:3000`)
- 1 servidor gRPC #1 (`localhost:50051`)
- 1 servidor gRPC #2 (`localhost:50052`)


## 1 Instalar y ejecutar

npm install

## 2 Levantar cada servicio gRPC por separado

- gRPC1: `npm run grpc1`
  - Escucha en: `localhost:50051`
- gRPC2: `npm run grpc2`
  - Escucha en: `localhost:50052`

> Nota: no necesitas arrancar `npm start` para probar los servicios gRPC individuales.

## 3 Probar gRPC1

Puedes usar `grpcurl` o un cliente gRPC como Postman/Insomnia.

Ejemplo con `grpcurl`:

```bash
grpcurl -plaintext -import-path src/proto -proto grpc1.proto \
  localhost:50051 grpc1.FirstGrpcService.CheckConnection \
  -d '{"stringMessage":"Hola","numericMessage":123}'
```

Respuesta esperada:

```json
{"response":"Conexión OK con gRPC1: Hola - 123"}
```

## 4 Probar gRPC2

Ejemplo con `grpcurl`:

```bash
grpcurl -plaintext -import-path src/proto -proto grpc2.proto \
  localhost:50052 grpc2.SecondGrpcService.CheckConnection \
  -d '{"stringMessage":"Hola","numericMessage":123}'
```

Respuesta esperada:

```json
{"response":"Conexión OK con gRPC2: Hola - 123"}
```

## 5 Probar la ruta HTTP que llama a los dos gRPC

Si quieres probar el flujo completo de NestJS + gRPC, arranca los tres servicios:

```bash
npm run grpc1
npm run grpc2
npm start
```

Luego envía POST a:

- URL: `http://localhost:3000/test-grpc`
- Body: `raw` + `JSON`

```json
{
  "stringMessage": "Hola",
  "numericMessage": 123
}
```

Respuesta esperada:

```json
{
  "grpc1Response": "Conexión OK con gRPC1: Hola - 123",
  "grpc2Response": "Conexión OK con gRPC2: Hola - 123",
  "concatenated": "gRPC1 -> Hola - 123 | gRPC2 -> Hola - 123"
}
```
