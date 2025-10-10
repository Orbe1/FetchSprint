"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { CommentModalProps } from "@/types/types";

export default function CommentModal({
  isModalOpen,
  setIsModalOpen,
  handleSubmitComment,
  comment,
  setComment,
  comments = [],
}: CommentModalProps) {


  if (!isModalOpen ) return null;
  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-100">
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Comments
          </h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 max-h-[300px] overflow-y-auto">
          {comments && comments.length > 0 ? (
            comments.map((comment, index) => (
              <div
                key={index}
                className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {comment.author_name || ""}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {comment.post_content}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No comments yet
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
            Add a Comment
          </h3>
          <Textarea
            className="min-h-[120px] mb-4 resize-none focus:ring-blue-500"
            placeholder="Write your comment here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitComment}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
