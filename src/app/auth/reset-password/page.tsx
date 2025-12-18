"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

import { ResetPasswordForm } from "@/components/reset-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Atur Ulang Password</CardTitle>
          <CardDescription>Masukkan password baru Anda untuk menyelesaikan proses reset.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResetPasswordForm />
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/auth/login">Kembali ke login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}







































