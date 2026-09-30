import { CollaborationCommandCenter } from "@/components/agent-collaboration/collaboration-command-center";

export default async function CollaborationRunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <div className="-mx-4 -my-5 min-h-[calc(100vh-72px)] bg-[#030a14] p-4 sm:-mx-6 sm:p-6 lg:-mx-8 lg:-my-7 lg:p-7"><CollaborationCommandCenter initialRunId={runId} /></div>;
}
