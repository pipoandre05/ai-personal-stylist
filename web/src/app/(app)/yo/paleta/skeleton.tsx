export default function PaletaSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Cargando tu paleta…</span>
      <div aria-hidden="true">
        <div className="h-3 w-28 animate-respirar rounded-xs bg-hundido" />
        <div className="mt-3 h-10 w-52 animate-respirar rounded-xs bg-hundido" />
        <div className="mt-8 grid grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square animate-respirar rounded-sm bg-hundido" />
          ))}
        </div>
      </div>
    </div>
  );
}
