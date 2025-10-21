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
import { getAllGroups } from "@/action/group"
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

// ✅ Zod schema aligned with IOrganization_member + RFID
const OrganizationMembersFormSchema = z.object({
    organization_id: z.string().min(1, "Organization is required"),
    user_id: z.string().min(1, "User is required"),
    department_id: z.string().min(1, "Group is required"),
    position_id: z.string().min(1, "Position is required"),
    hire_date: z.string().optional(),
    probation_end_date: z.string().optional(),
    employment_status: z.string().optional(),
    work_location: z.string().optional(),

    // RFID - now optional
    card_number: z.string().optional(),
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
    const [groups, setGroups] = React.useState<{ id: string; name: string }[]>([])
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
                    // 🔑 2. fetch organization_id from organization_members
                    const { data: member } = await supabase
                        .from("organization_members")
                        .select("organization_id")
                        .eq("user_id", user.id)
                        .maybeSingle();

                    if (member) {
                        // set directly on the form
                        form.setValue("organization_id", String(member.organization_id));
                    }
                }

                // 3. load additional dropdown data
                await Promise.all([
                    getAllGroups().then((res) => {
                        // actions return { success: boolean, data: any }
                        const r = res as any
                        if (r && r.success) setGroups(r.data || []);
                    }),
                    getAllPositions().then((res) => {
                        const r = res as any
                        if (r && r.success) setPositions(r.data || []);
                    }),
                    (formType === "edit" ? getAllUsers() : getAllUsersNotRegistered()).then((res) => {
                        const r = res as any
                        if (r && r.success) setUsers(r.data || []);
                    }),
                ]);

                // 4. preload default values when editing
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
                        card_number: rfidInitial?.card_number || ((initialValues as any)?.rfid_cards?.card_number) || "",
                        card_type: rfidInitial?.card_type || ((initialValues as any)?.rfid_cards?.card_type) || "",
                    });
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Unknown error';
                toast.error(msg);
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

            // 🔑 sanitize date fields
            const safeMemberData: Partial<IOrganization_member> = {
                ...memberData,
                hire_date: memberData.hire_date || new Date().toISOString().slice(0, 10), // YYYY-MM-DD
                // keep undefined instead of null to match interface expectations
                probation_end_date: memberData.probation_end_date || undefined,
            };


            let memberId: string | null = null;

            if (formType === "edit" && initialValues?.id) {
                const res = await updateOrganizationMember(initialValues.id, safeMemberData);
                if (!res.success) throw new Error(res.message);
                memberId = initialValues.id;
            } else {
                const res = await createOrganizationMember(safeMemberData);
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
            const msg = err instanceof Error ? err.message : 'Unknown error';
            toast.error(msg);
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
                                    <FormLabel>Group</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl className="w-full">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Group" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {groups.map((org) => (
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

                        {/* Hide hire_date field */}
                        {/* 
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
                        */}

                        {/* Hide probation_end_date field */}
                        {/* 
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
                        */}

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
                                    <FormLabel>Card Number (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter card number (optional)" {...field} />
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
                                    <FormLabel>Card Type (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter card type (optional)" {...field} />
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
