import { AidSystemOverview } from "@/components/platform-tour/aid-system-overview";
import { getPlatformTourSnapshot } from "@/lib/platform/platform-tour";

export default function PlatformTourPage() {
  return <AidSystemOverview data={getPlatformTourSnapshot()} />;
}
