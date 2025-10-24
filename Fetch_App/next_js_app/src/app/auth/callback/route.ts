import { NextRequest, NextResponse } from "next/server";
import createServerClient from "@/app/utils/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  // Helper to build a redirect with best-effort host handling
  const redirectTo = (path: string) => {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    if (isLocalEnv) return NextResponse.redirect(`${origin}${path}`);
    if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${path}`);
    return NextResponse.redirect(`${origin}${path}`);
  };

  try {
    const supabase = await createServerClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return redirectTo(`/error?message=${encodeURIComponent(error.message)}`);
      }
      // If the link was a password recovery using the code flow, steer to reset UI
      if (typeParam === "recovery") {
        return redirectTo(`/reset-password`);
      }
      return redirectTo(next);
    }

    // Support legacy token_hash links (verifyOtp)
    if (token_hash && typeParam) {
      const { error } = await supabase.auth.verifyOtp({
        type: typeParam,
        token_hash,
      });
      if (error) {
        return redirectTo(`/error?message=${encodeURIComponent(error.message)}`);
      }
      if (typeParam === "recovery") {
        return redirectTo(`/reset-password`);
      }
      return redirectTo(next);
    }

    return redirectTo(
      `/error?message=${encodeURIComponent("No authorization parameters provided")}`
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Authentication failed";
    return redirectTo(`/error?message=${encodeURIComponent(msg)}`);
  }
}
