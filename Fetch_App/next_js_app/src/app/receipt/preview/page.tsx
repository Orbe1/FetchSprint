"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import supabase from "@/app/utils/supabase/client";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";

type ReceiptItem = {
  name: string;
  price: number;
};

type ReceiptUploadResponse = {
  name: string;
  size: number;
  receiptText: string;
  items: ReceiptItem[];
  summary?: {
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
  };
};

type TrendVideo = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string | null;
  url: string;
};

type TrendsPayload = {
  shorts: TrendVideo[];
  longForm: TrendVideo[];
};

const RECEIPT_STORAGE_PREFIX = "fetchSprint:receipt:";
const TREND_SKELETON_COUNT = 3;

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatCurrency = (value: number, currency?: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency ?? "USD",
      minimumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    console.error("Currency formatting failed", error);
    return `$${value.toFixed(2)}`;
  }
};

const formatPublishedDate = (isoDate: string) => {
  try {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) {
      return isoDate;
    }
    return parsed.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    console.error("Date formatting failed", error);
    return isoDate;
  }
};

function ReceiptPreviewContent() {
  const searchParams = useSearchParams();
  const receiptId = searchParams.get("id");
  const router = useRouter();

  const [receipt, setReceipt] = useState<ReceiptUploadResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<ReceiptItem | null>(null);
  const [trends, setTrends] = useState<TrendsPayload | null>(null);
  const [trendsStatus, setTrendsStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const trendsCacheRef = useRef<Map<string, TrendsPayload>>(new Map());
  const pendingRequestRef = useRef<AbortController | null>(null);
  const aiCaptionCacheRef = useRef<Map<string, string>>(new Map());
  const [aiCaptions, setAiCaptions] = useState<Record<string, string>>({});
  const [captionLoading, setCaptionLoading] = useState<Record<string, boolean>>({});

  const getAICaption = useCallback(
    async (video: TrendVideo, contextItem?: string) => {
      const cached = aiCaptionCacheRef.current.get(video.id);
      if (cached) return cached;
      if (captionLoading[video.id]) return "";
      try {
        setCaptionLoading((s) => ({ ...s, [video.id]: true }));
        const subject = contextItem ? `${contextItem} — ${video.title}` : video.title;
        const res = await fetch("/api/ai-captions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemName: subject }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "AI caption failed");
        const caption = String(data.caption || "").trim();
        if (caption) {
          aiCaptionCacheRef.current.set(video.id, caption);
          setAiCaptions((prev) => ({ ...prev, [video.id]: caption }));
        }
        return caption;
      } catch (e) {
        return "";
      } finally {
        setCaptionLoading((s) => ({ ...s, [video.id]: false }));
      }
    },
    [captionLoading]
  );

  useEffect(() => {
    if (!receiptId) {
      setError("Receipt preview not found. Please upload a receipt again.");
      setIsLoading(false);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    try {
      const storageKey = `${RECEIPT_STORAGE_PREFIX}${receiptId}`;
      const cached = window.sessionStorage.getItem(storageKey);

      if (!cached) {
        setError(
          "We couldn't locate that receipt preview. Please upload another receipt."
        );
        return;
      }

      const parsed = JSON.parse(cached) as ReceiptUploadResponse;
      setReceipt(parsed);
    } catch (parseError) {
      console.error("Failed to read receipt preview", parseError);
      setError(
        "We couldn't read the receipt preview. Please upload another receipt."
      );
    } finally {
      setIsLoading(false);
    }
  }, [receiptId]);

  const receiptLines = useMemo(
    () => (receipt?.receiptText ? receipt.receiptText.split("\n") : []),
    [receipt]
  );

  const indexedItems = useMemo(() => {
    if (!receipt) {
      return [];
    }

    return receipt.items.map((item) => ({
      item,
      normalizedName: item.name.toLowerCase(),
    }));
  }, [receipt]);

  const renderVideoCard = (
    video: TrendVideo,
    variant: "short" | "long",
    refItemName?: string | null
  ) => {
    const badgeStyles =
      variant === "short"
        ? "bg-rose-100/90 text-rose-700 border border-rose-200"
        : "bg-slate-100/90 text-slate-700 border border-slate-200";

    const shareParams = new URLSearchParams({
      vId: video.id,
      vTitle: video.title,
      vUrl: video.url,
      vThumb: video.thumbnail ?? "",
      vChannel: video.channelTitle,
    });
    if (refItemName) {
      shareParams.set("refItem", refItemName);
    }

    const handleShare = async () => {
      try {
        const { data, error } = await supabase().auth.getUser();
        // If a caption is already available, include it; do not auto-generate here
        const existing =
          aiCaptionCacheRef.current.get(video.id) || aiCaptions[video.id];
        if (existing) shareParams.set("vCaption", existing);
        const target = `/create_post?${shareParams.toString()}`;
        if (error || !data?.user) {
          router.push(`/login?next=${encodeURIComponent(target)}`);
          return;
        }
        router.push(target);
      } catch (e) {
        router.push(`/login?next=${encodeURIComponent(`/create_post?${shareParams.toString()}`)}`);
      }
    };

    return (
      <div
        key={video.id}
        className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-200">
          {video.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <a href={video.url} target="_blank" rel="noopener noreferrer">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </a>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
              No preview available
            </div>
          )}

          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${badgeStyles}`}
          >
            {variant === "short" ? "Short" : "Long"}
          </span>
        </div>

        <div className="mt-3 space-y-2">
          <p
            className="text-sm font-semibold text-slate-900"
            title={video.title}
          >
            {video.title}
          </p>
          <p
            className="text-xs text-slate-500"
            title={video.channelTitle}
          >
            {video.channelTitle}
          </p>
          {aiCaptions[video.id] && (
            <p className="text-sm text-slate-700 italic">{aiCaptions[video.id]}</p>
          )}
          <p className="text-[11px] text-slate-400">
            {formatPublishedDate(video.publishedAt)}
          </p>
          <div className="pt-1 flex gap-2">
            <button
              type="button"
              disabled={captionLoading[video.id]}
              onClick={() => void getAICaption(video, refItemName ?? undefined)}
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              {captionLoading[video.id] ? "Loading..." : "Learn more"}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
            >
              Share
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!hoveredItem) {
      setTrends(null);
      setTrendsStatus("idle");
      setTrendsError(null);
      if (pendingRequestRef.current) {
        pendingRequestRef.current.abort();
        pendingRequestRef.current = null;
      }
      return;
    }

    const cacheKey = hoveredItem.name.toLowerCase();

    if (pendingRequestRef.current) {
      pendingRequestRef.current.abort();
      pendingRequestRef.current = null;
    }

    if (trendsCacheRef.current.has(cacheKey)) {
      setTrends(trendsCacheRef.current.get(cacheKey) ?? null);
      setTrendsStatus("ready");
      setTrendsError(null);
      return;
    }

    const controller = new AbortController();
    pendingRequestRef.current = controller;
    setTrendsStatus("loading");
    setTrendsError(null);

    const fetchTrends = async () => {
      try {
        const response = await fetch(
          `/api/youtube-trends?q=${encodeURIComponent(hoveredItem.name)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          const fallback = await response
            .json()
            .catch(() => ({ error: response.statusText }));
          const message =
            typeof fallback.error === "string"
              ? fallback.error
              : "Failed to load YouTube trends.";
          throw new Error(message);
        }

        const payload = (await response.json()) as
          | (TrendsPayload & { error?: never })
          | { error: string };

        if ("error" in payload) {
          throw new Error(payload.error);
        }

        trendsCacheRef.current.set(cacheKey, payload);
        setTrends(payload);
        setTrendsStatus("ready");
        setTrendsError(null);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }
        console.error("Failed to load trends", fetchError);
        setTrends(null);
        setTrendsStatus("error");
        setTrendsError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load YouTube trends."
        );
      } finally {
        if (pendingRequestRef.current === controller) {
          pendingRequestRef.current = null;
        }
      }
    };

    void fetchTrends();

    return () => {
      controller.abort();
    };
  }, [hoveredItem]);

  const panelVisible = Boolean(hoveredItem);

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      <header className="border-b border-orange-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-[var(--primary)]"
          >
            FetchSprint
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              variant="outline"
            >
              <Link href="/">Upload another receipt</Link>
            </Button>
            <Button
              asChild
              
            >
              <Link href="/feed">Go to feed</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-start">
        {isLoading ? (
          <div className="flex w-full flex-1 items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-sm text-slate-300">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-white" />
              <span>Preparing your receipt preview...</span>
            </div>
          </div>
        ) : error || !receipt ? (
          <div className="w-full rounded-3xl border border-rose-400/40 bg-rose-950/40 p-10 text-center text-rose-100 shadow-[0_40px_120px_-60px_rgba(148,26,37,0.8)]">
            <h1 className="text-2xl font-semibold">Preview unavailable</h1>
            <p className="mt-2 text-sm text-rose-100/70">
              {error ??
                "Something went wrong while opening the preview. Please upload the receipt again."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                variant="outline"
                className="border-rose-200/60 text-rose-100 hover:bg-rose-200/10"
              >
                <Link href="/">Upload another receipt</Link>
              </Button>
              <Button
                asChild
                className="bg-white text-rose-900 hover:bg-rose-100"
              >
                <Link href="/feed">Return to feed</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <section className="flex-1 space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.8)] backdrop-blur">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                    Receipt preview
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold text-white">
                    {receipt.name}
                  </h1>
                  <p className="text-sm text-white/60">
                    {formatFileSize(receipt.size)}
                  </p>
                </div>
                {receipt.summary && (
                  <div className="grid grid-cols-3 gap-4 rounded-2xl border border-orange-100 bg-white p-4 text-right text-xs text-slate-500">
                    <div>
                      <p>Subtotal</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {formatCurrency(
                          receipt.summary.subtotal,
                          receipt.summary.currency
                        )}
                      </p>
                    </div>
                    <div>
                      <p>Tax</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {formatCurrency(
                          receipt.summary.tax,
                          receipt.summary.currency
                        )}
                      </p>
                    </div>
                    <div>
                      <p>Total</p>
                      <p className="mt-1 text-base font-semibold text-emerald-600">
                        {formatCurrency(
                          receipt.summary.total,
                          receipt.summary.currency
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-6">
                {receiptLines.map((line, index) => {
                  const lower = line.toLowerCase();
                  const itemMatch = indexedItems.find(({ normalizedName }) =>
                    lower.includes(normalizedName)
                  );
                  const displayLine = line.length ? line : "\u00a0";

                  if (itemMatch) {
                    const { item } = itemMatch;

                    return (
                      <div
                        key={`line-${index}`}
                        role="button"
                        tabIndex={0}
                        onMouseEnter={() => setHoveredItem(item)}
                        onFocus={() => setHoveredItem(item)}
                        onTouchStart={() => setHoveredItem(item)}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-emerald-300/60 bg-emerald-50/90 p-4 text-emerald-900 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <p className="font-mono text-sm whitespace-pre">
                          {displayLine}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-emerald-700/80">
                          <span className="rounded-full bg-white/70 px-2 py-0.5 font-semibold text-emerald-800">
                            {formatCurrency(
                              item.price,
                              receipt.summary?.currency
                            )}
                          </span>
                          <span className="text-emerald-700/70">
                            Hover to preview trending ideas
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <p
                      key={`line-${index}`}
                      className="font-mono text-sm text-slate-600 whitespace-pre"
                    >
                      {displayLine}
                    </p>
                  );
                })}
              </div>
            </section>

            <aside
              aria-hidden={!panelVisible}
              className={`w-full max-w-xs transition-all duration-300 ease-out lg:sticky lg:top-24 lg:w-80 ${
                panelVisible
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-4 opacity-0"
              }`}
            >
              <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Trending videos</h2>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      YouTube
                    </span>
                  </div>
                  {hoveredItem && (
                    <button
                      type="button"
                      onClick={() => setHoveredItem(null)}
                      className="text-xs font-medium text-slate-400 underline-offset-4 hover:text-slate-600 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {!hoveredItem
                    ? "Hover or focus a receipt item to explore related YouTube picks."
                    : trendsStatus === "loading"
                    ? `Fetching the latest videos for ${hoveredItem.name}...`
                    : trendsStatus === "error"
                    ? `We couldn't load videos for ${hoveredItem.name}.`
                    : `Shorts and long-form clips inspired by ${hoveredItem.name}.`}
                </p>

                <div className="mt-6 space-y-6">
                  {!hoveredItem ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                      Highlight an item on the receipt to see relevant YouTube
                      Shorts and long-form videos.
                    </div>
                  ) : trendsStatus === "loading" ? (
                    <div className="space-y-4">
                      {Array.from({ length: TREND_SKELETON_COUNT }).map(
                        (_, index) => (
                          <div
                            key={`skeleton-${index}`}
                            className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"
                          >
                            <div className="aspect-video w-full rounded-xl bg-slate-200/80 animate-pulse" />
                            <div className="mt-3 space-y-2">
                              <div className="h-3 rounded bg-slate-200/80 animate-pulse" />
                              <div className="h-3 w-2/3 rounded bg-slate-200/80 animate-pulse" />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : trendsStatus === "error" ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                      {trendsError ?? "Failed to load YouTube trends."}
                    </div>
                  ) : trends && (trends.shorts.length || trends.longForm.length) ? (
                    <>
                      <section>
                        <header className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-700">
                            Shorts
                          </h3>
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            under 4 min
                          </span>
                        </header>
                        {trends.shorts.length ? (
                          <div className="mt-3 space-y-4">
                            {trends.shorts
                              .slice(0, TREND_SKELETON_COUNT)
                              .map((video) =>
                                renderVideoCard(video, "short", hoveredItem?.name ?? null)
                              )}
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-slate-400">
                            No Shorts surfaced for this product yet.
                          </p>
                        )}
                      </section>

                      <section>
                        <header className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-700">
                            Long-form videos
                          </h3>
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            deep dives
                          </span>
                        </header>
                        {trends.longForm.length ? (
                          <div className="mt-3 space-y-4">
                            {trends.longForm
                              .slice(0, TREND_SKELETON_COUNT)
                              .map((video) =>
                                renderVideoCard(video, "long", hoveredItem?.name ?? null)
                              )}
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-slate-400">
                            No long-form results matched this keyword.
                          </p>
                        )}
                      </section>
                    </>
                  ) : (
                    <p className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-500">
                      No YouTube results matched this product right now. Try
                      another item on your receipt.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </>
        )}
      </main>
    </div>
  );
}

export default function ReceiptPreviewPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Loading preview...</div>}>
      <ReceiptPreviewContent />
    </Suspense>
  );
}


