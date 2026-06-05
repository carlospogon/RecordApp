# RecordApp - Estado del proyecto

Fecha de actualización: 5 de junio de 2026

## Resumen ejecutivo

`RecordApp` ya ha superado la fase de MVP inicial y tiene una base sólida de producto para listas compartidas, navegación, compra operativa y recordatorios.

En este momento:

- `Bloque 1` está cerrado.
- `Bloque 2` está cerrado.
- `Bloque 3` está cerrado y desplegado.
- `Bloque 4` queda cerrado a nivel funcional.
- Los bloques `5` a `8` siguen pendientes, pero el roadmap ya está refinado para incorporar predicción, gasto real, tickets, comparativas y alertas push.

## Lo ya hecho

### Base del producto

- Autenticación operativa con acceso manual y con Google.
- Flujo principal de listas de compra funcional.
- Landing, acceso y experiencia general rediseñados.
- Cabecera de la app con avatar del usuario cuando existe foto de perfil.
- Icono PWA actualizado con el asset final proporcionado.
- Despliegues gestionados en GitHub y Vercel.

### Compartición y espacios

- Listas compartidas entre usuarios.
- Espacios compartidos por código de acceso.
- Creación y unión a espacios desde la app.
- Posibilidad de eliminar espacios cuando el usuario es propietario.
- Las listas creadas dentro de un espacio nacen como compartidas con sus miembros.

### Bloque 1: Producto y navegación

Estado: `hecho`

Incluye:

- Sustitución del menú anterior por un sidebar lateral desplegable.
- Navegación inferior fija para `Lista`, `Historial` y `Sugerencias`.
- Sidebar limpio con `Análisis`, `Resumen` y `WhatsNew`.
- `Cerrar sesión` colocado al final del menú.
- Versión visible de la app.
- Firma `A CPG Dynamics Product`.
- Ajustes responsive para que la navegación inferior no dependa del scroll.
- Ocultación de la barra inferior cuando se abre el menú lateral.
- Revisión visual para ajustarlo a la paleta de colores del producto.
- `Ayuda` reconvertido en `WhatsNew`.

### WhatsNew y versionado

- Estructura de versión centralizada.
- Historial de releases visible dentro de la app.
- Copy más cercano y orientado al usuario para comunicar novedades.
- Versión actual ya reflejada en el producto con sus cambios principales.

### Bloque 2: Compra operativa

Estado: `hecho`

Incluye:

- Sección por producto.
- Nota por producto.
- Agrupación visual de productos por secciones.
- Edición manual de sección y nota.
- Vista `Organizada`.
- `Modo compra` más táctil y compacto.
- Posibilidad de marcar productos rápidamente durante la compra.
- Control correcto de pendientes y comprados dentro de cada sección.
- Contadores revisados para evitar desfases visuales.
- Categorización automática de productos.
- Taxonomía global de productos con alias.
- Soporte para plurales y tildes.
- Normalización para nombres equivalentes como `plátanos`, `platanos` o `banana`.
- Sugerencias compactas al escribir, en lugar del desplegable largo anterior.
- Revisión de regresión para asegurar que al marcar productos no parezca que la lista desaparece.

### Calidad y pulido general

- Corrección de tildes y copy visible en distintos puntos del producto.
- Ajustes de mensajes para dar una sensación más precisa y profesional.
- Corrección en `auth` para evitar que capas visuales interceptaran clicks.
- Builds verificadas durante las entregas principales.

## Bloque 3 ya cerrado

### Bloque 3: Compra colaborativa

Estado: `hecho`

Incluye:

- Asignación de productos a miembros.
- Soporte de `assigned_to_user_id` en items.
- Endpoint para asignar un responsable a un producto.
- Endpoint para obtener miembros de la lista.
- Carga de miembros de la lista activa en el dashboard.
- Selector de responsable dentro de cada producto.
- Visualización de responsable también en `Modo compra`.
- Actividad reciente persistida con actor y tipo de acción.
- Detección de solapes o duplicados dentro de la lista activa.
- Aviso preventivo al intentar añadir un producto ya presente en la lista.
- Notificaciones push para asignaciones, productos marcados como comprados y cierre de listas compartidas.

Resultado esperado:

- Comprar en grupo con menos fricción, más trazabilidad y mejor coordinación.

## Roadmap refinado de bloques pendientes

### Bloque 3: Compra colaborativa

Estado: `hecho`

Objetivo:

- Convertir la lista compartida en un flujo multiusuario real.

Incluye:

- Asignación de productos a miembros.
- Actividad reciente del espacio o de la lista activa.
- Detección de duplicados entre miembros.
- Trazabilidad básica de quién añadió, editó o marcó productos.
- Notificaciones push de asignación, cambios importantes y actividad relevante del espacio.

Resultado esperado:

- Comprar en grupo sin pisarse ni duplicar trabajo.

### Bloque 4: Repetición inteligente

Estado: `hecho`

Objetivo:

- Reducir al mínimo el trabajo de arrancar una nueva compra.

Incluye:

- Plantillas manuales de listas.
- Crear lista desde plantilla.
- Crear lista desde historial.
- Reutilización rápida de compras frecuentes.
- Sugerencias iniciales basadas en recurrencia.
- Alertas suaves para iniciar una lista repetida cuando detecte patrón.
- Acción `Repetir` directa desde `Historial`.
- Guardar listas reales como plantillas reutilizables.
- Sección visible de plantillas guardadas con uso y borrado.
- Señales de reutilización para destacar las listas más rentables de repetir.
- Nombre sugerido al crear desde historial o plantilla.

Resultado esperado:

- Pasar de crear listas desde cero a crear listas casi hechas.

### Bloque 5: Inteligencia predictiva

Estado: `pendiente`

Objetivo:

- Anticipar necesidades antes de que el usuario piense en ellas.

Incluye:

- Predicción de próxima compra.
- Reposición sugerida por producto.
- Ranking de productos probables para próxima compra.
- Detección heurística de `puede que ya lo tengas` usando listas y tickets recientes.
- Cierre inteligente tras finalizar compra.
- Notificaciones push de reposición, próxima compra y posible duplicado.

Resultado esperado:

- App proactiva, no solo reactiva.

### Bloque 6: Inventario

Estado: `pendiente`

Objetivo:

- Conectar compra y consumo real en casa.

Incluye:

- Despensa actual.
- Control de stock.
- Estado `me queda poco`.
- Actualización de stock a partir de compras confirmadas.
- Mejora de la detección de `ya lo tienes` apoyándose en inventario esperado.
- Notificaciones push de stock bajo y reposición prioritaria.

Resultado esperado:

- Evitar recompras innecesarias y dar contexto real a las sugerencias.

### Bloque 7: Caducidades

Estado: `pendiente`

Objetivo:

- Reducir desperdicio y priorizar consumo.

Incluye:

- Fechas de caducidad.
- Alertas de consumo prioritario.
- Avisos antes de recomprar algo que aún debería seguir en casa.
- Relación entre stock y caducidad para sugerir qué consumir primero.
- Notificaciones push de caducidad próxima y consumo prioritario.

Resultado esperado:

- Usar mejor lo comprado antes de volver a comprar.

### Bloque 8: Gasto y compra real

Estado: `pendiente`

Objetivo:

- Cerrar el ciclo entre intención de compra y compra real.

Incluye:

- Precio por producto.
- Total estimado por lista.
- Seguimiento económico por hogar o espacio.
- Histórico de precios por producto y comercio.
- Comparativas de gasto.
- Análisis de variación de precios.
- Insights de gasto por categorías y productos.
- Importación de ticket asociado a una lista.
- Comparativa `lista planificada vs ticket real`.
- Detección de productos planificados no comprados.
- Detección de productos comprados no previstos.
- Desviación económica entre estimado y gasto real.
- Detección de productos del ticket que probablemente ya tenía el usuario por historial reciente.
- Notificaciones push de desviación fuerte, subidas de precio y anomalías de gasto.

Resultado esperado:

- Convertir cada compra en aprendizaje, control económico y mejor predicción futura.

## Capacidades transversales

### Tickets y compra real

No se tratan como bloque independiente para mantener la estructura de 8 bloques, pero pasan a ser una capacidad transversal clave para los bloques `5`, `6` y `8`.

Incluye:

- Escaneo o importación de ticket.
- Parseo de productos, precios, fecha y comercio.
- Vinculación del ticket con una lista ya comprada.
- Uso del ticket para mejorar histórico, predicción, gasto e inventario.

### Push notifications

La capa push ya tiene base técnica para recordatorios, pero su valor funcional crecerá progresivamente.

Aplicación prevista:

- `Bloque 3`: asignaciones y cambios relevantes en listas compartidas.
- `Bloque 5`: reposición y próxima compra.
- `Bloque 6`: stock bajo y reposición prioritaria.
- `Bloque 7`: caducidades y consumo prioritario.
- `Bloque 8`: desviaciones de gasto y alertas de precio.

## Orden recomendado a partir de aquí

1. Pasar a `Bloque 4` para activar repetición inteligente.
2. Continuar con `Bloque 5` para abrir la capa predictiva.
3. Pasar después a `Bloque 8` para introducir tickets, gasto real y comparativas.
4. Abrir `Bloque 6` con inventario ya apoyado en historial y compras reales.
5. Cerrar después `Bloque 7` con caducidades y consumo prioritario.

## Estado global actual

- `Bloque 1`: hecho
- `Bloque 2`: hecho
- `Bloque 3`: hecho
- `Bloque 4`: pendiente
- `Bloque 5`: pendiente
- `Bloque 6`: pendiente
- `Bloque 7`: pendiente
- `Bloque 8`: pendiente
