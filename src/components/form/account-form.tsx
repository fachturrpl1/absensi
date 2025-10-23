"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Camera, User, Briefcase, Lock, Trash2, AlertCircle } from "lucide-react";
import {
  updateUserProfile,
  changePassword,
  uploadProfilePhotoBase64,
} from "@/action/account";
import { IUser, IOrganization_member, IEmergencyContact } from "@/interface";
import { useAuthStore } from "@/store/user-store";
import { useProfileRefresh, useProfilePhotoDelete, useProfilePhotoUrl } from "@/hooks/use-profile";
import { safeAvatarSrc, getUserInitials } from "@/lib/avatar-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GENDER_OPTIONS, RELATIONSHIP_OPTIONS } from "@/constants";

interface UserProfile extends Partial<IUser> {
  email?: string;
}

interface AccountData {
  user: UserProfile;
  organizationMember: IOrganization_member | null;
}

interface AccountFormProps {
  initialData: AccountData;
}

// Schema for profile form
const profileFormSchema = z.object({
  employee_code: z.string().optional(),
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  nationality: z.string().optional(),
  national_id: z.string().optional(),
  // Emergency contact as separate fields
  emergency_contact_name: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_email: z.string().email().optional().or(z.literal("")),
});

// Schema for password form
const passwordFormSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function AccountForm({ initialData }: AccountFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [photoUploading, setPhotoUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auth store and refresh hook
  const { refreshProfile } = useProfileRefresh();
  const { deleteProfilePhoto } = useProfilePhotoDelete();
  const setUser = useAuthStore((state) => state.setUser);
  const currentUser = useAuthStore((state) => state.user);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      employee_code: initialData.user.employee_code || "",
      first_name: initialData.user.first_name || "",
      middle_name: initialData.user.middle_name || "",
      last_name: initialData.user.last_name || "",
      display_name: initialData.user.display_name || "",
      email: initialData.user.email || "",
      phone: initialData.user.phone || "",
      date_of_birth: initialData.user.date_of_birth || "",
      gender: initialData.user.gender || undefined,
      nationality: initialData.user.nationality || "",
      national_id: initialData.user.national_id || "",
      emergency_contact_name: initialData.user.emergency_contact?.name || "",
      emergency_contact_relationship: initialData.user.emergency_contact?.relationship || "",
      emergency_contact_phone: initialData.user.emergency_contact?.phone || "",
      emergency_contact_email: initialData.user.emergency_contact?.email || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const requiredFields = [
    { label: "Email Address", value: profileForm.watch("email") },
    { label: "First Name", value: profileForm.watch("first_name") },
    { label: "Gender", value: profileForm.watch("gender") },
    { label: "Phone Number", value: profileForm.watch("phone") },
  ];

  const missingRequired = requiredFields
    .filter((field) => !field.value || String(field.value).trim() === "")
    .map((field) => field.label);
  const missingEmail = missingRequired.includes("Email Address");
  const missingFirstName = missingRequired.includes("First Name");
  const missingGender = missingRequired.includes("Gender");
  const missingPhone = missingRequired.includes("Phone Number");
  const hasMissingRequired = missingRequired.length > 0;

  const watchedDisplayName = profileForm.watch("display_name")?.trim();

  // Handle profile update
  const handleProfileSubmit = async (values: ProfileFormValues) => {
    try {
      const submitMissing: string[] = [];
      if (!values.email?.trim()) submitMissing.push("Email Address");
      if (!values.first_name?.trim()) submitMissing.push("First Name");
      if (!values.gender?.trim()) submitMissing.push("Gender");
      if (!values.phone?.trim()) submitMissing.push("Phone Number");

      if (submitMissing.length) {
        toast.error("Please fill in all required fields before saving.");
        return;
      }
      setLoading(true);

      // Transform emergency contact fields into JSON object
      const emergencyContact: IEmergencyContact = {
        name: values.emergency_contact_name,
        relationship: values.emergency_contact_relationship,
        phone: values.emergency_contact_phone,
        email: values.emergency_contact_email,
      };

      // Remove individual emergency contact fields and add the object
      const { emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_email, ...otherValues } = values;

      const profileData = {
        ...otherValues,
        emergency_contact: emergencyContact,
      };

      const result = await updateUserProfile(profileData);

      if (result.success) {
        toast.success(result.message);
        // Refresh profile data to sync with navbar
        await refreshProfile();
      } else {
        toast.error(result.message);
      }
    } catch (error: unknown) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    try {
      setLoading(true);
      const result = await changePassword(values.newPassword);

      if (result.success) {
        toast.success(result.message);
        passwordForm.reset();
      } else {
        toast.error(result.message);
      }
    } catch (error: unknown) {
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  // Handle photo upload with a base64 approach
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input
    if (event.target) {
      event.target.value = '';
    }

    // Frontend validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be less than 8MB');
      return;
    }

    try {
      setPhotoUploading(true);

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:image/...;base64, prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      console.log('File converted to base64:', {
        name: file.name,
        type: file.type,
        size: file.size,
        base64Length: base64.length
      });

      // Upload using base64 data
      const result = await uploadProfilePhotoBase64({
        base64Data: base64,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });

      if (result.success) {
        const successMsg = result.oldPhotoDeleted
          ? 'Profile photo updated successfully (old photo removed)'
          : 'Profile photo uploaded successfully';
        toast.success(successMsg);

        // Update user data in auth store immediately
        if (result.url) {
          const formDisplayName = profileForm.getValues("display_name")?.trim()
          const initialDisplayName = initialData.user.display_name?.trim()

          setUser((prev) => {
            if (!prev) {
              return prev
            }

            const prevDisplayName = prev.display_name?.trim()
            const preservedDisplayName =
              (formDisplayName && formDisplayName !== "" ? formDisplayName : undefined) ??
              (prevDisplayName && prevDisplayName !== "" ? prevDisplayName : undefined) ??
              (initialDisplayName && initialDisplayName !== "" ? initialDisplayName : undefined) ??
              prev.display_name ?? null

            return {
              ...prev,
              profile_photo_url: result.url!,
              display_name: preservedDisplayName,
            }
          })

          if (typeof initialData.user.display_name === "string") {
            const trimmed = initialData.user.display_name.trim()
            initialData.user.display_name = trimmed === "" ? null : trimmed
          }

          initialData.user.profile_photo_url = result.url
        }

        // Also refresh from server to ensure sync (ignore result)
        refreshProfile().catch((error) => {
          console.error('refreshProfile after upload failed:', error);
        });

      } else {
        toast.error(result.message);
        console.error('Upload error:', result.message);
      }
    } catch (error: unknown) {
      console.error("Upload error:", error)
      const message = error instanceof Error ? error.message : "Unknown error"
      toast.error(`Failed to upload photo: ${message}`)
    } finally {
      setPhotoUploading(false);
    }
  };

  // Handle photo deletion
  const handlePhotoDelete = async () => {
    try {
      setPhotoUploading(true);
      const result = await deleteProfilePhoto();

      if (result.success) {
        toast.success(result.message);
        const formDisplayName = profileForm.getValues("display_name")?.trim()
        const initialDisplayName = initialData.user.display_name?.trim()

        setUser((prev) => {
          if (!prev) {
            return prev
          }

          const prevDisplayName = prev.display_name?.trim()
          const preservedDisplayName =
            (formDisplayName && formDisplayName !== "" ? formDisplayName : undefined) ??
            (prevDisplayName && prevDisplayName !== "" ? prevDisplayName : undefined) ??
            (initialDisplayName && initialDisplayName !== "" ? initialDisplayName : undefined) ??
            prev.display_name ?? null

          return {
            ...prev,
            profile_photo_url: null,
            display_name: preservedDisplayName,
          }
        })

        if (typeof initialData.user.display_name === "string") {
          const trimmed = initialData.user.display_name.trim()
          initialData.user.display_name = trimmed === "" ? null : trimmed
        }

        initialData.user.profile_photo_url = null

        refreshProfile().catch((error) => {
          console.error('refreshProfile after delete failed:', error);
        });
      } else {
        toast.error(result.message);
      }
    } catch (error: unknown) {
      toast.error(`Failed to delete photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPhotoUploading(false);
    }
  };

  // User initials are now handled by the utility function

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Profile Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardHeader className="text-center py-8">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative group">
              <Avatar className="h-32 w-32 ring-4 ring-white shadow-xl">
                <AvatarImage
                  src={safeAvatarSrc(
                    useProfilePhotoUrl(currentUser?.profile_photo_url ?? initialData.user.profile_photo_url ?? undefined) ?? undefined
                  ) || undefined}
                  alt={(() => {
                    const displayName = watchedDisplayName && watchedDisplayName !== "" ? watchedDisplayName : currentUser?.display_name ?? initialData.user.display_name
                    if (displayName && displayName.trim() !== "") {
                      return displayName
                    }

                    const parts = [
                      currentUser?.first_name ?? initialData.user.first_name ?? "",
                      currentUser?.middle_name ?? initialData.user.middle_name ?? "",
                      currentUser?.last_name ?? initialData.user.last_name ?? "",
                    ].filter((part) => part && part.trim() !== "")

                    if (parts.length > 0) {
                      return parts.join(" ")
                    }

                    return currentUser?.email ?? initialData.user.email ?? "Profile"
                  })()}
                  className="object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                  {getUserInitials(
                    currentUser?.first_name ?? initialData.user.first_name,
                    currentUser?.last_name ?? initialData.user.last_name,
                    (watchedDisplayName && watchedDisplayName !== "" ? watchedDisplayName : currentUser?.display_name ?? initialData.user.display_name) ?? undefined,
                    currentUser?.email ?? initialData.user.email
                  )}
                </AvatarFallback>
              </Avatar>

              {/* Upload Photo Button */}
              <Button
                size="sm"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full p-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white hover:bg-blue-50 border-2 border-blue-100"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                title="Upload new photo"
              >
                {photoUploading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                ) : (
                  <Camera className="h-5 w-5 text-blue-600" />
                )}
              </Button>

              {/* Delete Photo Button - only show if user has photo */}
              {(currentUser?.profile_photo_url || initialData.user.profile_photo_url) && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-1 -left-1 h-10 w-10 rounded-full p-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white hover:bg-red-50 border-2 border-red-100"
                  onClick={() => handlePhotoDelete()}
                  disabled={photoUploading}
                  title="Delete current photo"
                >
                  <Trash2 className="h-5 w-5 text-red-600" />
                </Button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,image/jpg,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
                key={Date.now()} // Force re-render untuk clear previous state
              />
            </div>
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {(() => {
                  const displayName = watchedDisplayName && watchedDisplayName !== "" ? watchedDisplayName : currentUser?.display_name ?? initialData.user.display_name
                  if (displayName && displayName.trim() !== "") {
                    return displayName
                  }

                  const parts = [
                    currentUser?.first_name ?? initialData.user.first_name ?? "",
                    currentUser?.middle_name ?? initialData.user.middle_name ?? "",
                    currentUser?.last_name ?? initialData.user.last_name ?? "",
                  ].filter((part) => part && part.trim() !== "")

                  if (parts.length > 0) {
                    return parts.join(" ")
                  }

                  return currentUser?.email ?? initialData.user.email ?? "No Name"
                })()}
              </CardTitle>
              <CardDescription className="text-lg">
                <span className="inline-flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {initialData.organizationMember?.positions?.title || "No Position"}
                  {initialData.organizationMember?.departments && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      {initialData.organizationMember.departments.name}
                    </>
                  )}
                </span>
              </CardDescription>
              {initialData.organizationMember?.organization && (
                <p className="text-sm text-muted-foreground">
                  {initialData.organizationMember.organization.name}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Account Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <div className="top-4 z-10 bg-background/80 backdrop-blur-sm border rounded-lg p-1">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="work" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Work Info</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-lg font-medium">Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {missingRequired.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Lengkapi data wajib</AlertTitle>
                  <AlertDescription>
                    Silakan isi: {missingRequired.join(", ")} untuk melanjutkan.
                  </AlertDescription>
                </Alert>
              )}
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">

                  {/* Basic Information - Hidden on mobile */}
                  <div className="hidden md:block space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="employee_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee Code</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly className="bg-muted cursor-not-allowed" tabIndex={-1} />
                            </FormControl>
                            <FormDescription className="text-xs text-muted-foreground">
                              Employee code cannot be changed
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            className={profileForm.formState.errors.email || missingEmail ? "border-destructive focus-visible:ring-destructive" : undefined}
                          />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className={profileForm.formState.errors.first_name || missingFirstName ? "border-destructive focus-visible:ring-destructive" : undefined}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="middle_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Middle Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Optional" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="display_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="How you'd like to be addressed" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="hidden md:block border-t" />

                  {/* Contact Information - Hidden on mobile */}
                  <div className="hidden md:block space-y-4">
                    <h3 className="text-base font-medium">Contact Information</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="+62 xxx xxx xxxx"
                              className={profileForm.formState.errors.phone || missingPhone ? "border-destructive focus-visible:ring-destructive" : undefined}
                            />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="hidden md:block border-t" />

                  {/* Personal Details - Hidden on mobile */}
                  <div className="hidden md:block space-y-4">
                    <h3 className="text-base font-medium">Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="date_of_birth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className={profileForm.formState.errors.gender || missingGender ? "border-destructive focus-visible:ring-destructive" : undefined}>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="nationality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nationality</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Indonesian" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="national_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>National ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="ID Card / Passport Number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="hidden md:block border-t" />

                  {/* Emergency Contact - Hidden on mobile */}
                  <div className="hidden md:block space-y-4">
                    <h3 className="text-base font-medium">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="emergency_contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Full name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="emergency_contact_relationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Spouse, Parent" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="emergency_contact_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Phone</FormLabel>
                            <FormControl>
                              <Input {...field} type="tel" placeholder="Phone number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="emergency_contact_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="Email (optional)" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Mobile message */}
                  <div className="block md:hidden text-center py-8">
                    <div className="text-muted-foreground">
                      <h3 className="text-lg font-medium mb-2">Edit Profile</h3>
                      <p className="text-sm">Profile editing is available on desktop devices for the best experience.</p>
                      <p className="text-xs mt-2">Please use a larger screen to update your profile information.</p>
                    </div>
                  </div>

                  {/* Submit Button - Hidden on mobile */}
                  <div className="hidden md:flex justify-end pt-4">
                    <Button type="submit" disabled={loading} className="min-w-24">
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Info Tab */}
        <TabsContent value="work">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-lg font-medium">Work Information</CardTitle>
              <CardDescription>
                Your current employment details and organizational information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Organization Details */}
              <div className="space-y-4">
                <h3 className="text-base font-medium">Organization Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Organization</label>
                    <p className="text-sm">
                      {initialData.organizationMember?.organization?.name || "Not assigned"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
                    <p className="text-sm">
                      {initialData.organizationMember?.employee_id || "Not assigned"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Group</label>
                    <p className="text-sm">
                      {initialData.organizationMember?.departments?.name || "Not assigned"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Position</label>
                    <p className="text-sm">
                      {initialData.organizationMember?.positions?.title || "Not assigned"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t" />

              {/* Employment Details */}
              <div className="space-y-4">
                <h3 className="text-base font-medium">Employment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
                    <p className="text-sm">
                      {initialData.organizationMember?.hire_date
                        ? new Date(initialData.organizationMember.hire_date).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                        : "Not specified"
                      }
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Contract Type</label>
                    <p className="text-sm">
                      {initialData.organizationMember?.contract_type || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Employment Status</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${initialData.organizationMember?.employment_status === 'active' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      <p className="text-sm capitalize">
                        {initialData.organizationMember?.employment_status || "Not specified"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Work Location</label>
                    <p className="text-sm">
                      {initialData.organizationMember?.work_location || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-lg font-medium">Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-w-md mx-auto space-y-6">
                <div className="space-y-2">
                  <h3 className="text-base font-medium">Change Password</h3>
                  <p className="text-sm text-muted-foreground">Update your account password for better security</p>
                </div>

                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="Enter new password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="Confirm new password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Password requirements:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>At least 6 characters long</li>
                        <li>Use a combination of letters and numbers</li>
                      </ul>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={loading} className="min-w-24">
                        {loading ? "Changing..." : "Change Password"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
