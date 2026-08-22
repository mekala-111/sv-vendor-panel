import { NextResponse } from "next/server";
import { createEventPreviewToken } from "@/lib/server-data";

export async function POST(req: Request) {
  try {
    const { eventId } = (await req.json()) as { eventId?: string };
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }
    const data = await createEventPreviewToken(eventId);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Preview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
