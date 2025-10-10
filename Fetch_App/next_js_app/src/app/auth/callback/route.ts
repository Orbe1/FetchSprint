import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase/client";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    try {
      const { error: _error } = await supabase.auth.exchangeCodeForSession(
        code
      );

      if (!_error) {
        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(`${origin}${next}`);
        }
      } else {
        return NextResponse.redirect(
          `${origin}/error?message=${encodeURIComponent(_error.message)}`
        );
      }
    } catch (_error) {
      return NextResponse.redirect(
        `${origin}/error?message=${encodeURIComponent("Authentication failed")}`
      );
    }
  }

  return NextResponse.redirect(
    `${origin}/error?message=${encodeURIComponent(
      "No authorization code provided"
    )}`
  );
}
