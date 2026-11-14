import { Screen, TopBar } from "@/components/ui";
import YoSkeleton from "./skeleton";

export default function Loading() {
  return (
    <Screen>
      <TopBar />
      <div className="px-5 pt-2 pb-12">
        <YoSkeleton />
      </div>
    </Screen>
  );
}
