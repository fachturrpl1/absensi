"use client"

import { useState, FormEvent } from "react"
import { GalleryVerticalEnd } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp } from "@/action/users"
import Link from "next/link"
import { useRouter } from "next/navigation"
import styles from "./signup-form.module.css"

export function SignUp({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await signUp(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      // Start fade out transition after showing success message
      setTimeout(() => {
        setFadeOut(true)
        // Navigate to onboarding after fade out completes
        setTimeout(() => {
          router.push('/onboarding')
        }, 500) // 500ms fade out duration
      }, 1000) // Show success message for 1 second
    }
  }

  return (
    <div 
      className={cn(
        "flex flex-col gap-6 transition-all duration-500 ease-in-out",
        fadeOut ? "opacity-0 transform scale-95" : "opacity-100 transform scale-100",
        className
      )} 
      {...props}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-6" />
          </div>
          <h1 className="text-xl font-bold">Welcome to the App</h1>
        </div>

        {/* Full Name */}
        <div className="grid gap-3">
          <Label htmlFor="first_name">First Name</Label>
          <Input id="first_name" name="first_name" type="text" required />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="last_name">Last Name</Label>
          <Input id="last_name" name="last_name" type="text" required />
        </div>

        {/* Email */}
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
          />
        </div>

        {/* Password */}
        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="underline underline-offset-4">
            Login
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={loading || success}>
          {loading ? 'Signing up...' : success ? 'Redirecting...' : 'Sign Up'}
        </Button>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && (
          <div className={`text-center space-y-2 ${styles['success-container']}`}>
            <div className="flex items-center justify-center">
              <div className={`h-6 w-6 text-green-500 mr-2 ${styles['checkmark-animation']}`}>
                ✓
              </div>
              <p className="text-sm text-green-600 font-medium">
                Account created successfully!
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Redirecting to onboarding...
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
