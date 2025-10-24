import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions" as const;

function friendlyFallback(itemName: string) {
  const base = itemName.trim().slice(0, 60);
  // Simple, fast fallback under 120 chars with 1-2 emojis
  return `New find: ${base}! ✨ Great pick for today.`;
}

export async function POST(request: NextRequest) {
  try {
    const { itemName } = await request.json();
    if (!itemName || typeof itemName !== "string") {
      return NextResponse.json(
        { error: "'itemName' is required and must be a string" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const promptSystem =
      "You craft short, catchy social-media captions. Keep under 120 characters. Use 1-2 relevant emojis. No hashtags unless explicitly asked. Avoid quotation marks.";
    const promptUser = `Item: ${itemName}\nWrite a short caption.`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    const referer = process.env.NEXT_PUBLIC_SITE_URL;
    if (referer) headers["HTTP-Referer"] = referer;
    headers["X-Title"] = "Fetch App AI Captions";

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo",
        messages: [
          { role: "system", content: promptSystem },
          { role: "user", content: promptUser },
        ],
        temperature: 0.6,
        max_tokens: 48,
      }),
    });

    if (!response.ok) {
      let message = "Upstream request failed";
      try {
        const j = await response.json();
        message = j?.error?.message || j?.message || message;
      } catch {}

      // Friendly fallback for auth/rate issues so UI still works
      if (response.status === 401 || response.status === 429) {
        return NextResponse.json({
          caption: friendlyFallback(itemName),
          fallback: true,
          error: message,
          upstreamStatus: response.status,
        });
      }

      return NextResponse.json(
        { error: message, upstreamStatus: response.status },
        { status: response.status }
      );
    }

    const data = (await response.json()) as any;
    const caption = data?.choices?.[0]?.message?.content?.trim();
    if (!caption) {
      return NextResponse.json(
        { error: "Failed to generate caption" },
        { status: 502 }
      );
    }
    return NextResponse.json({ caption });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
