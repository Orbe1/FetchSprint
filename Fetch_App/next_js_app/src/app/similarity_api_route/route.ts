import { NextRequest, NextResponse } from "next/server";
import { similarity_service } from "../user_similarity_algorithm/similarity_service";

interface SimilarityRequest {
  loggedInUserId?: string;
  targetUserId?: string;
  action?: "similarity" | "refresh";
}

interface SimilarityResponse {
  similarity?: number;
  error?: string;
}

async function calculateSimilarity(
  userId1: string,
  userId2: string
): Promise<{ similarity_score?: number; error?: string }> {
  try {
    const similarity_score = similarity_service.get_similarity(
      userId1,
      userId2
    );

    if (similarity_score === undefined || similarity_score === null) {
      alert("Empty response from calculation");
      return { similarity_score: 0, error: "Empty response from calculation" };
    }

    if (isNaN(similarity_score)) {
      throw new Error("Invalid similarity score: not a number");
    }

    if (similarity_score < 0 || similarity_score > 1) {
      throw new Error(
        `Similarity score out of expected range: ${similarity_score}`
      );
    }

    return { similarity_score };
  } catch (error) {
    alert(`Failed to calculate similarity: ${(error as Error).message}`);
    return {
      error: `Failed to calculate similarity: ${
        (error as Error).message || "Unknown error"
      }`,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SimilarityRequest = await request.json();
    const { loggedInUserId, targetUserId, action = "similarity" } = body;

    if (action === "refresh") {
      try {
        await similarity_service.refresh_data();
        return NextResponse.json({
          success: true,
          message: "Similarity data refreshed successfully",
        });
      } catch (error) {
        return NextResponse.json(
          { error: "Failed to refresh similarity data" },
          { status: 500 }
        );
      }
    }
    if (!loggedInUserId || !targetUserId) {
      return NextResponse.json(
        { error: "Missing required user IDs for similarity calculation" },
        { status: 400 }
      );
    }

    const similarity = await calculateSimilarity(loggedInUserId, targetUserId);
    let result: SimilarityResponse = {};

    if (similarity.similarity_score !== undefined) {
      result.similarity = similarity.similarity_score;
    } else if (similarity.error) {
      result.error = similarity.error;
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const targetUserId = searchParams.get("targetUserId");

  if (!userId || !targetUserId) {
    return NextResponse.json(
      { error: "Missing userId or targetUserId parameter" },
      { status: 400 }
    );
  }

  try {
    const similarityResult = await calculateSimilarity(userId, targetUserId);

    let result: SimilarityResponse = {};
    if (similarityResult.similarity_score !== undefined) {
      result.similarity = similarityResult.similarity_score;
    } else if (similarityResult.error) {
      result.error = similarityResult.error;
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
