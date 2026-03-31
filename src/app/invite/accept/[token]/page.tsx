"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building2, 
  Shield, 
  Users, 
  Briefcase,
  Eye,
  EyeOff
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { getInvitationByToken, acceptInvitation } from "@/action/invitations";
import { IMemberInvitation } from "@/interface";

const acceptSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type AcceptFormValues = z.infer<typeof acceptSchema>;

export default function InvitationAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<IMemberInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<AcceptFormValues>({
    resolver: zodResolver(acceptSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      password: "",
      confirm_password: "",
    },
  });

  // Verify token on mount
  useEffect(() => {
    async function verifyToken() {
      try {
        setLoading(true);
        setError(null);

        const result = await getInvitationByToken(token);

        if (result.success && result.data) {
          setInvitation(result.data);
        } else {
          setError(result.message || "Invalid invitation");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify invitation");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      verifyToken();
    }
  }, [token]);

  async function onSubmit(values: AcceptFormValues) {
    try {
      setSubmitting(true);

      const result = await acceptInvitation({
        token,
        first_name: values.first_name,
        last_name: values.last_name,
        password: values.password,
      });

      if (result.success) {
        toast.success("Welcome! Your account has been created successfully");
        
        // Redirect to login page
        setTimeout(() => {
          router.push("/auth/login?message=Account created. Please login.");
        }, 2000);
      } else {
        toast.error(result.message || "Failed to accept invitation");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
          <p className="text-gray-300 text-lg">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl bg-[#1A1D23] border-red-500/20 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">Undangan Tidak Valid</CardTitle>
                <CardDescription className="text-gray-400 mt-2">
                  Maaf, sepertinya link undangan ini tidak dapat digunakan.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive" className="bg-red-500/5 border-red-500/10 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || "Undangan tidak ditemukan"}
              </AlertDescription>
            </Alert>
            <div className="bg-black/20 rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Penyebab Umum:
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-600" />
                  Link sudah kadaluarsa (berlaku 7 hari)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-600" />
                  Undangan sudah pernah diterima
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-600" />
                  Undangan telah dibatalkan oleh admin
                </li>
              </ul>
            </div>
            <Button
              className="w-full bg-white text-black hover:bg-gray-200 transition-colors font-semibold py-6"
              onClick={() => router.push("/")}
            >
              Kembali ke Beranda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4 py-12 selection:bg-blue-500/30">
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Invitation Details Card */}
        <Card className="shadow-2xl bg-[#1A1D23] border-gray-800/50 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white tracking-tight">Bergabung ke Organisasi</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Lengkapi profil Anda untuk mulai berkolaborasi
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Organization Info */}
            <div className="group relative overflow-hidden flex items-center gap-4 p-5 bg-blue-500/5 hover:bg-blue-500/10 transition-colors rounded-xl border border-blue-500/10">
              <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">
                <Building2 className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400/60 transition-colors">Organisasi</p>
                <p className="text-xl font-bold text-white mt-0.5">
                  {(invitation as any).organization?.name || "Unknown Organization"}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5 p-4 bg-gray-800/40 rounded-xl border border-gray-700/30 hover:border-purple-500/30 transition-all group">
                <Shield className="h-4 w-4 text-purple-400/70 group-hover:text-purple-400 transition-colors" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Peran</p>
                <p className="text-sm font-semibold text-gray-200">{(invitation as any).role?.name || "Member"}</p>
              </div>
              
              <div className="flex flex-col gap-1.5 p-4 bg-gray-800/40 rounded-xl border border-gray-700/30 hover:border-blue-500/30 transition-all group">
                <Users className="h-4 w-4 text-blue-400/70 group-hover:text-blue-400 transition-colors" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Grup</p>
                <p className="text-sm font-semibold text-gray-200">{(invitation as any).department?.name || "-"}</p>
              </div>
              
              <div className="flex flex-col gap-1.5 p-4 bg-gray-800/40 rounded-xl border border-gray-700/30 hover:border-green-500/30 transition-all group">
                <Briefcase className="h-4 w-4 text-green-400/70 group-hover:text-green-400 transition-colors" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Posisi</p>
                <p className="text-sm font-semibold text-gray-200">{(invitation as any).position?.title || "-"}</p>
              </div>
            </div>

            {invitation.message && (
              <div className="relative p-5 bg-gray-800/20 border border-gray-800 rounded-xl italic">
                <span className="absolute top-0 left-4 -translate-y-1/2 bg-[#1A1D23] px-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Pesan Personal
                </span>
                <p className="text-sm text-gray-300 leading-relaxed">"{invitation.message}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accept Form Card */}
        <Card className="shadow-2xl bg-[#1A1D23] border-gray-800/50 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Lengkapi Data Diri</CardTitle>
            <CardDescription className="text-gray-400">
              Data ini akan digunakan sebagai identitas akun Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Email (Read-only) */}
                <div>
                  <FormLabel className="text-gray-200">Email Address</FormLabel>
                  <Input
                    value={invitation.email}
                    disabled
                    className="bg-gray-700/50 border-gray-600 text-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This will be your login email
                  </p>
                </div>

                {/* First Name */}
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">First Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          {...field}
                          disabled={submitting}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Last Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          {...field}
                          disabled={submitting}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Password *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            disabled={submitting}
                            className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-gray-400 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <p className="text-xs text-gray-400">
                        Must be at least 8 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Confirm Password *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            disabled={submitting}
                            className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-gray-400 hover:text-white"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 shadow-xl shadow-blue-900/20 transition-all rounded-xl"
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Terima Undangan & Buat Akun"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
