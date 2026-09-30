import { VideoProductionStudio } from "@/components/video/video-production-studio";
export default async function VideoStudioPage({searchParams}:{searchParams:Promise<{runId?:string}>}){const params=await searchParams;return <VideoProductionStudio runId={params.runId??"HGR-VIDEO-009-e07b8742"}/>}
