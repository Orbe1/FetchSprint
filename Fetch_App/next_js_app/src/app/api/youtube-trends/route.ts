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

type SearchOptions = {
  daysBack: number;
  finalCount?: number;
  regionCode?: string;
  allowRelevanceFallback?: boolean;
};

const YOUTUBE_SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
const DEFAULT_FINAL_COUNT = 6;
const POOL_MULTIPLIER = 3;

export const dynamic = "force-dynamic";

const toIsoDate = (daysBack: number) =>
  new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

const shuffle = <T,>(list: T[]): T[] => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const uniqueById = (videos: TrendVideo[]) => {
  const seen = new Set<string>();
  return videos.filter((video) => {
    if (seen.has(video.id)) {
      return false;
    }
    seen.add(video.id);
    return true;
  });
};

async function searchVideos(
  query: string,
  duration: VideoDurationFilter,
  apiKey: string,
  signal: AbortSignal,
  options: SearchOptions
): Promise<TrendVideo[]> {
  const finalCount = options.finalCount ?? DEFAULT_FINAL_COUNT;
  const poolSize = Math.min(50, finalCount * POOL_MULTIPLIER);
  const daysWindow = Math.max(1, Math.round(options.daysBack));
  const randomOffset = Math.floor(Math.random() * daysWindow);
  const effectiveDays = Math.max(1, Math.min(daysWindow, randomOffset + 1));

  const params = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(poolSize),
    videoEmbeddable: "true",
    videoDuration: duration,
    safeSearch: "moderate",
    order: "date",
    publishedAfter: toIsoDate(effectiveDays),
  });

  if (options.regionCode) {
    params.set("regionCode", options.regionCode);
  }

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

  const mapped: Array<TrendVideo | null> = payload.items?.map((item) => {
    const videoId = item.id.videoId;
    if (!videoId) {
      return null;
    }

    const thumb =
      item.snippet.thumbnails?.high?.url ??
      item.snippet.thumbnails?.medium?.url ??
      null;

    const video: TrendVideo = {
      id: videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnail: thumb,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };

    return video;
  }) ?? [];

  let results = uniqueById(
    shuffle(mapped.filter((video): video is TrendVideo => video !== null))
  );

  if (results.length === 0 && options.allowRelevanceFallback) {
    params.set("order", "relevance");
    params.delete("publishedAfter");

    const fallbackResponse = await fetch(
      `${YOUTUBE_SEARCH_ENDPOINT}?${params.toString()}`,
      {
        signal,
        next: { revalidate: 0 },
      }
    );

    if (fallbackResponse.ok) {
      const fallbackPayload =
        (await fallbackResponse.json()) as YoutubeSearchResponse;

      const fallbackMapped: Array<TrendVideo | null> =
        fallbackPayload.items?.map((item) => {
          const videoId = item.id.videoId;
          if (!videoId) {
            return null;
          }

          const thumb =
            item.snippet.thumbnails?.high?.url ??
            item.snippet.thumbnails?.medium?.url ??
            null;

          const video: TrendVideo = {
            id: videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            thumbnail: thumb,
            url: `https://www.youtube.com/watch?v=${videoId}`,
          };

          return video;
        }) ?? [];

      const fallbackVideos = fallbackMapped.filter(
        (video): video is TrendVideo => video !== null
      );

      results = uniqueById(shuffle(fallbackVideos));
    }
  }

  return results.slice(0, finalCount);
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

  const regionCode =
    request.nextUrl.searchParams.get("region") ??
    process.env.YOUTUBE_REGION ??
    process.env.YOUTUBE_REGION_CODE ??
    undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const [shorts, longForm] = await Promise.all([
      searchVideos(query, "short", apiKey, controller.signal, {
        daysBack: 10,
        regionCode,
        allowRelevanceFallback: true,
      }),
      searchVideos(query, "long", apiKey, controller.signal, {
        daysBack: 30,
        regionCode,
        allowRelevanceFallback: true,
      }),
    ]);

    clearTimeout(timeout);

    /**
     * Some keywords have limited long-form content. As a fallback,
     * try medium-length videos if long-form results are empty.
     */
    const resolvedLongForm =
      longForm.length > 0
        ? longForm
        : await searchVideos(query, "medium", apiKey, controller.signal, {
            daysBack: 45,
            regionCode,
            allowRelevanceFallback: true,
          });

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
