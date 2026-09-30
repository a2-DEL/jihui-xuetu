"use client";

import React from "react";
import { Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <Construction className="w-16 h-16 text-amber-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">功能开发中</h2>
      <p className="text-gray-500 mb-4">该功能模块正在紧张开发中，敬请期待</p>
      <Link href="/dashboard/overview" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-4 h-4" />
        返回首页
      </Link>
    </div>
  );
}
