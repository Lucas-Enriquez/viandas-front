# Caseritas Cook

App Expo para cooks de Caseritas: login, selección de empresa, menús del día, pedidos y tracking de reparto en background.

## Configuración

Definí la URL del backend según dónde corra Expo:

```bash
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:8080 npm start
```

Defaults:

- Android emulator: `http://10.0.2.2:8080`
- iOS simulator: `http://localhost:8080`
- Celular físico: usar la IP local de la máquina donde corre Spring

## Comandos

```bash
npm start
npm run android
npm run ios
npm run web
npm run typecheck
```

## Background location

El tracking usa `expo-location` y `expo-task-manager`. Para validar ubicación en segundo plano necesitás un development build o build de producción en dispositivo físico; Expo Go no cubre todas las capacidades nativas de background location.
