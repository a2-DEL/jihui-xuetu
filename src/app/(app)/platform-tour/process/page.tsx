import { CoreProcessOverview } from "@/components/platform-tour/core-process-overview";
import { getPlatformTourSnapshot } from "@/lib/platform/platform-tour";

export default function PlatformTourProcessPage() {
  return <CoreProcessOverview data={getPlatformTourSnapshot()} />;
}
