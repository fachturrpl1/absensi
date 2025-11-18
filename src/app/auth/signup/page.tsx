"use client";

import Link from "next/link";
import { Command } from "lucide-react";

import { SignUp } from "@/components/form/signup-form";

export default function SignUpPage() {
  return (
    <div className="flex h-dvh">
      <div className="bg-background flex w-full items-center justify-center p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="text-2xl font-semibold tracking-tight">Create Account</div>
            <div className="text-muted-foreground mx-auto max-w-xl text-sm">
              Enter your information to create your account
            </div>
          </div>
          <div className="space-y-4">
            <SignUp />
            <p className="text-muted-foreground text-center text-xs">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-primary hidden lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Command className="text-primary-foreground mx-auto size-12" />
            <div className="space-y-2">
              <h1 className="text-primary-foreground text-5xl font-light">Welcome</h1>
              <p className="text-primary-foreground/80 text-xl">Join us today</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
