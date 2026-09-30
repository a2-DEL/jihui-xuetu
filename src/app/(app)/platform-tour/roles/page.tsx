import { RoleCollaborationOverview } from "@/components/platform-tour/role-collaboration-overview";
import { getPlatformTourSnapshot } from "@/lib/platform/platform-tour";

export default function PlatformTourRolesPage() {
  return <RoleCollaborationOverview data={getPlatformTourSnapshot()} />;
}
