import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const token = req.headers.get("cookie")?.match(/session=([^;]+)/)?.[1] || "";
  const user = (await getSessionUser(token)) as any;
  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      verified: !!user.verified,
      subscription_tier: user.subscription_tier,
      subscription_status: user.subscription_status,
    },
  });
}
