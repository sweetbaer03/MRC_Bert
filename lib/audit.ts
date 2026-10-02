import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export type AuditActor =
  | { type: "ADMIN"; email: string }
  | { type: "SUBMITTER"; label: string }
  | { type: "SYSTEM" };

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
}

export async function audit(actor: AuditActor, action: string, target?: string, detail?: string) {
  const actorName = actor.type === "ADMIN" ? actor.email : actor.type === "SUBMITTER" ? actor.label : "system";
  await prisma.auditLog.create({
    data: { actorType: actor.type, actor: actorName, action, target, detail, ip: await clientIp() },
  });
}
