import { NextResponse } from "next/server";
import { gatewayFetch } from "@/lib/api/gateway";
import { requireTenantSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireTenantSession();
  const formData = await request.formData();
  const forward = new FormData();
  const files = formData.getAll("files");
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }
  for (const file of files) {
    if (file instanceof File) {
      forward.append("files", file, file.name);
    }
  }
  try {
    const response = await gatewayFetch("/ingest/hierarchy", { method: "POST", body: forward }, session);
    return NextResponse.json(response);
  } catch (error) {
    console.error("hierarchy upload failed", error);
    return NextResponse.json({ error: "Failed to start ingestion" }, { status: 502 });
  }
}
