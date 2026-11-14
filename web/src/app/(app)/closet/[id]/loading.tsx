import { Screen, TopBar } from "@/components/ui";
import DetailSkeleton from "./skeleton";

export default function Loading() {
  return (
    <Screen>
      <TopBar backHref="/closet" backLabel="Volver a tu clóset" />
      <div className="px-5 pt-2 pb-10">
        <DetailSkeleton />
      </div>
    </Screen>
  );
}
