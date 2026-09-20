import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const festivalId = parseInt(params.id, 10);
    const body = await req.json();
    if (Array.isArray(body.expenses)) {
      const created = await db.bulkAddFestivalExpenses(festivalId, body.expenses);
      return NextResponse.json({ count: created.length, expenses: created });
    } else if (Array.isArray(body)) {
      const created = await db.bulkAddFestivalExpenses(festivalId, body);
      return NextResponse.json({ count: created.length, expenses: created });
    } else {
      const created = await db.addFestivalExpense(festivalId, body);
      return NextResponse.json(created);
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
