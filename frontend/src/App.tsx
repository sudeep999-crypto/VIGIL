export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-sm text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Frontend Scaffold Ready
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          VIGIL
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Predictive Early-Warning System for PAIMANA. Vite + React + Tailwind CSS initialized.
        </p>
      </div>
    </main>
  )
}
