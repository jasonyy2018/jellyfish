import { db } from "@jellyfish/db";

export async function resolveUserByApiKey(request: Request) {
  const apiKey = request.headers.get("x-api-key")?.trim();
  if (!apiKey) return null;
  return db.user.findUnique({
    where: { apiKey },
    select: { id: true, email: true, plan: true },
  });
}
