# PRD: Integración de Calendarios Externos — CouplePlan

**Versión:** 1.0  
**Fecha:** Marzo 2026  
**Product Owner:** Equipo CouplePlan  
**Estado:** Aprobado para desarrollo

---

## 1. Resumen Ejecutivo

### ¿Por qué integrar calendarios externos?

CouplePlan existe para que las parejas organicen su vida juntos. Hoy, la realidad es que la mayoría de los usuarios ya tienen su vida organizada en Google Calendar o Apple Calendar: citas médicas, compromisos de trabajo, eventos familiares, viajes. Al no conectarse con estos calendarios, CouplePlan se convierte en un calendario adicional — una carga más, no una solución.

La integración de calendarios externos transforma CouplePlan de "otro app de calendario" a **el hub central de la pareja**: el único lugar donde ven todo — lo suyo, lo de su pareja, y los eventos compartidos — sin duplicar trabajo.

**Impacto esperado:**
- Reducir la fricción de adopción (no es necesario re-ingresar eventos existentes)
- Aumentar la retención (más valor diario = menos churn)
- Convertir CouplePlan en el "calendario de cabecera" de la pareja

---

## 2. Usuarios Objetivo y Sus Necesidades

### Perfil principal: Pareja Digitalizada

**Características:**
- Edad 25-40 años
- Ambos usan smartphones activamente
- Al menos uno de los dos usa Google Calendar o Apple Calendar como herramienta central de organización
- Ya están registrados en CouplePlan pero usan el calendario de forma esporádica

### Necesidades identificadas

| Necesidad | Dolor actual | Solución propuesta |
|-----------|-------------|-------------------|
| "Quiero ver mis eventos de trabajo Y los eventos de pareja en un solo lugar" | Tienen que alternar entre apps | Vista unificada en CouplePlan |
| "No quiero volver a escribir cada evento" | Duplicación manual de eventos | Sincronización bidireccional |
| "Cuando mi pareja agrega algo en CouplePlan, quiero que aparezca en mi Google" | No existe sincronización | Sync CouplePlan → Google/Apple |
| "No quiero que CouplePlan vea mis reuniones de trabajo" | Sin control de privacidad | Selección de calendarios a sincronizar |
| "Quiero saber de dónde viene cada evento" | Sin indicadores de origen | Color coding por fuente |

### Segmentos secundarios

- **Usuarios iOS puros**: Usan exclusivamente Apple Calendar/Reminders en iPhone/iPad
- **Mixtos**: Uno usa Google, el otro usa Apple

---

## 3. Funcionalidades a Cubrir

### 3.1 Conectar cuenta de Google Calendar (OAuth 2.0)

**Descripción:** El usuario puede conectar su cuenta de Google para sincronizar calendarios seleccionados con CouplePlan.

**Acceptance Criteria:**
- El usuario ve un botón "Conectar Google Calendar" en `/settings/calendar`
- Al hacer clic, se abre el flujo OAuth de Google en el mismo navegador (no popup)
- Tras autorizar, el usuario regresa a CouplePlan con la conexión activa
- El token se almacena de forma segura (nunca en `localStorage`, solo en Supabase DB encriptado)
- Si el usuario ya tiene una conexión activa, ve el estado "Conectado" con la opción de desconectar
- El refresh token se maneja automáticamente (el usuario no debe reconectar cada hora)

**Edge cases:**
- El usuario cancela el flujo OAuth → regresa a settings sin conexión, con mensaje informativo
- El usuario revoca permisos desde Google → CouplePlan detecta el error y muestra "Reconectar"
- Cuenta de Google no tiene Calendar habilitado → mensaje de error claro

---

### 3.2 Conectar Apple Calendar (CalDAV / EventKit iOS)

**Descripción:** El usuario puede conectar su cuenta de iCloud Calendar. En iOS nativo (app Capacitor), se usa EventKit para acceso directo. En web, se usa CalDAV con App-Specific Password.

**Acceptance Criteria:**
- En iOS: el usuario ve "Conectar Apple Calendar" que solicita permisos de EventKit
- En iOS: si el usuario deniega, aparece un mensaje explicando cómo habilitarlo en Ajustes
- En web: el usuario puede ingresar su Apple ID y App-Specific Password para CalDAV
- La conexión se muestra como activa en la pantalla de settings

**Edge cases:**
- El usuario no tiene iCloud Calendar activo → mensaje de error claro con instrucciones
- App-Specific Password incorrecta → error específico (no genérico)

---

### 3.3 Sincronización Bidireccional

**Descripción:** Los cambios en CouplePlan se reflejan en el calendario externo, y viceversa.

**Dirección CouplePlan → Externo:**
- Cuando se crea un evento en CouplePlan, se crea en el calendario externo seleccionado
- Cuando se actualiza, se actualiza en el externo
- Cuando se elimina, se elimina en el externo (con confirmación si tiene asistentes)

**Dirección Externo → CouplePlan:**
- Los eventos del calendario externo aparecen en la vista de CouplePlan
- Si el usuario modifica un evento externo desde su app nativa, la próxima sync lo actualiza
- Sync automática: cada 15 minutos (via webhook de Google o polling para Apple)

**Acceptance Criteria:**
- Un evento creado en CouplePlan aparece en Google Calendar en menos de 30 segundos
- Un evento creado en Google Calendar aparece en CouplePlan en menos de 15 minutos
- La sincronización es idempotente (re-ejecutarla no crea duplicados)
- El usuario puede ver el último timestamp de sincronización en la pantalla de settings

---

### 3.4 Vista Unificada

**Descripción:** La página `/events` muestra todos los eventos: CouplePlan nativo + eventos importados de Google + Apple.

**Acceptance Criteria:**
- Los eventos de todas las fuentes aparecen en la misma vista de calendario
- Cada evento muestra de forma visual de dónde proviene (ver sección 3.6)
- Los eventos de calendarios externos son de solo lectura por defecto (no editables en CouplePlan)
- El usuario puede filtrar por fuente (ver solo CouplePlan, solo Google, todo)
- La vista funciona sin conexión para eventos previamente cacheados

---

### 3.5 Selección de Calendarios a Sincronizar

**Descripción:** El usuario no quiere sincronizar TODOS sus calendarios de Google (ej: feriados, trabajo confidencial). Puede seleccionar cuáles sí.

**Acceptance Criteria:**
- Después de conectar Google, el usuario ve la lista de sus calendarios disponibles
- Puede activar/desactivar cada calendario individualmente con un toggle
- Los cambios de selección se aplican en la próxima sincronización
- La selección se persiste (no se resetea al reconectar)

---

### 3.6 Indicadores Visuales — Color Coding por Origen

**Descripción:** Cada evento tiene un indicador visual que muestra su origen.

**Esquema de colores:**
- 🔴 CouplePlan: Rose (#f43f5e) — color actual de la app
- 🔵 Google Calendar: Azul (#4285F4) con logo de Google
- 🍎 Apple Calendar: Gris oscuro (#1C1C1E) con logo de Apple

**Acceptance Criteria:**
- La leyenda de colores es visible en la vista de calendario
- Los eventos tienen un badge/indicador de origen
- Los colores son accesibles (contraste suficiente en modo light y dark)

---

### 3.7 Notificaciones

**Descripción:** Los eventos sincronizados respetan las notificaciones configuradas en el calendario de origen.

**Acceptance Criteria:**
- Al importar un evento de Google con recordatorio de 30 min, CouplePlan respeta ese recordatorio
- El usuario puede sobrescribir la notificación de un evento externo desde CouplePlan
- Las notificaciones push de CouplePlan funcionan para todos los eventos (independiente del origen)

---

### 3.8 Desconectar Cuenta

**Descripción:** El usuario puede desconectar un calendario externo en cualquier momento.

**Acceptance Criteria:**
- Botón "Desconectar" visible en cada conexión activa
- Dialog de confirmación con explicación de qué pasa: "Los eventos importados desaparecerán de CouplePlan. Los eventos de CouplePlan que se exportaron a Google NO se eliminan de Google."
- Al confirmar: tokens eliminados de Supabase, cache de eventos eliminada, sync detenida
- El proceso es reversible: reconectar restaura la funcionalidad (pero no el historial)

---

### 3.9 Manejo de Conflictos

**Descripción:** Puede ocurrir que el mismo evento (exportado de CouplePlan a Google) se edite en ambos lados.

**Política de resolución: Last-Write-Wins con aviso**

**Acceptance Criteria:**
- Si hay un conflicto detectado, el usuario recibe una notificación in-app: "El evento X fue modificado en Google Calendar. ¿Cuál versión quieres conservar?"
- El usuario puede elegir: "Mantener versión CouplePlan" o "Usar versión Google"
- Si el usuario no responde en 24h, gana la versión más reciente (timestamp de updatedAt)
- El conflicto se registra en `calendar_sync_log` para auditoría

---

## 4. User Stories

### US-01: Conectar Google Calendar
```gherkin
Feature: Conectar Google Calendar

  Scenario: Usuario conecta Google Calendar exitosamente
    Given que el usuario está en /settings/calendar
    And no tiene ningún calendario conectado
    When hace clic en "Conectar Google Calendar"
    Then se redirige al flujo OAuth de Google
    When autoriza los permisos solicitados
    Then regresa a /settings/calendar
    And ve el estado "Google Calendar conectado ✓"
    And ve la lista de sus calendarios de Google disponibles

  Scenario: Usuario cancela el flujo OAuth
    Given que el usuario está en el flujo OAuth de Google
    When hace clic en "Cancelar" o cierra la ventana
    Then regresa a /settings/calendar
    And ve el mensaje "Conexión cancelada. Puedes intentarlo de nuevo cuando quieras."
    And no hay ninguna conexión guardada
```

### US-02: Seleccionar calendarios a sincronizar
```gherkin
Feature: Selección de calendarios

  Scenario: Usuario selecciona calendarios específicos
    Given que el usuario tiene Google Calendar conectado
    And tiene 5 calendarios en su cuenta de Google
    When navega a /settings/calendar
    Then ve la lista de sus 5 calendarios con toggles
    When desactiva 3 calendarios
    Then CouplePlan solo sincroniza los 2 calendarios activos
    And los eventos de los calendarios desactivados no aparecen en /events
```

### US-03: Vista unificada de eventos
```gherkin
Feature: Vista unificada

  Scenario: Usuario ve eventos de todas las fuentes
    Given que el usuario tiene Google Calendar conectado y sincronizado
    And tiene eventos en CouplePlan y en Google Calendar
    When navega a /events
    Then ve todos los eventos en la misma vista
    And los eventos de CouplePlan muestran el indicador rojo
    And los eventos de Google muestran el indicador azul con logo de Google
    And puede filtrar por "Solo CouplePlan" para ver únicamente eventos propios
```

### US-04: Sincronización automática
```gherkin
Feature: Sincronización automática

  Scenario: Evento creado en CouplePlan aparece en Google
    Given que el usuario tiene Google Calendar conectado
    When crea un evento en CouplePlan
    Then en menos de 30 segundos el evento aparece en su Google Calendar
    And el evento en Google tiene el mismo título, fecha y descripción

  Scenario: Evento de Google aparece en CouplePlan
    Given que el usuario tiene Google Calendar sincronizado
    When agrega un evento en Google Calendar desde la app nativa
    Then en menos de 15 minutos el evento aparece en CouplePlan con indicador azul
```

### US-05: Desconectar calendario
```gherkin
Feature: Desconectar calendario

  Scenario: Usuario desconecta Google Calendar
    Given que el usuario tiene Google Calendar conectado con eventos importados
    When hace clic en "Desconectar" en /settings/calendar
    Then ve un dialog: "¿Seguro? Los eventos importados desaparecerán de CouplePlan."
    When confirma la desconexión
    Then la conexión se elimina
    And los eventos importados desaparecen de /events
    And los eventos de CouplePlan exportados a Google permanecen en Google
```

---

## 5. Out of Scope (Esta Versión)

- ❌ Integración con Microsoft Outlook / Exchange
- ❌ Integración con Calendly, Notion Calendar u otros
- ❌ Sincronización de tareas/reminders (solo eventos)
- ❌ Importación de eventos pasados (solo eventos futuros y los últimos 30 días)
- ❌ Invitar personas externas a eventos desde CouplePlan
- ❌ Gestión de asistentes / RSVP en eventos externos
- ❌ Funcionalidad de videollamadas (Google Meet links)
- ❌ Sincronización de eventos recurrentes (v2)
- ❌ CalDAV en web para Apple (complejidad alta; solo EventKit en iOS en v1)
- ❌ Integración con calendarios de trabajo (Google Workspace Enterprise)
- ❌ Exportar eventos históricos de CouplePlan a Google en batch

---

## 6. Métricas de Éxito

### Métricas de adopción (30 días post-lanzamiento)
| Métrica | Objetivo |
|---------|----------|
| % usuarios que conectan al menos un calendario | ≥ 25% |
| % usuarios que mantienen conexión después de 7 días | ≥ 80% |
| Calendarios conectados por usuario activo | ≥ 1.5 |

### Métricas de engagement
| Métrica | Objetivo |
|---------|----------|
| Sesiones/semana en usuarios con calendario conectado vs sin | +40% |
| Retención a 30 días (cohort con calendario vs sin) | +15% |
| Tiempo en pantalla /events | +30% |

### Métricas de calidad técnica
| Métrica | Objetivo |
|---------|----------|
| Tasa de éxito de sync | ≥ 99% |
| Latencia sync CouplePlan → Google | < 30 segundos |
| Latencia sync Google → CouplePlan | < 15 minutos |
| Errores de conflicto sin resolver >24h | < 1% |

### Señales de fracaso
- > 20% de usuarios desconectan en los primeros 3 días (UX problem)
- > 5% de usuarios reportan eventos duplicados (sync bug)
- > 10% de tokens inválidos sin notificar al usuario (silent failure)

---

## 7. Riesgos y Dependencias

### Riesgos técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Google revoca credenciales OAuth (proceso de verificación) | Media | Alto | Iniciar verificación de app en Google Cloud desde el día 1 |
| Límites de cuota de Google Calendar API | Baja | Medio | Implementar rate limiting y backoff exponencial |
| Tokens expirados sin detección | Baja | Alto | Manejo de error 401 con reconexión automática |
| Conflictos de sync no detectados | Media | Medio | Sistema robusto de `etag` / `updatedAt` |
| CalDAV en web: Apple no tiene API pública formal | Alta | Alto | Priorizar EventKit en iOS; CalDAV web = v2 |

### Dependencias externas

| Dependencia | Responsable | Estado |
|-------------|------------|--------|
| Crear proyecto en Google Cloud Console | Marcus | ⏳ Pendiente |
| Habilitar Google Calendar API | Marcus | ⏳ Pendiente |
| Configurar OAuth consent screen (verificado) | Marcus | ⏳ Pendiente |
| Obtener Apple Developer account para EventKit | Marcus | ⏳ Pendiente |
| `GOOGLE_CLIENT_SECRET` en Supabase secrets | Marcus | ⏳ Pendiente |

### Dependencias internas

- La Edge Function de OAuth requiere que Supabase tenga habilitado `pgcrypto`
- La sincronización en tiempo real requiere que los webhooks de Google alcancen el endpoint de Supabase Edge Functions (debe ser HTTPS público)
- La app Capacitor para iOS debe tener el permiso `NSCalendarsUsageDescription` en `Info.plist`

---

*Documento preparado por el equipo de producto de CouplePlan. Para preguntas, contactar al Product Owner.*
