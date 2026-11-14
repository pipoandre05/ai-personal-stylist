export default function LooksSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Cargando tus looks…</span>
      <div aria-hidden="true">
        <div className="h-3 w-20 animate-respirar rounded-xs bg-hundido" />
        <div className="mt-3 h-8 w-40 animate-respirar rounded-xs bg-hundido" />
        <div className="mt-8 space-y-6">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-md border border-linea bg-superficie p-4">
              <div className="h-3 w-28 animate-respirar rounded-xs bg-hundido" />
              <div className="mt-3 h-7 w-48 animate-respirar rounded-xs bg-hundido" />
              <div className="mt-4 grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="aspect-[3/4] animate-respirar rounded-sm bg-hundido" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
