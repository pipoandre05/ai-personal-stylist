export default function DetailSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Cargando la prenda…</span>
      <div aria-hidden="true">
        <div className="h-3 w-24 animate-respirar rounded-xs bg-hundido" />
        <div className="mt-3 h-8 w-56 animate-respirar rounded-xs bg-hundido" />
        <div className="mt-5 aspect-[3/4] animate-respirar rounded-md bg-hundido" />
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-respirar rounded-xs bg-hundido" />
          ))}
        </div>
      </div>
    </div>
  );
}
