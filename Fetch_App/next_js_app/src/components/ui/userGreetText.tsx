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
  if (user !== null) {
    return (
      <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
        hello&nbsp;
        <code className="font-mono font-bold">{displayName || "user"}!</code>
      </p>
    );
  }
  return (
    <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
      Welcome! Please login to view the app.
      <code className="font-mono font-bold"></code>
    </p>
  );
};

export default UserGreetText;
