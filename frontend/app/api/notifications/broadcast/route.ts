import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const created = await db.createBroadcastNotification(body);

    // Also record in audit log
    await db.insertAuditLog({
      user_name: body.sent_by || "Admin",
      user_role: "Admin",
      action: "CREATE",
      entity_type: "broadcast_notification",
      entity_id: created.id,
      entity_label: body.subject || "Notification",
      details: `Dispatched ${body.channel || "Multi-Channel"} notification "${body.subject}" to ${body.active_recipients_count || 0} active members across groups: ${body.group_names || ""}`,
    });

    return NextResponse.json({
      success: true,
      message: `Notification "${body.subject}" broadcast logged successfully to ${body.active_recipients_count} active DL recipients.`,
      notification: created,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
