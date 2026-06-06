export type AppReleaseNote = {
  version: string;
  title: string;
  releaseDate: string;
  summary: string;
  highlights: string[];
};

export const developerSignature = "A CPG Dynamics Product";

export const appReleaseNotes: AppReleaseNote[] = [
  {
    version: "1.10.0",
    title: "Directed Sharing And Voice Capture",
    releaseDate: "2026-06-06",
    summary:
      "Hola. En esta version RecordApp da un paso importante para que compartir compras reales sea mas simple. Ahora puedes anadir personas concretas a tus listas, invitar por email a quien todavia no usa la app y convertir notas de voz en productos listos para comprar tanto en listas normales como en listas de grupo.",
    highlights: [
      "Ya puedes anadir a una persona registrada directamente a una lista por email. Caso de uso: si tu pareja ya usa RecordApp, la sumas a la compra semanal en segundos sin compartir codigos manuales.",
      "Si el email todavia no esta registrado, RecordApp envia una invitacion amable con enlace directo a la app. Caso de uso: si quieres incorporar a un familiar o companero nuevo, puede entrar desde el correo y caer en la lista correcta.",
      "Las invitaciones pendientes ya se pueden ver, reenviar y cancelar desde la propia lista. Caso de uso: si te equivocas de correo o alguien no vio el primer mensaje, lo corriges sin salir del flujo de compra.",
      "La comparticion dirigida tambien funciona sobre listas que viven dentro de grupos. Caso de uso: si compartes compras por casa, oficina o piso compartido, invitas a cada persona concreta sin romper la estructura del espacio.",
      "Ahora puedes dictar una nota de voz y convertirla en productos automaticamente. Caso de uso: si se te ocurren varias cosas mientras caminas o conduces, las dices una vez y la lista queda creada sin teclear.",
      "La transcripcion intenta extraer cantidades y unidades basicas al vuelo. Caso de uso: si dices 'dos litros de leche y una docena de huevos', RecordApp intenta guardar esos productos de forma mas util desde el primer momento."
    ]
  },
  {
    version: "1.9.0",
    title: "Smart Repetition And Templates",
    releaseDate: "2026-06-06",
    summary:
      "¡Hola! En esta versión hemos hecho que volver a hacer una compra se sienta mucho más natural. Ahora puedes repetir listas anteriores, guardarlas como plantillas, crear compras nuevas desde esas plantillas y dejar que RecordApp te señale cuáles son las listas que más te compensa reutilizar. Desde el equipo de RecordApp esperamos que estas mejoras te ahorren tiempo cada semana y te ayuden a arrancar listas casi hechas.",
    highlights: [
      "Ahora puedes repetir una lista anterior con un toque desde Historial. Caso de uso: si cada viernes haces una compra parecida, puedes recuperar esa base en segundos en lugar de volver a escribirla entera.",
      "Las listas repetidas salen con un nombre sugerido más claro. Caso de uso: si reutilizas varias compras parecidas, distingues rápidamente cuál corresponde a esta semana sin renombrarla a mano.",
      "Ya puedes guardar una lista real como plantilla. Caso de uso: si tienes una compra fija para hogar, desayuno o limpieza, la conviertes en plantilla y la reutilizas cuando quieras.",
      "También puedes crear una lista nueva directamente desde una plantilla. Caso de uso: si tienes una plantilla de compra mensual, arrancas la lista ya montada y solo ajustas lo que cambió esta vez.",
      "Historial destaca las listas más reutilizables con señales simples de recurrencia. Caso de uso: si dudas entre varias compras pasadas, la app te sugiere primero las que más probablemente te ahorren tiempo hoy.",
      "La sección de plantillas ya permite usar y quitar plantillas guardadas desde la propia app. Caso de uso: si una rutina deja de servirte, la eliminas sin tocar tu historial de compras reales."
    ]
  },
  {
    version: "1.8.0",
    title: "Collaborative Shopping Signals",
    releaseDate: "2026-06-04",
    summary:
      "¡Hola! En esta versión hemos dado un paso importante para que comprar en compañía sea bastante más claro. Ahora puedes repartir productos entre miembros, ver actividad reciente de la lista, detectar antes los duplicados dentro de la compra activa y activar avisos push para enterarte cuando alguien te asigna algo, marca un producto como comprado o cierra una lista compartida. Desde el equipo de RecordApp esperamos que estas mejoras te ayuden a coordinarte sin fricción.",
    highlights: [
      "Ahora cada producto puede tener responsable. Caso de uso: si una persona va por lácteos y otra por limpieza, cada una ve de un vistazo qué le toca llevar.",
      "La lista muestra actividad reciente real de colaboración. Caso de uso: si vuelves a abrir la app en mitad de la compra, puedes ver quién añadió, actualizó o movió algo hace un momento.",
      "RecordApp avisa cuando intentas añadir un producto que ya está en la lista activa. Caso de uso: si alguien ya metió queso o leche, lo ves antes de duplicarlo sin darte cuenta.",
      "También detectamos solapes dentro de la lista para revisarlos con calma. Caso de uso: si el mismo producto aparece dos veces, la app te lo señala para fusionarlo o confirmar que de verdad hace falta repetirlo.",
      "Las notificaciones push ahora cubren eventos colaborativos importantes. Caso de uso: si te asignan un producto, otro miembro lo marca como comprado o la lista se finaliza, te enteras aunque no tengas la app abierta."
    ]
  },
  {
    version: "1.7.0",
    title: "Smart Shopping Flow",
    releaseDate: "2026-06-04",
    summary:
      "¡Hola! ¿Sabías que en RecordApp hemos añadido nuevas cositas? Ahora los productos pueden organizarse por secciones, llevar notas útiles, entrar en un modo compra más claro y categorizarse automáticamente cuando escribes cosas como plátanos, leche o queso. Desde el equipo de RecordApp esperamos que te gusten.",
    highlights: [
      "Tus productos ahora se agrupan por secciones como Fruta, Lácteos u Hogar para que la lista tenga más sentido al comprar.",
      "Cada producto puede llevar una nota rápida, por ejemplo: sin gluten, marca habitual o pasillo.",
      "Hemos añadido un modo compra más táctil para marcar productos sobre la marcha sin perder el contexto de la lista.",
      "La categoría se detecta automáticamente al escribir nombres como plátanos, banana, leche o queso, incluso con plurales o tildes."
    ]
  },
  {
    version: "1.6.0",
    title: "Navigation And Product Polish",
    releaseDate: "2026-06-03",
    summary: "RecordApp pasa a una estructura de producto más clara, con panel lateral, versión visible y novedades por release.",
    highlights: [
      "Nuevo panel lateral desplegable para navegar mejor por la app.",
      "WhatsNew sustituye a la antigua pantalla de ayuda técnica.",
      "La versión actual de la app queda visible dentro del menú.",
      "La firma de producto queda integrada en la navegación."
    ]
  },
  {
    version: "1.5.0",
    title: "Shared Spaces And Identity",
    releaseDate: "2026-06-02",
    summary: "La app ya permite organizar compras compartidas por espacios y mejora la identidad visual del usuario.",
    highlights: [
      "Se añaden espacios compartidos con código de acceso.",
      "Las listas pueden nacer directamente dentro de un espacio.",
      "Se puede eliminar un espacio cuando el owner lo necesite.",
      "La cabecera de la app muestra avatar o iniciales del usuario."
    ]
  },
  {
    version: "1.4.0",
    title: "Shared Lists",
    releaseDate: "2026-05-30",
    summary: "RecordApp incorpora listas compartidas y sincronización entre miembros.",
    highlights: [
      "Invitaciones por código para compartir listas.",
      "Sincronización de listas compartidas entre usuarios.",
      "Mejoras de permisos para owner y miembros.",
      "Ajustes de rendimiento en interacciones de compra."
    ]
  },
  {
    version: "1.3.0",
    title: "Mindful Redesign",
    releaseDate: "2026-05-29",
    summary: "Rediseño visual de landing, autenticación y dashboard con un lenguaje más cuidado.",
    highlights: [
      "Nueva experiencia visual de bienvenida y acceso.",
      "Fondos, tipografía y estilo de producto más consistentes.",
      "Mejor integración de la PWA y del acceso rápido a la app."
    ]
  },
  {
    version: "1.2.0",
    title: "Performance And Smart Interactions",
    releaseDate: "2026-05-27",
    summary: "La app mejora velocidad, historial y recomendaciones iniciales.",
    highlights: [
      "Interacciones más rápidas al crear listas y añadir productos.",
      "Sugerencias y análisis iniciales a partir del historial.",
      "Base estable para evolucionar desde MVP a producto."
    ]
  },
  {
    version: "1.0.0",
    title: "MVP Launch",
    releaseDate: "2026-05-25",
    summary: "Primer MVP funcional de RecordApp.",
    highlights: [
      "Autenticación con email y Google.",
      "Creación y gestión de listas de compra.",
      "Persistencia en Supabase y preparación PWA."
    ]
  }
];

export const currentAppRelease = appReleaseNotes[0];
