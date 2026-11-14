/** Esqueleto del clóset: encabezado, filtro y 9 miniaturas. Solo `opacity` y `transform`. */
export default function ClosetSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Cargando tu clóset…</span>
      <div aria-hidden="true">
        <div className="h-3 w-20 animate-respirar rounded-xs bg-hundido" />
        <div className="mt-3 h-8 w-40 animate-respirar rounded-xs bg-hundido" />
        <div className="mt-6 flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-11 w-20 animate-respirar rounded-full bg-hundido" />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-x-2 gap-y-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] animate-respirar rounded-md bg-hundido" />
              <div className="mt-1.5 h-3 w-3/4 animate-respirar rounded-xs bg-hundido" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
