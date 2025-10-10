"use client";
import React, { useEffect, useState } from "react";
import { Button } from "./button";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase/client";
import { signout } from "@/supabase-actions/auth-actions";
import { User } from "@supabase/supabase-js";
const LoginButton = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: fetchedUser },
      } = await supabase.auth.getUser();
      if (fetchedUser) {
        setUser(fetchedUser);
      }
      setUser(fetchedUser);
    };
    fetchUser();
  }, []);
  if (user) {
    return (
      <Button
        onClick={() => {
          signout();
          setUser(null);
        }}
      >
        Log out
      </Button>
    );
  }
  return (
    <Button
      variant="outline"
      onClick={() => {
        router.push("/login");
      }}
    >
      Login
    </Button>
  );
};

export default LoginButton;
