"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/app/utils/supabase/client";
import PostCard from "./post";
import { toast } from "sonner";

type Post = {
  id: string;
  created_at: string | null;
  title: string | null;
  caption: string | null;
  item_name: string | null;
  video_url: string | null;
  author_name: string | null;
};

export default function SocialWall() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const getPosts = async () => {
    setLoading(true);
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(
          "id, created_at, title, caption, item_name, video_url, author_name"
        )
        .order("created_at", { ascending: false });

      if (postsError) {
        toast.error("Error loading posts", {
          description: postsError.message,
        });
        setLoading(false);
        return;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      setPosts(postsData as Post[]);
    } catch (error) {
      toast.error("An error occurred while loading posts", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPosts();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {loading ? (
        <div className="flex justify-center">
          <p className="text-gray-500">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-8 max-w-2xl mx-auto">
          {posts.map((post, index) => (
            <PostCard key={index} post={post} formatDate={formatDate} />
          ))}
        </div>
      )}
    </div>
  );
}
