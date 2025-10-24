"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthUser } from "@/utility_methods/userUtils";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [attachedVideo, setAttachedVideo] = useState<
    | {
        id: string;
        title: string;
        channel: string;
        url: string;
        thumb: string | null;
        refItem?: string | null;
      }
    | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Read share params from URL and prefill the form
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const vUrl = sp.get("vUrl");
    if (!vUrl) return;
    const vId = sp.get("vId") ?? "";
    const vTitle = sp.get("vTitle") ?? "";
    const vThumb = sp.get("vThumb") || null;
    const vChannel = sp.get("vChannel") ?? "";
    const refItem = sp.get("refItem");
    const vCaption = sp.get("vCaption");

    setAttachedVideo({
      id: vId,
      title: vTitle,
      channel: vChannel,
      url: vUrl,
      thumb: vThumb,
      refItem,
    });

    // Only prefill if user hasn't typed yet
    setTitle((prev) => (prev ? prev : vTitle));
    setCaption((prev) => {
      if (prev) return prev;
      if (vCaption && vCaption.trim()) return vCaption.trim();
      return [
        refItem ? `Inspired by ${refItem}.` : null,
        vTitle ? `Watch: ${vTitle}` : null,
        vChannel ? `by ${vChannel}` : null,
        vUrl,
      ]
        .filter(Boolean)
        .join(" ");
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const user = await getAuthUser();
    if (!user) {
      alert("You must be logged in to create a post");
      router.push("/login");
      return;
    }

    const insertPayload: any = {
      author_id: user.id,
      title: title,
      caption: caption,
      created_at: new Date().toISOString(),
    };
    const displayName = user.user_metadata?.user_name as string | undefined;
    if (displayName && displayName.trim()) {
      insertPayload.author_name = displayName.trim();
    }

    const { error } = await supabase.from("posts").insert([insertPayload]);
    if (error) {
      alert(error.message);
    } else {
      alert("Post created successfully");
    }

    router.push("/feed");
  };

  return (
    <div className="container mx-auto py-8 max-w-md">
      {attachedVideo && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex gap-3">
            <div className="h-20 w-32 shrink-0 overflow-hidden rounded-md bg-slate-100">
              {attachedVideo.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachedVideo.thumb}
                  alt={attachedVideo.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                  No preview
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900" title={attachedVideo.title}>
                {attachedVideo.title}
              </p>
              <p className="truncate text-xs text-slate-500" title={attachedVideo.channel}>
                {attachedVideo.channel}
              </p>
              <a
                href={attachedVideo.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 inline-block text-xs font-medium text-indigo-600 hover:underline"
              >
                Open on YouTube
              </a>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => setAttachedVideo(null)}
                className="text-xs"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Create New Post
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="caption" className="text-sm font-medium">
                Caption
              </label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your post caption here..."
                rows={5}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Publishing..." : "Publish Post"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={() => router.push("/feed")}>
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
