import { useState, useCallback } from "react";
import { UseSimilarityReturn } from "@/types/types";

export function useSimilarity(): UseSimilarityReturn {
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateSimilarity = useCallback(
    async (loggedInUserId: string, targetUserId: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/similarity_api_route", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            loggedInUserId,
            targetUserId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to calculate similarity");
        }

        setSimilarity(data.similarity);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refreshSimilarityData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await fetch("/similarity_api_route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "refresh",
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setSimilarity(null);
    setError(null);
  }, []);

  return {
    similarity,
    loading,
    error,
    calculateSimilarity,
    refreshSimilarityData,
    clearResults,
  };
}
