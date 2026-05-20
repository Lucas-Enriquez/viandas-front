# Caseritas Cook

App móvil de Caseritas: gestión de viandas, pedidos y reparto en tiempo real.

Pensada para tres tipos de usuario:

- **Cook** (administrador del local) — administra empresas clientes, productos, menús del día, pedidos recibidos y sesiones de reparto con tracking en vivo.
- **Empleado** (cliente final dentro de una empresa) — visualiza el menú del día, hace su pedido, lo cancela o comenta, y sigue el estado del reparto.
- **Customer** (vía link público) — accede al menú compartido por WhatsApp sin necesidad de cuenta.

El backend vive en un repo aparte (Spring Boot, REST + SSE).

## Stack

- **Expo SDK 54** + **React Native 0.81** + **React 19**
- **Expo Router** (file-based routing)
- **TanStack Query** para data fetching y caching
- **expo-secure-store** para sesión (access + refresh token)
- **expo-location** + **expo-task-manager** para tracking de ubicación en background
- **expo-notifications** para push
- **react-native-maps** + **Google Maps SDK** (Android)
- **react-native-sse** para realtime (Server-Sent Events)
- **TypeScript** estricto

## Estructura

```
app/                       Rutas (Expo Router, file-based)
├── _layout.tsx            Providers globales (Auth, Query, Toast, Notifications)
├── index.tsx              Splash / redirect según sesión
├── login.tsx              Login + flujo de recuperación
├── forgot-password.tsx
├── reset-password.tsx
├── invitation.tsx         Aceptar invitación a empresa
├── global-invitation/     Invitaciones por link genérico
├── m/global/[date]        Menú público compartible
├── (cook)/                Grupo de rutas para rol COOK
│   ├── (tabs)/            Tabs: menús, productos, pedidos, reparto, empresas, cuenta
│   └── (forms)/           CRUD: menú, producto, empresa, map picker, share
└── (employee)/            Rutas del empleado: menú, pedido, cuenta

src/
├── api/                   Fetch wrappers por dominio (auth, menus, orders, ...)
├── auth/                  AuthContext + restauración de sesión + refresh
├── components/            UI compartida (Button, Card, Input, FloatingTabBar, ...)
├── providers/             ToastProvider, NotificationsProvider, CookRealtimeProvider
├── services/              locationTask (background), sseClient
├── stores/                Estado local in-memory (mapResult)
├── hooks/
├── utils/                 date, format
├── config.ts              Lectura de env vars (API_URL, GOOGLE_MAPS_KEY)
├── storage.ts             Persistencia con expo-secure-store
├── theme.ts               Paleta y tokens de diseño
└── types.ts               Modelos compartidos con el backend
```

## Setup

Requisitos:

- Node 20+ y npm
- Expo CLI (`npx expo`)
- Para builds nativos: Android Studio (Android) o Xcode (iOS, solo macOS)
- Para builds en la nube: cuenta de Expo y `eas-cli`

```bash
npm install
cp .env.example .env
# completar las variables (ver abajo)
npm start
```

## Variables de entorno

Definidas en `.env` (gitignoreado) o exportadas en el shell. Todas usan el prefijo `EXPO_PUBLIC_` para que Expo las exponga al cliente.

| Variable | Descripción |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | URL del backend Spring. Defaults: `http://10.0.2.2:8080` (Android emulator), `http://localhost:8080` (iOS simulator), IP local en LAN para device físico. |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key. Se usa tanto en el SDK nativo de Android (vía `app.config.js`) como en las llamadas a Geocoding API desde el código. Debe estar restringida a este bundle (`com.caseritas.cook`) y solo a Maps SDK + Geocoding API. |

Para builds en EAS: configurar las mismas variables como secrets:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value <url>
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value <key>
```

## Comandos

```bash
npm start              # Metro bundler (modo Expo Go o dev client)
npm run start:dev      # Forzar uso de dev client (requerido si usás módulos nativos custom)
npm run android        # Build + run en emulador/device Android
npm run ios            # Build + run en simulador/device iOS (solo macOS)
npm run web            # Modo web
npm run typecheck      # tsc --noEmit
```

## Builds nativos

Expo Go cubre solo módulos JS y un subset de módulos nativos. Necesitás un **development build** cuando agregás un nuevo módulo nativo (ej: `expo-blur`, `expo-location`, `expo-notifications`).

**Local (requiere SDKs nativos instalados):**
```bash
npx expo run:android
npx expo run:ios   # solo macOS
```

**En la nube con EAS (recomendado, no necesita SDKs locales):**
```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

Después de la build, instalá el APK/IPA en el device y usalo en lugar de Expo Go.

## Background location

El tracking de reparto usa `expo-location` + `expo-task-manager`. Para validar el comportamiento en segundo plano (cuando el cook deja la app o bloquea el teléfono) necesitás un development build o build de producción **en dispositivo físico** — Expo Go no soporta todas las capacidades nativas que requiere `ACCESS_BACKGROUND_LOCATION`.

Permisos declarados en `app.config.js`:

- Android: `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`, `POST_NOTIFICATIONS`.
- iOS: `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, `UIBackgroundModes: [location, remote-notification]`.

## Notas

- El estado de los pedidos y de las sesiones de reparto se sincroniza por SSE (ver `src/services/sseClient.ts` y `src/providers/CookRealtimeProvider.tsx`).
- La autenticación es por access token + refresh token; el cliente HTTP (`src/api/client.ts`) reintenta automáticamente con el refresh ante un 401.
- Las imágenes de productos se suben a Cloudinary firmado desde el backend (ver `UploadSignatureResponse`).
