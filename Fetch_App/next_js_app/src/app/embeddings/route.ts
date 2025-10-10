import { NextRequest, NextResponse } from "next/server";
const huggingFaceUrl =
  "https://api-inference.huggingface.co/models/BAAI/bge-small-en-v1.5";
export async function POST(request: NextRequest) {
  try {
    const { skill } = await request.json();

    if (!skill) {
      return NextResponse.json({ error: "Skill is required" }, { status: 400 });
    }

    const apiKey = process.env.HF_WRITE_TOKEN;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Hugging Face API key is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(huggingFaceUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: skill,
        options: {
          wait_for_model: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Hugging Face API error: ${response.status} - ${errorText}`
      );
    }

    const embedding = await response.json();

    return NextResponse.json({ embedding: embedding });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate embedding", details: errorMessage },
      { status: 500 }
    );
  }
}
