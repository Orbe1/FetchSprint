import { NextRequest, NextResponse } from "next/server";

type YoutubeSearchResponse = {
  items: Array<{
    id: {
      videoId?: string;
    };
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      publishedAt: string;
      thumbnails?: Record<
        string,
        {
          url: string;
        }
      >;
    };
  }>;
};

type VideoDurationFilter = "short" | "medium" | "long";

type TrendVideo = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string | null;
  url: string;
};

const YOUTUBE_SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
const MAX_RESULTS = 6;

export const dynamic = "force-dynamic";

async function searchVideos(
  query: string,
  duration: VideoDurationFilter,
  apiKey: string,
  signal: AbortSignal
): Promise<TrendVideo[]> {
  const params = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(MAX_RESULTS),
    videoEmbeddable: "true",
    order: "viewCount",
    videoDuration: duration,
    safeSearch: "moderate",
  });

  const response = await fetch(`${YOUTUBE_SEARCH_ENDPOINT}?${params}`, {
    signal,
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "");
    throw new Error(
      `YouTube search failed (${response.status}): ${error || response.statusText}`
    );
  }

  const payload = (await response.json()) as YoutubeSearchResponse;

  return (
    payload.items
      ?.map((item) => {
        const videoId = item.id.videoId;
        if (!videoId) {
          return null;
        }

        const thumb =
          item.snippet.thumbnails?.high?.url ??
          item.snippet.thumbnails?.medium?.url ??
          null;

        return {
          id: videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          thumbnail: thumb,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        } satisfies TrendVideo;
      })
      .filter(Boolean) ?? []
  ) as TrendVideo[];
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "YouTube API key is not configured. Please add YOUTUBE_API_KEY to your environment.",
      },
      { status: 500 }
    );
  }

  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter `q`." },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const [shorts, longForm] = await Promise.all([
      searchVideos(query, "short", apiKey, controller.signal),
      searchVideos(query, "long", apiKey, controller.signal),
    ]);

    clearTimeout(timeout);

    /**
     * Some keywords have limited long-form content. As a fallback,
     * try medium-length videos if long-form results are empty.
     */
    const resolvedLongForm =
      longForm.length > 0
        ? longForm
        : await searchVideos(query, "medium", apiKey, controller.signal);

    return NextResponse.json({
      shorts,
      longForm: resolvedLongForm,
    });
  } catch (error) {
    clearTimeout(timeout);
    console.error("Failed to fetch YouTube trends", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while contacting YouTube.",
      },
      { status: error instanceof Error && /aborted/i.test(error.message) ? 504 : 502 }
    );
  }
}
