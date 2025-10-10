import { toast } from "sonner";

export async function getEmbeddingFromAPI(skill: string): Promise<number[]> {
  try {
    const response = await fetch("/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ skill }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || "Failed to generate embedding");
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    toast.error("Error getting embedding", {
      description: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
