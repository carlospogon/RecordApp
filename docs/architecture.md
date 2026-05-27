# RecordApp Architecture

## Objetivo

RecordApp es una webapp de listas de la compra con memoria histórica. Su valor diferencial no es solo guardar listas, sino detectar repeticiones, extraer patrones básicos de frecuencia y sugerir reposición antes de volver a comprar de forma innecesaria.

## Decisiones principales

### Stack

- Frontend y backend web: `Next.js 15` con App Router
- Persistencia y auth: `Supabase`
- Despliegue: `Vercel`
- Estilos: `Tailwind CSS`

### Por qué este stack

#### Next.js

- permite una sola base de código
- soporta rutas, renderizado server-side y server actions
- despliegue trivial en Vercel
- facilita nacer ya como PWA-ready

#### Supabase

- plan gratuito suficiente para MVP
- auth integrada con email/password y Google
- base de datos Postgres real
- Row Level Security para aislar datos por usuario
- evita levantar backend propio

#### Vercel

- despliegue muy simple para Next.js
- preview deployments
- coste cero en fase inicial

## Arquitectura funcional recomendada

### 1. Autenticación

Se usará `Supabase Auth`.

Métodos recomendados para MVP:

- email + contraseña
- Google OAuth

Motivo:

- cubre los dos accesos pedidos
- evita construir auth propia
- mantiene el coste a cero

### 2. Persistencia

Los datos no se guardarán solo en localStorage. El sistema persistirá en Supabase:

- usuarios
- listas
- items

El historial, la frecuencia y los recordatorios se derivarán del histórico de items, sin una tabla específica en primera versión.

Motivo:

- menos sincronización
- menos complejidad
- evita inconsistencias

### 3. Modelo de datos MVP

#### `shopping_lists`

- `id`
- `user_id`
- `shopping_date`
- `title`
- `created_at`
- `updated_at`

#### `shopping_items`

- `id`
- `list_id`
- `user_id`
- `name`
- `normalized_name`
- `quantity`
- `unit`
- `status`
- `created_at`
- `updated_at`
- `checked_at`

### 4. Memoria histórica

Cuando el usuario añada un producto:

1. se normaliza el nombre
2. se busca si `normalized_name` ya existe en items del mismo `user_id`
3. si existe, se devuelve aviso con última fecha y número de apariciones

### 5. Análisis de frecuencia

El cálculo se hará bajo demanda desde servidor:

1. agrupar items por `normalized_name`
2. ordenar fechas
3. calcular diferencias entre apariciones
4. obtener:
   - total de apariciones
   - última compra
   - intervalo medio
   - próxima compra estimada

No se persiste como tabla en el MVP.

### 6. Recordatorios

Se generan en servidor a partir de los productos con:

- al menos 3 apariciones
- un intervalo medio calculable
- una última compra conocida

Si hoy es cercano o posterior a la fecha estimada de reposición, el producto entra en la sección de recordatorios.

### 6.1 PWA e instalación

El proyecto debe salir ya preparado para:

- `manifest.webmanifest`
- iconos instalables
- `service worker` mínimo
- botón de instalación en navegadores compatibles

Esto permite:

- añadir la app a la pantalla de inicio
- preparar el salto posterior a notificaciones push

### 6.2 Push notifications

Las push no entran en el MVP funcional inmediato.

Se dejan para una fase posterior porque requieren:

- suscripción del dispositivo
- almacenamiento de endpoints push
- permiso explícito del usuario
- función programada o backend que emita los recordatorios

La arquitectura elegida lo soporta bien más adelante:

- Vercel para la app
- Supabase para guardar suscripciones
- `service worker` para recepción

### 7. Normalización de producto

Primera versión:

- minúsculas
- trim
- colapsar espacios
- quitar cantidades al inicio si vienen embebidas
- singularización básica de plurales

Ejemplos:

- `Huevos` -> `huevo`
- ` 6 huevos ` -> `huevo`
- `patatas` -> `patata`

Se deja preparado para mejorar más adelante.

## Riesgos técnicos

### 1. Normalización imperfecta

Riesgo:

- `tomate pera` y `tomates pera` pueden no unificarse siempre bien

Mitigación MVP:

- reglas simples
- permitir mejorar el matching después

### 2. Frecuencia engañosa con pocos datos

Riesgo:

- con una o dos compras no hay patrón fiable

Mitigación:

- no mostrar previsión hasta 3 apariciones

### 3. UX móvil lenta si todo se recalcula en cliente

Mitigación:

- cálculos de historial y frecuencia en servidor

### 4. Sobrecargar el MVP

Mitigación:

- fuera de esta fase:
  - notificaciones push
  - IA predictiva avanzada
  - categorización automática compleja

## Mejoras funcionales recomendadas

- permitir “duplicar lista anterior”
- sugerir productos frecuentes al escribir
- filtrar por pendientes/comprados
- panel “productos más comprados”

## Estructura del proyecto

```txt
src/
  app/
    (marketing)/
    auth/
    app/
      lists/
      products/
  components/
    auth/
    shopping/
    reminders/
    products/
  lib/
    auth/
    supabase/
    shopping/
    products/
  types/
```

## Orden de implementación del MVP

1. bootstrap Next.js
2. integrar Supabase
3. definir esquema SQL + RLS
4. auth básica
5. CRUD de listas
6. CRUD de items
7. normalización y aviso de repetidos
8. historial y frecuencia
9. recordatorios básicos
10. pulido responsive
