import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const festivalId = parseInt(params.id, 10);
    const body = await req.json();
    if (Array.isArray(body.collections)) {
      const created = await db.bulkAddFestivalCollections(festivalId, body.collections);
      return NextResponse.json({ count: created.length, collections: created });
    } else if (Array.isArray(body)) {
      const created = await db.bulkAddFestivalCollections(festivalId, body);
      return NextResponse.json({ count: created.length, collections: created });
    } else {
      const created = await db.addFestivalCollection(festivalId, body);
      return NextResponse.json(created);
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
