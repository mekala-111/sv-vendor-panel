import { NextResponse } from "next/server";
import { createInvitationPreviewToken } from "@/lib/server-data";

export async function POST(req: Request) {
  try {
    const { invitationId } = (await req.json()) as { invitationId?: string };
    if (!invitationId) {
      return NextResponse.json({ error: "invitationId is required" }, { status: 400 });
    }
    const data = await createInvitationPreviewToken(invitationId);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Preview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
