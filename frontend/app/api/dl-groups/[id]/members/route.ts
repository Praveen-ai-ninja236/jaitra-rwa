import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = parseInt(params.id, 10);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const tower = searchParams.get("tower") || undefined;
    const search = searchParams.get("search") || undefined;

    const members = await db.getDLMembers(groupId, status, tower, search);
    return NextResponse.json(members);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = parseInt(params.id, 10);
    const body = await req.json();

    // Check if it's bulk upload array or single member
    if (Array.isArray(body.members)) {
      const mode = body.mode === "replace" ? "replace" : "append";
      const result = await db.bulkCreateDLMembers(groupId, body.members, mode);
      return NextResponse.json(result);
    } else {
      const created = await db.createDLMember(groupId, body);
      return NextResponse.json(created);
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
