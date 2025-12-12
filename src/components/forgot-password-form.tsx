"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { requestPasswordReset } from "@/action/users";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const FormSchema = z.object({
  email: z.string().email({ message: "Masukkan email yang valid." }),
});

export function ForgotPasswordForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    setLoading(true);
    setStatus("idle");
    setMessage(null);

    const formData = new FormData();
    formData.append("email", values.email);

    const result = await requestPasswordReset(formData);

    if (!result.success) {
      setStatus("error");
      setMessage(result.message || "Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
      return;
    }

    setStatus("success");
    setMessage(result.message || "Silakan cek email Anda untuk tautan reset.");
    setLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alamat Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="nama@perusahaan.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {status !== "idle" && (
          <p className={`text-sm ${status === "success" ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}

        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Mengirim tautan..." : "Kirim Tautan Reset"}
        </Button>
      </form>
    </Form>
  );
}















