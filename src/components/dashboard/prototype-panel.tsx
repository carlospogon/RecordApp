const sampleItems = [
  { name: "Huevos", quantity: "12", unit: "uds", status: "pending" },
  { name: "Patatas", quantity: "2", unit: "kg", status: "pending" },
  { name: "Arroz", quantity: "1", unit: "kg", status: "bought" }
];

const reminders = [
  "Hace dos semanas añadiste huevos. Revisa si ya necesitas otra docena.",
  "Patatas apareció en tus dos últimas listas. Comprueba si todavía te queda bolsa."
];

const frequentProducts = [
  { name: "Huevos", times: 5, cadence: "14 días" },
  { name: "Patatas", times: 4, cadence: "9 días" },
  { name: "Leche", times: 6, cadence: "6 días" }
];

export function PrototypePanel() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.5fr_0.95fr]">
      <div className="rounded-[28px] border border-white/10 bg-white p-6 text-[#12201a] shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e4ebe8] pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f766d]">Lista actual</p>
            <h2 className="mt-2 text-2xl font-semibold">Compra del lunes, 25 mayo</h2>
          </div>
          <div className="rounded-full bg-[#f0f5f2] px-4 py-2 text-sm font-medium text-[#456154]">
            2 pendientes · 1 comprado
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {sampleItems.map((item) => (
            <label
              key={item.name}
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#e4ebe8] px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={item.status === "bought"} readOnly className="h-4 w-4 accent-[#1f8a5f]" />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-[#62756d]">
                    {item.quantity} {item.unit}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#f0f5f2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#456154]">
                {item.status === "bought" ? "Comprado" : "Pendiente"}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-[#f2df92] bg-[#fff8da] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6b00]">Aviso de repetición</p>
          <p className="mt-2 text-sm leading-6 text-[#5c4c14]">
            Ojo, este producto ya apareció en una lista anterior. Revisa si todavía tienes suficiente antes de volver a comprarlo.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <section className="rounded-[28px] border border-white/10 bg-[#15211d] p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">Recordatorios</p>
          <div className="mt-4 space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder} className="rounded-2xl border border-white/10 bg-[#101816] px-4 py-4 text-sm leading-6 text-mint">
                {reminder}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-[#15211d] p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">Frecuentes</p>
          <div className="mt-4 space-y-3">
            {frequentProducts.map((product) => (
              <div key={product.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#101816] px-4 py-4">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-slate">{product.times} apariciones</p>
                </div>
                <span className="text-sm font-semibold text-lime">{product.cadence}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
