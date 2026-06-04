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
    version: "1.7.0",
    title: "Smart Shopping Flow",
    releaseDate: "2026-06-04",
    summary:
      "Hola! Sabias que en RecordApp hemos anadido nuevas cositas? Ahora los productos pueden organizarse por secciones, llevar notas utiles, entrar en un modo compra mas claro y categorizarse automaticamente cuando escribes cosas como platanos, leche o queso. Desde el equipo de RecordApp esperamos que te gusten!",
    highlights: [
      "Tus productos ahora se agrupan por secciones como Fruta, Lacteos u Hogar para que la lista tenga mas sentido al comprar.",
      "Cada producto puede llevar una nota rapida, por ejemplo: sin gluten, marca habitual o pasillo.",
      "Hemos anadido un modo compra mas tactil para marcar productos sobre la marcha sin perder el contexto de la lista.",
      "La categoria se detecta automaticamente al escribir nombres como platanos, banana, leche o queso, incluso con plurales o tildes."
    ]
  },
  {
    version: "1.6.0",
    title: "Navigation And Product Polish",
    releaseDate: "2026-06-03",
    summary: "RecordApp pasa a una estructura de producto mas clara, con panel lateral, version visible y novedades por release.",
    highlights: [
      "Nuevo panel lateral desplegable para navegar mejor por la app.",
      "WhatsNew sustituye a la antigua pantalla de ayuda tecnica.",
      "La version actual de la app queda visible dentro del menu.",
      "La firma de producto queda integrada en la navegacion."
    ]
  },
  {
    version: "1.5.0",
    title: "Shared Spaces And Identity",
    releaseDate: "2026-06-02",
    summary: "La app ya permite organizar compras compartidas por espacios y mejora la identidad visual del usuario.",
    highlights: [
      "Se anaden espacios compartidos con codigo de acceso.",
      "Las listas pueden nacer directamente dentro de un espacio.",
      "Se puede eliminar un espacio cuando el owner lo necesite.",
      "La cabecera de la app muestra avatar o iniciales del usuario."
    ]
  },
  {
    version: "1.4.0",
    title: "Shared Lists",
    releaseDate: "2026-05-30",
    summary: "RecordApp incorpora listas compartidas y sincronizacion entre miembros.",
    highlights: [
      "Invitaciones por codigo para compartir listas.",
      "Sincronizacion de listas compartidas entre usuarios.",
      "Mejoras de permisos para owner y miembros.",
      "Ajustes de rendimiento en interacciones de compra."
    ]
  },
  {
    version: "1.3.0",
    title: "Mindful Redesign",
    releaseDate: "2026-05-29",
    summary: "Rediseno visual de landing, autenticacion y dashboard con un lenguaje mas cuidado.",
    highlights: [
      "Nueva experiencia visual de bienvenida y acceso.",
      "Fondos, tipografia y estilo de producto mas consistentes.",
      "Mejor integracion de la PWA y del acceso rapido a la app."
    ]
  },
  {
    version: "1.2.0",
    title: "Performance And Smart Interactions",
    releaseDate: "2026-05-27",
    summary: "La app mejora velocidad, historial y recomendaciones iniciales.",
    highlights: [
      "Interacciones mas rapidas al crear listas y anadir productos.",
      "Sugerencias y analisis iniciales a partir del historial.",
      "Base estable para evolucionar desde MVP a producto."
    ]
  },
  {
    version: "1.0.0",
    title: "MVP Launch",
    releaseDate: "2026-05-25",
    summary: "Primer MVP funcional de RecordApp.",
    highlights: [
      "Autenticacion con email y Google.",
      "Creacion y gestion de listas de compra.",
      "Persistencia en Supabase y preparacion PWA."
    ]
  }
];

export const currentAppRelease = appReleaseNotes[0];
