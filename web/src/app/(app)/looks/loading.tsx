import { Screen, TopBar } from "@/components/ui";
import LooksSkeleton from "./skeleton";

export default function Loading() {
  return (
    <Screen>
      <TopBar />
      <div className="px-5 pt-2 pb-10">
        <LooksSkeleton />
      </div>
    </Screen>
  );
}
