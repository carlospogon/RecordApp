import Link from "next/link";
import { appReleaseNotes, currentAppRelease, developerSignature } from "@/lib/app-release";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(112,150,130,0.12),transparent_18%),linear-gradient(180deg,#faf9f6_0%,#f5efe6_100%)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[32px] border border-[var(--border)] bg-[rgba(255,255,255,0.82)] p-6 shadow-[var(--shadow)] backdrop-blur-[18px] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">WhatsNew</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--text)] sm:text-4xl">Novedades de RecordApp</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                Aquí te contamos, de forma sencilla y amigable, las mejoras que van llegando a RecordApp en cada versión.
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Version actual</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--accent-strong)]">{currentAppRelease.version}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">{developerSignature}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-5">
            {appReleaseNotes.map((release, index) => (
              <article
                key={release.version}
                className={`rounded-[28px] border p-5 sm:p-6 ${
                  index === 0
                    ? "border-[rgba(112,150,130,0.34)] bg-[linear-gradient(180deg,rgba(112,150,130,0.12)_0%,rgba(242,232,213,0.56)_100%)]"
                    : "border-[var(--border)] bg-[rgba(255,255,255,0.68)]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                        v{release.version}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{release.releaseDate}</span>
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--text)]">{release.title}</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">{release.summary}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {release.highlights.map((highlight) => (
                    <div key={highlight} className="rounded-[20px] border border-[rgba(112,150,130,0.16)] bg-[rgba(250,249,246,0.92)] px-4 py-4 text-sm leading-6 text-[var(--text)]">
                      {highlight}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Volver a la app</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Sigue usando RecordApp con la versión más reciente ya desplegada.</p>
            </div>
            <Link
              href="/app"
              className="rounded-full border border-[rgba(112,150,130,0.22)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            >
              Abrir RecordApp
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
