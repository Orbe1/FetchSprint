"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/app/utils/supabase/client";
import PostCard from "./post";
import { toast } from "sonner";

type Post = {
  id: string;
  created_at: string;
  author_id: string;
  caption: string;
  title: string;
  author_name: string;
  author_profile_pic?: string;
};

export default function SocialWall() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const getPosts = async () => {
    setLoading(true);
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, created_at, author_id, caption, title, author_name")
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

      const authorIds = postsData.map((post) => post.author_id);
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, profile_pic_url")
        .in("id", authorIds);

      if (usersError) {
        toast.error("Error loading users", {
          description: usersError.message,
        });
      }

      const profilePicMap = new Map();
      if (usersData) {
        usersData.forEach((user) => {
          if (user.profile_pic_url) {
            profilePicMap.set(user.id, user.profile_pic_url);
          }
        });
      }

      const postsWithProfilePics = postsData.map((post) => ({
        ...post,
        author_profile_pic: profilePicMap.get(post.author_id) || undefined,
      }));

      setPosts(postsWithProfilePics);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Social Wall</h1>

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
