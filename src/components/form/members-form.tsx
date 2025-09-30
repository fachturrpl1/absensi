"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { IOrganization_member, IRfidCard, IUser } from "@/interface"
import {
    createOrganizationMember,
    updateOrganizationMember,
} from "@/action/members"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { getAllDepartments } from "@/action/departement"
import { getAllPositions } from "@/action/position"
import { getAllUsers, getAllUsersNotRegistered } from "@/action/users"
import FormSkeleton from "../form-skeleton"
import { createRfidCard, updateRfidCard } from "@/action/rfid_card"
import { getAllOrganization } from "@/action/organization"
import { createClient } from "@/utils/supabase/client"
import { Can } from "../can"

interface OrganizationMembersFormProps {
    formType: "add" | "edit"
    initialValues?: Partial<IOrganization_member>
    rfidInitial?: Partial<IRfidCard>
}

// ✅ Zod schema sinkron dengan IOrganization_member + RFID
const OrganizationMembersFormSchema = z.object({
    organization_id: z.string().min(1, "Organization is required"),
    user_id: z.string().min(1, "User is required"),
    department_id: z.string().min(1, "Department is required"),
    position_id: z.string().min(1, "Position is required"),
    hire_date: z.string().optional(),
    probation_end_date: z.string().optional(),
    employment_status: z.string().optional(),
    work_location: z.string().optional(),

    // RFID
    card_number: z.string().min(1, "Card number is required"),
    card_type: z.string().optional(),
})

type FormValues = z.infer<typeof OrganizationMembersFormSchema>

export default function MembersForm({
    formType,
    initialValues,
    rfidInitial,
}: OrganizationMembersFormProps) {
    const router = useRouter()
    const [loading, setLoading] = React.useState(false)
    const [organizations, setOrganizations] = React.useState<{ id: string; name: string }[]>([])
    const [departments, setDepartments] = React.useState<{ id: string; name: string }[]>([])
    const [positions, setPositions] = React.useState<{ id: string; title: string }[]>([])
    const [users, setUsers] = React.useState<IUser[]>([])
    const [loadingForm, setLoadingForm] = React.useState(true)
    const [organizationId, setOrganizationId] = React.useState<string>("")
    const form = useForm<FormValues>({
        resolver: zodResolver(OrganizationMembersFormSchema),
        defaultValues: {
            organization_id: "",
            user_id: "",
            department_id: "",
            position_id: "",
            hire_date: "",
            probation_end_date: "",
            employment_status: "",
            work_location: "",
            card_number: rfidInitial?.card_number ?? "",
            card_type: rfidInitial?.card_type ?? "",
        },
    })

    React.useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingForm(true);

                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    // 🔑 2. ambil organization_id dari organization_members
                    const { data: member } = await supabase
                        .from("organization_members")
                        .select("organization_id")
                        .eq("user_id", user.id)
                        .maybeSingle();

                    if (member) {
                        // set langsung ke form
                        form.setValue("organization_id", String(member.organization_id));
                    }
                }

                // 3. load dropdown lain
                await Promise.all([
                    getAllDepartments().then((res: unknown) => {
                        if (res.success) setDepartments(res.data);
                    }),
                    getAllPositions().then((res: unknown) => {
                        if (res.success) setPositions(res.data);
                    }),
                    (formType === "edit" ? getAllUsers() : getAllUsersNotRegistered()).then((res: unknown) => {
                        if (res.success) setUsers(res.data);
                    }),
                ]);

                // 4. kalau edit, isi default values
                if (initialValues && Object.keys(initialValues).length > 0) {
                    form.reset({
                        organization_id: String(initialValues.organization_id ?? form.getValues("organization_id")),
                        user_id: String(initialValues.user_id ?? ""),
                        department_id: String(initialValues.department_id ?? ""),
                        position_id: String(initialValues.position_id ?? ""),
                        hire_date: initialValues.hire_date ?? "",
                        probation_end_date: initialValues.probation_end_date ?? "",
                        employment_status: initialValues.employment_status ?? "",
                        work_location: initialValues.work_location ?? "",
                        card_number: rfidInitial?.card_number || (initialValues as unknown)?.rfid_cards?.card_number || "",
                        card_type: rfidInitial?.card_type || (initialValues as unknown)?.rfid_cards?.card_type || "",
                    });
                }
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Unknown error' || "Failed to load form data");
            } finally {
                setLoadingForm(false);
            }
        };

        loadData();
    }, [initialValues, formType, form, rfidInitial]);

    const onSubmit = async (values: FormValues) => {
        try {
            setLoading(true);

            const { card_number, card_type, ...memberData } = values;
            let memberId: string | null = null;

            if (formType === "edit" && initialValues?.id) {
                const res = await updateOrganizationMember(initialValues.id, memberData);
                if (!res.success) throw new Error(res.message);
                memberId = initialValues.id;
            } else {
                const res = await createOrganizationMember(memberData);
                if (!res.success || !res.data) throw new Error(res.message);
                memberId = res.data.id;
            }

            if (!memberId) throw new Error("Failed to resolve member ID");

            if (formType === "edit" && rfidInitial?.id) {
                await updateRfidCard(rfidInitial.id, {
                    card_number,
                    card_type,
                    organization_member_id: memberId,
                    issue_date: new Date().toISOString(),
                });
            } else {
                await createRfidCard({
                    card_number,
                    card_type,
                    organization_member_id: memberId,
                    issue_date: new Date().toISOString(),
                });
            }

            toast.success("Member & RFID card saved successfully");
            router.push("/members");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Unknown error' ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (loadingForm) return <FormSkeleton />;


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card className="relative mt-10">
                    <CardHeader>
                        <CardTitle>{formType === "add" ? "Add Members" : "Edit Members"}</CardTitle>
                        <CardDescription>
                            {formType === "add" ? "Enter Members details" : "Update Members details"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 gap-y-8 mb-8 mt-10">
                        {organizationId ? (
                            <input type="hidden" {...form.register("organization_id")} />
                        ) : (
                            <Can permission="view_organization">
                                <FormField
                                    control={form.control}
                                    name="organization_id"
                                    render={({ field }) => {
                                        console.log(
                                            "Form value (organization_id):",
                                            field.value,
                                            "Options:",
                                            organizations.map((o) => String(o.id))
                                        )

                                        return (
                                            <FormItem>
                                                <FormLabel>Organization</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value || ""}
                                                >
                                                    <FormControl className="w-full">
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select organization" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {organizations.map((org) => (
                                                            <SelectItem key={String(org.id)} value={String(org.id)}>
                                                                {org.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )
                                    }}
                                />
                            </Can>
                        )}

                        <FormField
                            control={form.control}
                            name="user_id"
                            render={({ field }) => (
                                <FormItem >
                                    <FormLabel>User</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl className="w-full">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select User" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {users.map((org) => (
                                                <SelectItem key={org.id} value={String(org.id)}>
                                                    {org.first_name}{org.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="department_id"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Department</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl className="w-full">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {departments.map((org) => (
                                                <SelectItem key={org.id} value={String(org.id)}>
                                                    {org.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="position_id"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Position</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl className="w-full">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select position" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {positions.map((org) => (
                                                <SelectItem key={org.id} value={String(org.id)}>
                                                    {org.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Legal Name */}
                        <FormField
                            control={form.control}
                            name="hire_date"
                            render={({ field }) => (
                                <FormItem className="">
                                    <FormLabel>Hire Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Tax ID */}
                        <FormField
                            control={form.control}
                            name="probation_end_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Probation End Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Industry */}
                        <FormField
                            control={form.control}
                            name="employment_status"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Status</FormLabel>

                                    <Select onValueChange={field.onChange}
                                        value={field.value}>
                                        <FormControl className="w-full">
                                            <SelectTrigger >
                                                <SelectValue placeholder="Choose Status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Non Active">Non Active</SelectItem>

                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />


                        {/* Size Category */}
                        <FormField
                            control={form.control}
                            name="work_location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Location" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                    </CardContent>
                </Card>
                <Card className="mt-10">
                    <CardHeader >
                        <CardTitle>{formType === "add" ? "Add Rfid Card" : "Edit Rfid Card"}</CardTitle>
                        <CardDescription>
                            {formType === "add" ? "Enter Rfid Card details" : "Update Rfid Card details"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="gap-4 gap-y-8 mb-8 mt-5">
                        <FormField
                            control={form.control}
                            name="card_number"
                            render={({ field }) => (
                                <FormItem className="mb-5">
                                    <FormLabel>Card Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter card number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="card_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Card Type</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter card type" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>


                <div className="flex gap-4 col-span-2 mt-8 justify-end">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading
                            ? "Saving..."
                            : formType === "add"
                                ? "Create"
                                : "Update"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
