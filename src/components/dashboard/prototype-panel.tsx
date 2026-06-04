const highlightRows = [
  {
    label: "Memoria histórica",
    title: "La app revisa compras previas antes de que repitas por costumbre.",
    detail: "Cada producto queda asociado a tu historial para avisarte si ya apareció recientemente."
  },
  {
    label: "Reposición visual",
    title: "Las sugerencias convierten tus compras en ritmos de reposición fáciles de leer.",
    detail: "Barras, timelines y reglas por categoría para saber si algo ya debería volver a entrar en la lista."
  },
  {
    label: "Catálogo propio",
    title: "Tus productos se convierten en un catálogo reutilizable y editable.",
    detail: "Puedes controlar unidades, categorías y visibilidad para que las sugerencias mejoren con el tiempo."
  }
];

export function PrototypePanel() {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <div className="rounded-[30px] border border-white/10 bg-[#121b18] p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">Por qué funciona</p>
        <h2 className="mt-3 text-3xl font-semibold">Menos olvido, menos duplicados, mejores decisiones.</h2>
        <p className="mt-4 text-base leading-8 text-slate">
          RecordApp no se queda en marcar productos. Usa tu historial para ayudarte a decidir qué comprar, cuándo
          reponerlo y qué complementos te pueden venir bien.
        </p>

        <div className="mt-6 space-y-4">
          {highlightRows.map((row) => (
            <article key={row.label} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime">{row.label}</p>
              <p className="mt-2 text-lg font-semibold text-white">{row.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate">{row.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[28px] border border-[#dfe7e1] bg-white p-5 shadow-[0_24px_50px_rgba(21,42,33,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5e7569]">Lo que ves al usarla</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] bg-[#f3f7f4] p-4">
              <p className="text-2xl font-semibold text-[#20342b]">1</p>
              <p className="mt-2 text-sm font-semibold text-[#20342b]">Creas la lista</p>
              <p className="mt-2 text-sm leading-6 text-[#62756d]">Añades productos y la app empieza a reconocer tus patrones.</p>
            </div>
            <div className="rounded-[22px] bg-[#f3f7f4] p-4">
              <p className="text-2xl font-semibold text-[#20342b]">2</p>
              <p className="mt-2 text-sm font-semibold text-[#20342b]">Comprueba repetidos</p>
              <p className="mt-2 text-sm leading-6 text-[#62756d]">Antes de duplicar compras, revisa si todavía debería quedarte producto.</p>
            </div>
            <div className="rounded-[22px] bg-[#f3f7f4] p-4">
              <p className="text-2xl font-semibold text-[#20342b]">3</p>
              <p className="mt-2 text-sm font-semibold text-[#20342b]">Recibe sugerencias</p>
              <p className="mt-2 text-sm leading-6 text-[#62756d]">Visualiza reposiciones, complementarios y pequeñas ayudas útiles.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#dfe7e1] bg-[linear-gradient(135deg,#f7fbf8_0%,#edf5ef_100%)] p-5 shadow-[0_24px_50px_rgba(21,42,33,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5e7569]">Pensada para el día a día</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] bg-white p-4">
              <p className="text-sm font-semibold text-[#20342b]">Rápida en móvil</p>
              <p className="mt-2 text-sm leading-6 text-[#62756d]">
                La experiencia está preparada para abrir la lista, marcar compras y revisar sugerencias sin fricción.
              </p>
            </div>
            <div className="rounded-[22px] bg-white p-4">
              <p className="text-sm font-semibold text-[#20342b]">Lista para crecer</p>
              <p className="mt-2 text-sm leading-6 text-[#62756d]">
                Ya tiene base para PWA, push notifications, reglas más ricas y recomendaciones futuras.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
