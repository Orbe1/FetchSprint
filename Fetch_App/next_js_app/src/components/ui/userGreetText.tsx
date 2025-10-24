"use client";
import { supabase } from "@/app/utils/supabase/client";
import React, { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
const UserGreetText = () => {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user?.email) {
        const { data, error } = await supabase
          .from("users")
          .select("display_name")
          .eq("email", user.email)
          .single();

        if (data && !error) {
          setDisplayName(data.display_name);
        } else if (user.user_metadata.user_name) {
          setDisplayName(user.user_metadata.user_name);
        } else {
        }
      }
    };
    fetchUser();
  }, []);
  return (
    <p className="rounded-xl border border-orange-100 bg-white px-4 py-2 shadow-sm">
      {user ? (
        <>
          hello&nbsp;<code className="font-mono font-bold">{displayName || "user"}!</code>
        </>
      ) : (
        <>Welcome! Please login to view the app.</>
      )}
    </p>
  );
};

export default UserGreetText;
