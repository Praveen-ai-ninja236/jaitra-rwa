import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    const group = await db.getDLGroup(id);
    if (!group) {
      return NextResponse.json({ error: "DL Group not found" }, { status: 404 });
    }
    return NextResponse.json(group);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    const body = await req.json();
    const updated = await db.updateDLGroup(id, body);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    await db.deleteDLGroup(id);
    return NextResponse.json({ message: "DL Group deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
