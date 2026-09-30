"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
export default function HomePage() { const router = useRouter(); useEffect(() => { router.replace(localStorage.getItem("token") ? "/dashboard/overview" : "/login"); }, [router]); return <div className="flex min-h-screen items-center justify-center bg-[#07111f]"><div className="text-center"><RefreshCw className="mx-auto mb-4 h-7 w-7 animate-spin text-blue-400" /><p className="text-sm text-slate-400">正在恢复安全工作区…</p></div></div>; }
