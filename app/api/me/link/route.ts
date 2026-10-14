// GET /api/me/link?t=<token> — opens a profile on this device via its private link.
import { NextResponse } from "next/server";
import { userByToken, USER_COOKIE, cookieOptions } from "@/lib/users";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Relative redirect. Behind Render's proxy, req.url is the internal address (https://localhost:10000),
 * so an absolute URL built from it sends people to localhost. Browsers resolve a relative Location
 * against the address they actually opened.
 */
function redirectTo(path: string) {
  return new NextResponse(null, { status: 307, headers: { Location: path } });
}

export async function GET(req: Request) {
  const limited = rateLimit(req, "privateLink");
  if (limited) return limited;
  const user = await userByToken(new URL(req.url).searchParams.get("t"));
  if (!user) return redirectTo("/onboarding?link=invalid");
  const res = redirectTo("/dashboard");
  res.cookies.set(USER_COOKIE, user.token, cookieOptions);
  return res;
}
