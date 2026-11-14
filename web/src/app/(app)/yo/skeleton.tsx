export default function YoSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Cargando tu perfil…</span>
      <div aria-hidden="true">
        <div className="h-3 w-20 animate-respirar rounded-xs bg-hundido" />
        <div className="mt-3 h-8 w-36 animate-respirar rounded-xs bg-hundido" />
        <div className="mt-5 h-[88px] animate-respirar rounded-md bg-hundido" />
        <div className="mt-10 h-6 w-32 animate-respirar rounded-xs bg-hundido" />
        <div className="mt-4 grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-respirar rounded-sm bg-hundido" />
          ))}
        </div>
      </div>
    </div>
  );
}
