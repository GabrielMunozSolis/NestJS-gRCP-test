# NestJS + 2 gRPC (ejemplo minimo local)

Este ejemplo levanta, en local:

- 1 servidor HTTP NestJS (`localhost:3000`)
- 1 servidor gRPC #1 (`localhost:50051`)
- 1 servidor gRPC #2 (`localhost:50052`)


## 1 Instalar y ejecutar

npm install
npm run grpc1
npm run grpc2
npm start

## 2 Probar en Postman

- Metodo: `POST`
- URL: `http://localhost:3000/test-grpc`
- Body: `raw` + `JSON`

```json
{
  "stringMessage": "Hola",
  "numericMessage": 123
}
```

## 3 Respuesta esperada

```json
{
  "grpc1Response": "Conexión OK con gRPC1: Hola - 123",
  "grpc2Response": "Conexión OK con gRPC2: Hola - 123",
  "concatenated": "gRPC1 -> Hola - 123 | gRPC2 -> Hola - 123"
}
```
