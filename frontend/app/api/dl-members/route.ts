import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupIdStr = searchParams.get("groupId");
    const groupId = groupIdStr ? parseInt(groupIdStr, 10) : undefined;
    const status = searchParams.get("status") || undefined;
    const tower = searchParams.get("tower") || undefined;
    const search = searchParams.get("search") || undefined;

    const members = await db.getDLMembers(groupId, status, tower, search);
    return NextResponse.json(members);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const groupId = body.group_id;
    if (!groupId) {
      return NextResponse.json({ error: "group_id is required" }, { status: 400 });
    }
    const created = await db.createDLMember(groupId, body);
    return NextResponse.json(created);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
