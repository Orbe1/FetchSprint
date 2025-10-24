import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileCandidate = formData.get("file") ?? formData.get("receipt");

    if (!(fileCandidate instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    return NextResponse.json({
      name: fileCandidate.name,
      size: fileCandidate.size,
      type: fileCandidate.type,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[receipt-upload] error", message);
    return NextResponse.json(
      { error: "Upload failed", message },
      { status: 500 }
    );
  }
}

