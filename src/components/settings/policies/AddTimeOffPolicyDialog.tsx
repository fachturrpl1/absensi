"use client"

import { useState, useEffect } from "react"
import { getAllOrganization_member } from "@/action/members"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, Info, Search, X, CloudUpload } from "lucide-react"
interface AddTimeOffPolicyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (policy: any) => void
}

export function AddTimeOffPolicyDialog({ open, onOpenChange, onSave }: AddTimeOffPolicyDialogProps) {
    const [step, setStep] = useState(1)

    // Form states
    const [policyName, setPolicyName] = useState("")
    const [accrualSchedule, setAccrualSchedule] = useState("annual")
    const [maxAccrual, setMaxAccrual] = useState("")
    const [accrualAmount, setAccrualAmount] = useState("")
    const [accrualRate, setAccrualRate] = useState("")
    const [accrualPer, setAccrualPer] = useState("")
    const [accrualDay, setAccrualDay] = useState("monthly_anniversary")
    const [startingBalance, setStartingBalance] = useState("")
    const [allowNegative, setAllowNegative] = useState(true)
    const [rollover, setRollover] = useState(true)
    const [requireApproval, setRequireApproval] = useState(false)
    const [paidType, setPaidType] = useState<"paid" | "unpaid">("paid")

    // Step 2 states
    const [assignMethod, setAssignMethod] = useState("")
    const [autoAdd, setAutoAdd] = useState(false)
    const [isMemberSelectionOpen, setIsMemberSelectionOpen] = useState(false)
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [availableMembers, setAvailableMembers] = useState<{ id: string; name: string }[]>([])

    // Fetch members on mount
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const result = await getAllOrganization_member()
                if (result.success && result.data) {
                    const mappedMembers = result.data.map((m: any) => ({
                        id: m.id,
                        name: m.user ? `${m.user.first_name || ''} ${m.user.last_name || ''}`.trim() : (m.biodata?.nama || "Unknown Member")
                    }))
                    setAvailableMembers(mappedMembers)
                }
            } catch (error) {
                console.error("Failed to fetch members", error)
            }
        }
        fetchMembers()
    }, [])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
                <DialogHeader className="p-6 pb-2 flex-shrink-0">
                    <DialogTitle className="text-xl">Add time off policy</DialogTitle>
                </DialogHeader>

                {/* Progress Steps */}
                <div className="px-6 pb-6 flex-shrink-0">
                    <div className="relative flex items-center justify-between px-10 mb-4 items-start">
                        {/* Connecting Line */}
                        <div className="absolute left-0 right-0 top-4 -translate-y-1/2 h-1.5 bg-slate-200 -z-10 mx-14 rounded-full" />

                        {/* Step 1 */}
                        <div className="flex flex-col items-center gap-2 bg-white z-10">
                            <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium border-2 transition-colors",
                                step === 1
                                    ? "border-slate-900 bg-white text-slate-900"
                                    : "border-green-500 bg-green-500 text-white"
                            )}>
                                {step > 1 ? <Check className="h-5 w-5" /> : "1"}
                            </div>
                            <span className={cn(
                                "text-xs font-medium uppercase",
                                step === 1 ? "text-slate-900" : "text-slate-500"
                            )}>Set up policy</span>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center gap-2 bg-white z-10">
                            <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium border-2",
                                step === 2
                                    ? "border-slate-900 bg-white text-slate-900"
                                    : "border-slate-200 bg-white text-slate-300"
                            )}>
                                2
                            </div>
                            <span className={cn(
                                "text-xs font-medium uppercase",
                                step === 2 ? "text-slate-900" : "text-slate-400"
                            )}>Assign members</span>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="px-6 py-2 overflow-y-auto flex-1 space-y-8">
                    {step === 1 ? (
                        <>
                            {/* Policy Name */}
                            <div className="space-y-3">
                                <Label htmlFor="policyName" className="text-xs font-bold text-slate-500 uppercase">
                                    POLICY NAME*
                                </Label>
                                <Input
                                    id="policyName"
                                    placeholder="Enter the policy name"
                                    value={policyName}
                                    onChange={(e) => setPolicyName(e.target.value)}
                                    className="h-11"
                                />
                            </div>

                            {/* Accrual Section */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-slate-800">ACCRUAL</h3>

                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">
                                        SCHEDULE OF ACCRUAL
                                    </Label>
                                    <RadioGroup
                                        value={accrualSchedule}
                                        onValueChange={setAccrualSchedule}
                                        className="flex flex-wrap gap-2"
                                    >
                                        {[
                                            { value: "none", label: "None" },
                                            { value: "annual", label: "Annual" },
                                            { value: "monthly", label: "Monthly" },
                                            { value: "hours_worked", label: "Hours worked" },
                                            { value: "joined_date", label: "Policy joined date" },
                                        ].map((option) => (
                                            <div key={option.value}>
                                                <RadioGroupItem value={option.value} id={`accrual-${option.value}`} className="peer sr-only" />
                                                <Label
                                                    htmlFor={`accrual-${option.value}`}
                                                    className={cn(
                                                        "flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium cursor-pointer transition-all hover:bg-slate-50",
                                                        accrualSchedule === option.value
                                                            ? "border-slate-900 text-slate-900 bg-slate-50 ring-1 ring-slate-900"
                                                            : "border-slate-200 text-slate-600"
                                                    )}
                                                >
                                                    {option.label}
                                                </Label>
                                            </div>
                                        ))}

                                    </RadioGroup>
                                </div>

                                {accrualSchedule === "monthly" ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="accrualAmount" className="text-xs font-bold text-slate-500 uppercase">
                                                    ACCRUAL AMOUNT*
                                                </Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Info className="h-4 w-4 text-slate-400" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Amount of time accrued per month</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center group">
                                                    <Input
                                                        id="accrualAmount"
                                                        className="h-11 rounded-r-none border-r-0 w-32 focus-visible:ring-0 focus-visible:border-slate-300 shadow-none z-10"
                                                        value={accrualAmount}
                                                        onChange={(e) => setAccrualAmount(e.target.value)}
                                                    />
                                                    <div className="flex h-11 items-center px-4 rounded-r-md border border-l-0 bg-slate-100 text-slate-600 text-sm whitespace-nowrap group-focus-within:border-slate-300 transition-colors">
                                                        hours / month
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">
                                                    ACCRUAL DAY
                                                </Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Info className="h-4 w-4 text-slate-400" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>When the accrual happens</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <Select value={accrualDay} onValueChange={setAccrualDay}>
                                                <SelectTrigger className="h-11 border-slate-300">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly_anniversary">Monthly anniversary</SelectItem>
                                                    <SelectItem value="start_of_month">Start of month</SelectItem>
                                                    <SelectItem value="end_of_month">End of month</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ) : accrualSchedule === "hours_worked" ? (
                                    <div className="space-y-6">
                                        <div className="rounded-md bg-blue-50 p-4 border border-blue-100">
                                            <div className="flex gap-3">
                                                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-slate-700">
                                                    <p>
                                                        Time off hours accrue only when hours are <strong>marked as paid</strong> — they're included in a payment record, not necessarily paid out. <a href="#" className="text-blue-500 hover:underline">Learn more</a>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">
                                                AMOUNT ACCRUED*
                                            </Label>
                                            <div className="flex items-center">
                                                <Input
                                                    className="h-11 rounded-r-none border-r-0 w-24 z-10 focus-visible:ring-0 focus-visible:border-slate-300"
                                                    value={accrualRate}
                                                    onChange={(e) => setAccrualRate(e.target.value)}
                                                />
                                                <div className="flex h-11 items-center px-4 border-y bg-slate-100 text-slate-600 text-sm whitespace-nowrap border-slate-200">
                                                    hour(s) accrued for every
                                                </div>
                                                <Input
                                                    className="h-11 rounded-none border-x-0 w-24 z-10 focus-visible:ring-0 focus-visible:border-slate-300"
                                                    value={accrualPer}
                                                    onChange={(e) => setAccrualPer(e.target.value)}
                                                />
                                                <div className="flex h-11 items-center px-4 rounded-r-md border border-l-0 bg-slate-100 text-slate-600 text-sm whitespace-nowrap border-slate-200">
                                                    hours worked
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="maxAccrual" className="text-xs font-bold text-slate-500 uppercase">
                                                MAXIMUM ACCRUAL AMOUNT*
                                            </Label>
                                            <div className="flex items-center group">
                                                <Input
                                                    id="maxAccrual"
                                                    className="h-11 rounded-r-none border-r-0 w-32 focus-visible:ring-0 focus-visible:border-slate-300 shadow-none z-10"
                                                    value={maxAccrual}
                                                    onChange={(e) => setMaxAccrual(e.target.value)}
                                                />
                                                <div className="flex h-11 items-center px-4 rounded-r-md border border-l-0 bg-slate-100 text-slate-600 text-sm group-focus-within:border-slate-300 transition-colors">
                                                    hours per year
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : accrualSchedule === "joined_date" ? (
                                    <div className="space-y-6">
                                        <div className="rounded-md bg-white p-4 border border-blue-200 shadow-sm relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                            <div className="flex gap-3">
                                                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-slate-700">
                                                    <p>
                                                        Balances are prorated and may take up to <strong>24 hours</strong> to display for members added to a time off policy set to &ldquo;Policy joined date&rdquo;.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="maxAccrual" className="text-xs font-bold text-slate-500 uppercase">
                                                MAXIMUM ACCRUAL AMOUNT*
                                            </Label>
                                            <div className="flex items-center group">
                                                <Input
                                                    id="maxAccrual"
                                                    className="h-11 rounded-r-none border-r-0 w-32 focus-visible:ring-0 focus-visible:border-slate-300 shadow-none z-10"
                                                    value={maxAccrual}
                                                    onChange={(e) => setMaxAccrual(e.target.value)}
                                                />
                                                <div className="flex h-11 items-center px-4 rounded-r-md border border-l-0 bg-slate-100 text-slate-600 text-sm group-focus-within:border-slate-300 transition-colors">
                                                    hours per year
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : accrualSchedule === "none" ? (
                                    <div className="space-y-3">
                                        <Label htmlFor="startingBalance" className="text-xs font-bold text-slate-500 uppercase">
                                            STARTING BALANCE
                                        </Label>
                                        <Input
                                            id="startingBalance"
                                            placeholder="Enter amount of hours"
                                            value={startingBalance}
                                            onChange={(e) => setStartingBalance(e.target.value)}
                                            className="h-11 border-slate-200"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <Label htmlFor="maxAccrual" className="text-xs font-bold text-slate-500 uppercase">
                                            MAXIMUM ACCRUAL AMOUNT*
                                        </Label>
                                        <div className="flex items-center group">
                                            <Input
                                                id="maxAccrual"
                                                className="h-11 rounded-r-none border-r-0 w-32 focus-visible:ring-0 focus-visible:border-slate-300 shadow-none z-10"
                                                value={maxAccrual}
                                                onChange={(e) => setMaxAccrual(e.target.value)}
                                            />
                                            <div className="flex h-11 items-center px-4 rounded-r-md border border-l-0 bg-slate-100 text-slate-600 text-sm group-focus-within:border-slate-300 transition-colors">
                                                hours per year
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Options Section */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-slate-800">OPTIONS</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={cn(
                                        "flex items-start space-x-3 rounded-lg border p-4 transition-colors cursor-pointer",
                                        allowNegative ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"
                                    )} onClick={() => setAllowNegative(!allowNegative)}>
                                        <Checkbox
                                            id="allowNegative"
                                            checked={allowNegative}
                                            onCheckedChange={(checked) => setAllowNegative(checked as boolean)}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="allowNegative" className="font-medium cursor-pointer">
                                                Allow negative balances
                                            </Label>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                Members may request time off even if it lowers their balance to below 0
                                            </p>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "flex items-start space-x-3 rounded-lg border p-4 transition-colors cursor-pointer",
                                        rollover ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"
                                    )} onClick={() => setRollover(!rollover)}>
                                        <Checkbox
                                            id="rollover"
                                            checked={rollover}
                                            onCheckedChange={(checked) => setRollover(checked as boolean)}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="rollover" className="font-medium cursor-pointer">
                                                Balance rolls over annually
                                            </Label>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                Any remaining balance will be kept on January 1st
                                            </p>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "flex items-start space-x-3 rounded-lg border p-4 transition-colors cursor-pointer md:col-span-2 md:w-1/2",
                                        requireApproval ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"
                                    )} onClick={() => setRequireApproval(!requireApproval)}>
                                        <Checkbox
                                            id="requireApproval"
                                            checked={requireApproval}
                                            onCheckedChange={(checked) => setRequireApproval(checked as boolean)}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="requireApproval" className="font-medium cursor-pointer">
                                                Require approval
                                            </Label>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                Requests must be manually approved by a manager or team lead
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">
                                        PAID OR UNPAID
                                    </Label>
                                    <div className="flex">
                                        <button
                                            type="button"
                                            onClick={() => setPaidType("paid")}
                                            className={cn(
                                                "px-6 py-2 text-sm font-medium border transition-colors first:rounded-l-md last:rounded-r-md focus:z-10",
                                                paidType === "paid"
                                                    ? "bg-slate-900 border-slate-900 text-white z-10"
                                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            Paid
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaidType("unpaid")}
                                            className={cn(
                                                "px-6 py-2 text-sm font-medium border border-l-0 transition-colors first:rounded-l-md last:rounded-r-md focus:z-10",
                                                paidType === "unpaid"
                                                    ? "bg-slate-900 border-slate-900 text-white z-10"
                                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            Unpaid
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        Hours in approved time off requests will count towards amounts owed
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-slate-600 text-sm">
                                Choose how you want to assign members to the time off policy
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">
                                        ADD MEMBERS THROUGH
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-slate-400" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Select criteria to add members</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Select value={assignMethod} onValueChange={setAssignMethod}>
                                    <SelectTrigger className="w-full h-11 border-slate-300 text-left">
                                        {assignMethod ? (
                                            <span className="text-slate-900 font-medium">
                                                {assignMethod === "list" && "List of members"}
                                                {assignMethod === "attributes" && "Home country and Employment type"}
                                                {assignMethod === "import" && "Import CSV"}
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 font-normal">Select how to add members</span>
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="list" textValue="List of members" className="py-3 cursor-pointer focus:bg-slate-50">
                                            <div className="flex flex-col text-left gap-0.5">
                                                <span className="font-medium text-slate-900">List of members</span>
                                                <span className="text-xs text-slate-500">List of all members belonging to the organization</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="attributes" textValue="Home country and Employment type" className="py-3 cursor-pointer focus:bg-slate-50">
                                            <div className="flex flex-col text-left gap-0.5">
                                                <span className="font-medium text-slate-900">Home country and Employment type</span>
                                                <span className="text-xs text-slate-500">Auto-assign by country and/or employment type fields from members profile</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="import" textValue="Import CSV" className="py-3 cursor-pointer focus:bg-slate-50">
                                            <div className="flex flex-col text-left gap-0.5">
                                                <span className="font-medium text-slate-900">Import CSV</span>
                                                <span className="text-xs text-slate-500">Upload CSV file</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {assignMethod === "list" && (
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-3">
                                        <div
                                            className="relative cursor-pointer"
                                            onClick={() => setIsMemberSelectionOpen(true)}
                                        >
                                            <Input
                                                placeholder="Select members"
                                                className="h-11 cursor-pointer"
                                                readOnly
                                                value={selectedMembers.length > 0 ? `${selectedMembers.length} members selected` : ""}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox
                                            id="autoAdd"
                                            checked={autoAdd}
                                            onCheckedChange={(checked) => setAutoAdd(checked as boolean)}
                                        />
                                        <Label htmlFor="autoAdd" className="text-sm font-normal text-slate-700 cursor-pointer">
                                            Automatically add all new members to this policy
                                        </Label>
                                    </div>
                                </div>
                            )}

                            {assignMethod === "attributes" && (
                                <div className="space-y-6 pt-2">
                                    <div className="rounded-md bg-blue-50 p-4 border border-blue-100 flex gap-3">
                                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-slate-700">
                                            <p>
                                                This policy is based on <strong>Home address - country</strong> and <strong>Employment type</strong> fields. <a href="#" className="text-blue-500 hover:underline">Member profiles</a> must be up-to-date to ensure proper policy assignment.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">
                                                    HOME ADDRESS - COUNTRY
                                                </Label>
                                                <button className="text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline">
                                                    Select all
                                                </button>
                                            </div>
                                            <Input
                                                placeholder="Select home country"
                                                className="h-11"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">
                                                    EMPLOYMENT TYPE
                                                </Label>
                                                <button className="text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline">
                                                    Select all
                                                </button>
                                            </div>
                                            <Input
                                                placeholder="Select employment type"
                                                className="h-11"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {assignMethod === "import" && (
                                <div className="space-y-4 pt-2">
                                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors">
                                        <div className="h-12 w-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                                            <CloudUpload className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-sm font-medium text-slate-900 mb-1">
                                            Click to upload or drag and drop
                                        </h3>
                                        <p className="text-xs text-slate-500 mb-4">
                                            CSV file up to 10MB
                                        </p>
                                        <Button variant="outline" className="h-9">
                                            Browse file
                                        </Button>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <span>Supported format: .csv</span>
                                        <a href="#" className="text-blue-500 hover:underline flex items-center gap-1">
                                            Download template
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t border-slate-100 flex items-center justify-between sm:justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-8">
                        Cancel
                    </Button>
                    <div className="flex gap-2">
                        {step === 2 && (
                            <Button variant="outline" onClick={() => setStep(1)} className="h-11 px-8">
                                Back
                            </Button>
                        )}
                        <Button
                            onClick={() => {
                                if (step === 1) {
                                    setStep(2)
                                } else {
                                    onSave({
                                        name: policyName,
                                        members: selectedMembers.length,
                                        accrualSchedule: accrualSchedule === "joined_date" ? "Policy joined date" :
                                            accrualSchedule === "hours_worked" ? "Hours worked" :
                                                accrualSchedule === "monthly" ? "Monthly" :
                                                    accrualSchedule === "annual" ? "Annual" : "None"
                                    })
                                    onOpenChange(false)
                                    // Reset step for next time
                                    setTimeout(() => setStep(1), 300)
                                }
                            }}
                            className={cn(
                                "h-11 px-8 text-white",
                                "bg-slate-900 hover:bg-slate-800"
                            )}>
                            {step === 1 ? "Next" : "Save"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent >

            <MemberSelectionModal
                open={isMemberSelectionOpen}
                onOpenChange={setIsMemberSelectionOpen}
                selectedMembers={selectedMembers}
                onSave={setSelectedMembers}
                members={availableMembers}
            />
        </Dialog >
    )
}

function MemberSelectionModal({ open, onOpenChange, selectedMembers, onSave, members }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedMembers: string[];
    onSave: (members: string[]) => void;
    members: { id: string; name: string }[];
}) {
    // Mock members data removed

    const [localSelected, setLocalSelected] = useState<string[]>(selectedMembers)
    const [searchQuery, setSearchQuery] = useState("")

    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10

    // Effect to sync when opening
    useEffect(() => {
        if (open) {
            setLocalSelected(selectedMembers)
            setCurrentPage(1) // Reset to first page on open
        }
    }, [open, selectedMembers])

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    const filteredMembers = members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const paginatedMembers = filteredMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    const handleToggle = (id: string) => {
        if (localSelected.includes(id)) {
            setLocalSelected(localSelected.filter(i => i !== id))
        } else {
            setLocalSelected([...localSelected, id])
        }
    }

    const handleSelectAll = () => {
        // Select all filtered members (across all pages)
        setLocalSelected(filteredMembers.map(m => m.id))
    }

    const handleClearAll = () => {
        setLocalSelected([])
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden flex flex-col h-[85vh]">
                <DialogHeader className="p-4 pb-2 flex-shrink-0 border-b border-transparent">
                    <DialogTitle className="text-xl font-semibold">Members</DialogTitle>
                </DialogHeader>

                <div className="px-4 pb-0">
                    <div className="flex border-b border-blue-500 w-max">
                        <button className="px-1 py-2 text-sm font-medium text-blue-500">
                            MEMBERS
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4 flex-1 overflow-hidden flex flex-col">
                    {/* Search and Actions */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search members"
                                className="pl-9 pr-8 h-10 rounded-full border-slate-300"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2 text-sm">
                            <button onClick={handleSelectAll} className="text-blue-500 hover:underline font-medium">Select all</button>
                            <button onClick={handleClearAll} className="text-slate-500 hover:underline">Clear all</button>
                        </div>
                    </div>

                    {/* Members List */}
                    <div className="border border-slate-200 rounded-md flex-1 overflow-hidden flex flex-col">
                        <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={localSelected.length > 0 && localSelected.length === filteredMembers.length}
                                    onCheckedChange={(checked) => checked ? handleSelectAll() : handleClearAll()}
                                    className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                />
                                <span className="text-sm font-medium text-slate-700">
                                    Members ({localSelected.length}/{members.length})
                                </span>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {paginatedMembers.length > 0 ? (
                                paginatedMembers.map(member => (
                                    <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors">
                                        <Checkbox
                                            id={`member-${member.id}`}
                                            checked={localSelected.includes(member.id)}
                                            onCheckedChange={() => handleToggle(member.id)}
                                            className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                        />
                                        <Label htmlFor={`member-${member.id}`} className="text-sm text-slate-700 font-normal cursor-pointer flex-1">
                                            {member.name}
                                        </Label>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-slate-500">
                                    No members found
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="p-2 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 px-2 text-xs"
                                >
                                    Previous
                                </Button>
                                <span className="text-xs text-slate-500">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-8 px-2 text-xs"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-slate-500">
                        Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredMembers.length)} of {filteredMembers.length} members
                    </div>
                </div>

                <DialogFooter className="p-4 border-t border-slate-100">
                    <Button
                        onClick={() => {
                            onSave(localSelected)
                            onOpenChange(false)
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white w-24"
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
