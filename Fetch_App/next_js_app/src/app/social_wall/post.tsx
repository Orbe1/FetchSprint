"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/app/utils/supabase/client";
import { Textarea } from "@/components/ui/textarea";
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

interface PostProps {
  post: Post;
  formatDate: (dateString: string) => string;
}

export default function PostCard({ post, formatDate }: PostProps) {
  const [showAllComments, setShowAllComments] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentList, setCommentList] = useState<
    Array<{ author_name: string | null; post_content: string }>
  >([]);
  const [isAlreadyLiked, setIsAlreadyLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const getUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        toast.error("Authentication error", {
          description: error.message,
        });
        return null;
      }

      return user;
    } catch (error) {
      toast.error("Authentication error", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  };
  const handleSubmitComment = async () => {
    try {
      const user = await getUser();

      if (!user) {
        toast.error("Authentication required", {
          description: "You must be logged in to comment",
        });
        return;
      }

      const { error } = await supabase.from("post_comments").upsert([
        {
          post_id: post.id,
          author_id: user.id,
          post_content: commentText,
          author_name: user.user_metadata.user_name,
        },
      ]);

      if (error) {
        toast.error("Comment error", {
          description: error.message,
        });
        return;
      }

      setCommentText("");
      getComments();
    } catch (error) {
      toast.error("Comment error", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const getComments = async () => {
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select("author_name, post_content")
        .eq("post_id", post.id);

      if (error) {
        toast.error("Error loading comments", {
          description: error.message,
        });
        return;
      }

      setCommentList(data);
    } catch (error) {
      toast.error("Error loading comments", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const alreadyLiked = async () => {
    try {
      const user = await getUser();

      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from("post_likes")
        .select("*")
        .or(
          `and(user_id.eq.${user.id},post_id.eq.${post.id}),and(post_id.eq.${post.id},user_id.eq.${user.id})`
        )
        .limit(1);

      if (error) {
        toast.error("Error checking likes", {
          description: error.message,
        });
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      toast.error("Error checking likes", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  };
  useEffect(() => {
    const checkIfLiked = async () => {
      const liked = await alreadyLiked();
      if (liked) {
        setIsAlreadyLiked(liked);
      } else {
        setIsAlreadyLiked(false);
      }
    };
    getLikeCount();
    getComments();
    checkIfLiked();
  }, []);

  const getLikeCount = async () => {
    try {
      const { count, error } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);

      if (error) {
        toast.error("Error getting like count", {
          description: error.message,
        });
        return;
      }

      setLikeCount(count || 0);
    } catch (error) {
      toast.error("Error getting like count", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  const handleLike = async () => {
    try {
      const user = await getUser();

      if (!user) {
        toast.error("Authentication required", {
          description: "You must be logged in to like posts",
        });
        return;
      }

      if (isAlreadyLiked) {
        setIsAlreadyLiked(false);
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .match({ user_id: user.id, post_id: post.id });

        if (error) {
          toast.error("Error unliking post", {
            description: error.message,
          });
          setIsAlreadyLiked(true);
          return;
        }
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert([{ user_id: user.id, post_id: post.id }]);

        if (error) {
          toast.error("Error liking post", {
            description: error.message,
          });
          return;
        }

        setIsAlreadyLiked(true);
      }

      getLikeCount();
    } catch (error) {
      toast.error("Error handling like", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 transform hover:-translate-y-1 min-w-md ${
        isAlreadyLiked ? "cursor-broken-heart" : "cursor-heart"
      }`}
      onDoubleClick={handleLike}
    >
      <div className="flex items-center p-4 border-b border-gray-100">
        {post.author_profile_pic ? (
          <div className="h-10 w-10 rounded-full flex-shrink-0 overflow-hidden">
            <img
              src={post.author_profile_pic}
              alt={`${post.author_name}'s profile`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold">
            {post.author_name.substring(0, 1).toUpperCase()}
          </div>
        )}
        <div className="ml-3">
          <p className="font-medium text-sm text-gray-700">
            {post.author_name.substring(0, 6)}
          </p>
          <p className="text-xs text-gray-400">{formatDate(post.created_at)}</p>
        </div>
      </div>

      {post.title && (
        <div className="px-4 pt-4">
          <h2 className="font-bold text-xl text-gray-800 leading-tight">
            {post.title}
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded mt-2"></div>
        </div>
      )}

      <div className="p-4">
        {post.caption && (
          <p className="text-gray-600 leading-relaxed">{post.caption}</p>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex justify-center space-x-26">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-1 text-gray-600 hover:text-blue-500"
            onClick={handleLike}
          >
            <span>{isAlreadyLiked ? "❤️" : "🤍"}</span>

            <span>Like</span>
            <span>{likeCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-1 text-gray-600 hover:text-blue-500"
            onClick={() => {
              getComments();
              setShowCommentInput(!showCommentInput);
            }}
          >
            <span>💬</span>
            <span>Comment</span>
            <span>{commentList.length}</span>
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-100">
        <div className="mb-3">
          {commentList.length > 0 ? (
            <>
              {(showAllComments ? commentList : commentList.slice(0, 1)).map(
                (comment, index) => (
                  <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">
                      {comment.author_name || ""}
                    </p>
                    <p className="text-gray-600">{comment.post_content}</p>
                  </div>
                )
              )}

              {commentList.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-500 hover:text-blue-700 text-sm"
                  onClick={() => setShowAllComments(!showAllComments)}
                >
                  {showAllComments
                    ? "Show less"
                    : `Show ${commentList.length - 1} more comments`}
                </Button>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm py-2">No comments yet</p>
          )}
        </div>

        {showCommentInput && (
          <div className="mt-3">
            <Textarea
              className="min-h-[80px] mb-2 resize-none focus:ring-blue-500 text-sm"
              placeholder="Write your comment here..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                size="sm"
              >
                Post Comment
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
