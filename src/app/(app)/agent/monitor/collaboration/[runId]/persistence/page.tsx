import { CollaborationPersistenceProofView } from "@/components/agent-collaboration/collaboration-persistence-proof";

export default async function CollaborationPersistencePage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <div className="-mx-4 -my-5 min-h-[calc(100vh-72px)] bg-[#030a14] p-4 sm:-mx-6 sm:p-6 lg:-mx-8 lg:-my-7 lg:p-7"><CollaborationPersistenceProofView runId={runId}/></div>;
}
