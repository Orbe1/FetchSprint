"use client";
import { LoginForm } from "./components/LoginForm";
import Image from "next/image";
import HomeButton from "@/components/homeButton";
import { Suspense } from "react";

export default function Login() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <HomeButton path="/" label="Home" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <div className="flex flex-col justify-start items-center h-full pt-16 px-8">
          <div className="relative h-1/2 w-full max-w-md">
            <Image src="/images/Fetch_logo.png" alt="Fetch Logo" fill className="object-contain" />
          </div>
          <div className="mt-8 text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Discover New Skills
            </h2>
            <p className="text-muted-foreground text-lg">
              Unlock your potential and embark on a journey of continuous
              learning
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
