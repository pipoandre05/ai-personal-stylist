import { Screen, TopBar } from "@/components/ui";
import PaletaSkeleton from "./skeleton";

export default function Loading() {
  return (
    <Screen>
      <TopBar backHref="/yo" backLabel="Volver a tu perfil" />
      <div className="px-5 pt-2 pb-12">
        <PaletaSkeleton />
      </div>
    </Screen>
  );
}
