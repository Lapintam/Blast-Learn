import { NextResponse } from "next/server";
import { z } from "zod";
import { gatewayFetch } from "@/lib/api/gateway";
import { requireTenantSession } from "@/lib/auth/session";

const QuerySchema = z.object({
  question: z.string().min(5),
  contextNodeIds: z.array(z.string()).optional(),
  facilityId: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await requireTenantSession();
  const body = await request.json();
  const payload = QuerySchema.safeParse(body);
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  try {
    const result = await gatewayFetch("/query", { method: "POST", body: JSON.stringify(payload.data) }, session);
    return NextResponse.json(result);
  } catch (error) {
    console.error("/api/query failed", error);
    return NextResponse.json({ error: "Query failed" }, { status: 502 });
  }
}
