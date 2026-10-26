**Tecnicatura Superior en Desarrollo de Software**  
**Materia:** Aplicaciones Móviles  
**Institución:** ISTEA  
**Alumno:** Guillermo Eduardo Vicente  
**Profesor:** Martín Cornejo  

---

# MediRecordatorio

**App de recordatorio de medicación** iniciada y aprobada como Parcial 1 de **Aplicaciones Móviles** (ISTEA — 2do año, 2026), y continuada después de esa entrega.

Stack: **Expo SDK 57 · React Native 0.86 · React 19 · TypeScript 6**

---

## Opción elegida

De las 5 opciones propuestas en el parcial, elegí **Recordatorio de medicación**:

> Permitir al usuario registrar medicamentos, programar recordatorios y marcar tomas como completadas.

---

## Instalación y ejecución

### Requisitos previos

- **Node.js 22.13.0** (versión utilizada en el desarrollo)
- **Expo Go** instalado en el celular (Android o iOS) — [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) / [App Store](https://apps.apple.com/app/expo-go/id982107779)
- Para conexión LAN, PC y celular en **la misma red WiFi**

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/guillermo-vicente/medi-recordatorio.git
cd medi-recordatorio

# 2. Instalar dependencias
npm install

# 3. Levantar el proyecto
npx expo start --clear

# 4. Escanear el QR con Expo Go desde el celular
```

> **Si el dispositivo no conecta por la red local:**
> ```bash
> npx expo start --clear --tunnel
> ```

### Ejecutar en navegador

Para revisar la interfaz sin conectar un celular, inicia Expo para web:

```bash
npx expo start --web
```

También se puede usar `npm run web`. La vista web permite revisar colores y distribución; el teclado y las notificaciones pueden comportarse distinto que en Android o iOS.

### Verificar TypeScript

```bash
npx tsc --noEmit
```

### Pruebas automatizadas

```bash
npm test
```

Las pruebas cubren validaciones de formularios, cálculo de próximas tomas y el componente `EmptyState`.

"Resultado de la ejecución de Jest: 4 suites y 36 pruebas aprobadas."

![Resultado de npm test](docs/test-result.svg)

La [captura original](docs/test.png) también queda guardada en `docs/`.

---

## Funcionalidades

### Funcionalidades actuales

- **Gestión de Fichas y Personas**: Cada cuenta tiene una ficha propia y permite crear fichas para otras personas (modo cuidador). Los medicamentos se asignan a una ficha y Home permite cambiar entre ellas.
- **Medicamentos y Horarios**: Alta y edición con dosis, horarios por intervalo o diarios, foto de referencia, indicaciones sobre comidas y observaciones.
- **Registro de Tomas con Ubicación**: Al registrar una toma como realizada, se solicita permiso de GPS y se guarda la dirección o coordenadas en el historial.
- **Escáner de Códigos QR**: Uso de `expo-camera` para leer códigos QR (formato `Nombre|Dosis`) y autocompletar el alta de medicamentos, o adjuntar texto directo a las observaciones.
- **Contacto de Emergencia**: Integración con `expo-contacts` para asociar un contacto de la agenda a cada ficha de persona, con opción de editar o quitar.
- **Notificaciones Locales**: Programación de avisos según el plan, con fallback vía `Alert` para compatibilidad con Expo Go.
- **Multimedia**: Captura y selección de imágenes con cámara/galería (`expo-image-picker`), procesadas y guardadas localmente.
- **UI/UX**: Tema claro/oscuro, navegación fluida con Expo Router, componentes accesibles y formularios adaptados al teclado.

### Alcance y limitaciones del prototipo

- Las cuentas y los medicamentos se guardan 100% offline en el dispositivo (AsyncStorage).
- La autenticación es demostrativa: no hay servidor backend y el token es simulado.
- **Limitación de Expo Go**: Las notificaciones push nativas y de fondo están deshabilitadas. El fallback usa temporizadores locales que no son fiables si se cierra la app. Las notificaciones nativas reales requieren un Development Build.
- Si se deniega el permiso de ubicación, la toma se registra exitosamente sin el dato geográfico.

### Autenticación local de demostración

- Registro con nombre, email y contraseña (validación de formato y coincidencia).
- Login con validación de credenciales contra los usuarios guardados en el dispositivo.
- Sesión persistente: en móvil el token se guarda en SecureStore (Keychain iOS / Keystore Android); en web usa `localStorage`.
- Bloqueo de acceso: no se puede entrar sin loguearse.

### Medicamentos y fichas

- Alta y edición de medicamentos con dosis, horarios por intervalo o por horas diarias, indicaciones y foto opcional.
- Escaneo de códigos QR `Nombre|Dosis` para completar nombre y dosis durante el alta o edición.
- Lista con estado de la toma (pendiente / tomada / omitida) y colores.
- Registrar una toma como realizada, con confirmación.
- Guardar la ubicación disponible al registrar una toma realizada y consultarla en el historial.
- Eliminar medicamento con confirmación.
- Fichas de personas en el mismo dispositivo; persistencia local aislada por cuenta.
- Edición de fichas de seguimiento y selección de contacto de emergencia desde la agenda.

### Notificaciones locales

- Se programa una notificación personalizada con el nombre del usuario y el medicamento al dar de alta.
- Permisos solicitados al usuario en el primer uso.
- Cancelación automática al cerrar sesión (evita alertas del usuario anterior).

### Tema claro / oscuro

- Detecta automáticamente el tema del sistema operativo.
- Toggle manual desde el Perfil.
- Sincronización con React Native Paper.

---

## Notas técnicas

### Navegación con Expo Router
El proyecto usa expo-router, que es la capa oficial de navegación de Expo y está construida sobre React Navigation (@react-navigation/native-stack por debajo). Aporta file-based routing: cada archivo en app/ es una ruta automáticamente.

### Notificaciones locales en Expo Go Android
El proyecto usa expo-notifications con un fallback con Alert.alert cuando el módulo nativo no está disponible, manteniendo la funcionalidad del recordatorio en Expo Go. En iOS o en un development build la notificación nativa se dispara normalmente.

### Aislamiento de datos por usuario
Cada medicamento guarda el userEmail del usuario que lo creó. El servicio filtra por ese email, por lo que cada cuenta ve únicamente sus propios medicamentos.

### Pruebas incluidas
- **Funciones puras** (`validators.ts`): validan formato de email, longitud de contraseña y coincidencia de campos.
- **Componente reutilizable** (`EmptyState.tsx`): verifica su renderizado y contenido.
- **Cálculos de horarios** (`calcularTomas.ts`): cubren el cálculo de próximas tomas.
- **Servicio de personas** (`personaService.ts`): cubre la inicialización de fichas y creación de perfiles usando mocks de AsyncStorage.
- Ejecutar con: `npm test`.

---

## Capturas

> Estas capturas documentan la interfaz presentada en el primer parcial. La app evolucionó después; las imágenes todavía no representan todas las pantallas actuales.

### Autenticación

| Login | Registro |
|---|---|
| ![Login](docs/01-login.png) | ![Registro](docs/02-registro.png) |

### Home y alta de medicamento

| Home vacío | Nuevo medicamento |
|---|---|
| ![Home vacío](docs/03-home-vacio.png) | ![Nuevo medicamento](docs/04-nuevo-medicamento.png) |

### Notificaciones y estado de tomas

| Notificación personalizada | Medicamento tomado |
|---|---|
| ![Notificación](docs/05-notificacion.png) | ![Home con tomado](docs/06-home-con-tomado.png) |

### Eliminar y perfil

En Perfil, tocá el avatar para tomar una foto, elegir una imagen de la galería o quitar la foto actual. La imagen queda guardada localmente y asociada a la cuenta del dispositivo. Al tocar el nombre, volvés a Medicamentos.

| Confirmar eliminación | Perfil con modo oscuro |
|---|---|
| ![Eliminar](docs/07-eliminar.png) | ![Perfil](docs/08-perfil-modo-oscuro.png) |

---

## Estructura del proyecto

```text
medi-recordatorio/
├── app/                          # Rutas (Expo Router, file-based)
│   ├── _layout.tsx               # Stack raíz + Providers (SafeArea, Theme, Auth)
│   ├── index.tsx                 # Login
│   ├── register.tsx              # Registro
│   ├── personas.tsx              # Administración de fichas de personas
│   ├── medicamento/
│   │   ├── nuevo.tsx             # Alta y edición de medicamentos (incluye Escáner QR)
│   │   └── [id]/historial.tsx    # Historial de tomas (con ubicación)
│   └── (tabs)/                   # Grupo de tabs
│       ├── _layout.tsx           # Tab Navigator
│       ├── home.tsx              # Lista de medicamentos
│       └── profile.tsx           # Perfil + toggle tema + logout
│
├── src/                          # Código de la app (no rutas)
│   ├── components/ui/            # Componentes presentacionales reutilizables
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── ImagePickerField.tsx
│   │   ├── LoadingState.tsx
│   │   ├── ScreenHeader.tsx
│   │   └── __tests__/            # Pruebas de componentes (EmptyState)
│   ├── config/
│   │   └── constants.ts          # Estados, frecuencias, claves de storage
│   ├── features/                 # Lógica de dominio (negocio)
│   │   ├── auth/                 # AuthContext + useAuth
│   │   ├── medicamentos/         # Datos, horarios y estado de medicamentos
│   │   │   └── __tests__/        # Pruebas de cálculos de horarios
│   │   ├── personas/             # Fichas locales
│   │   │   └── __tests__/        # Pruebas de personaService (mocks)
│   │   └── notifications/        # Programación y sincronización de avisos
│   ├── services/                 # Servicios de infraestructura/hardware
│   │   ├── contactService.ts     # Selección de contactos de emergencia
│   │   ├── locationService.ts    # Ubicación y geocodificación inversa
│   │   ├── mediaService.ts       # Procesamiento y persistencia de imágenes
│   │   ├── secureStorage.ts      # Wrapper de SecureStore (mobile) / localStorage (web)
│   │   └── storage.ts            # Wrapper de AsyncStorage
│   ├── theme/                    # Tema claro/oscuro
│   └── utils/
│       ├── dialogs.ts            # Diálogos cross-platform
│       ├── validators.ts         # Funciones puras de validación
│       └── __tests__/            # Pruebas de validadores
│
├── app.json                      # Configuración de Expo
├── package.json                  # Dependencias + scripts
├── tsconfig.json                 # Configuración de TypeScript
└── babel.config.js               # Configuración de Babel
```

---

## Stack y dependencias

| Paquete | Versión | Para qué |
|---|---|---|
| `expo` | `~57.0.25` | Framework base |
| `react-native` | `0.86.3` | Framework mobile |
| `react` | `19.2.3` | Librería de UI |
| `expo-router` | `~57.0.23` | Navegación basada en archivos (sobre React Navigation) |
| `@react-native-async-storage/async-storage` | `2.2.0` | Persistencia de datos locales |
| `expo-secure-store` | `~57.0.4` | Almacenamiento seguro del token en móvil |
| `expo-notifications` | `~57.0.21` | Notificaciones locales |
| `expo-camera` | `~57.0.6` | Cámara y lectura de códigos QR |
| `expo-location` | `~57.0.21` | Ubicación y dirección de las tomas |
| `expo-contacts` | `~57.0.8` | Selección de contactos de emergencia |
| `expo-image-picker` | `~57.0.20` | Cámara y selección desde galería |
| `expo-image-manipulator` | `~57.0.21` | Compresión y procesamiento de imágenes |
| `expo-file-system` | `~57.0.7` | Persistencia local de imágenes |
| `@expo/vector-icons` | `^15.0.3` | Íconos (Ionicons) |
| `react-native-paper` | `^5.15.0` | Componentes Material Design |
| `jest-expo` | `~57.0.5` | Preset de Jest para Expo |
| `@testing-library/react-native` | `^14.0.1` | Testing de componentes |

---

## Video de la entrega del primer parcial

> El video muestra la versión presentada en el primer parcial, anterior a varias mejoras actuales de interfaz y funcionalidades.

**[Ver video demo en YouTube](https://youtube.com/shorts/JA4iC77T3zY)**

Duración: 1:50.

Muestra el flujo completo: login → alta de medicamento → notificación personalizada → marcar tomado → modo oscuro.

