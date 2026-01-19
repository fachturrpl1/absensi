"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddClientDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (client: ClientFormData) => void
    initialData?: ClientFormData
}

export interface ClientFormData {
    name: string
    address: string
    phone: string
    phoneCountry: string
    emails: string
    projects: string[]
}

export function AddClientDialog({ open, onOpenChange, onSave, initialData }: AddClientDialogProps) {
    const [formData, setFormData] = useState<ClientFormData>(
        initialData || {
            name: "",
            address: "",
            phone: "",
            phoneCountry: "id",
            emails: "",
            projects: [],
        }
    )

    const handleSave = () => {
        if (!formData.name.trim()) {
            alert("Name is required")
            return
        }
        onSave(formData)
        onOpenChange(false)
    }

    const handleCancel = () => {
        setFormData(initialData || {
            name: "",
            address: "",
            phone: "",
            phoneCountry: "id",
            emails: "",
            projects: [],
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-6 md:p-8">
                <DialogHeader>
                    <DialogTitle>New client</DialogTitle>
                    <DialogDescription />
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-4">
                        <TabsTrigger value="general">GENERAL</TabsTrigger>
                        <TabsTrigger value="contact">INFO</TabsTrigger>
                        <TabsTrigger value="projects">PROJECTS</TabsTrigger>
                        <TabsTrigger value="budget">BUDGET</TabsTrigger>
                        <TabsTrigger value="invoicing">INVOICING</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-6 pt-5">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                NAME<span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">ADDRESS</Label>
                            <Textarea
                                id="address"
                                placeholder=""
                                rows={5}
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-6 pt-5">
                        <div className="space-y-2">
                            <Label htmlFor="phone">PHONE NUMBER</Label>
                            <div className="flex gap-3 md:gap-4">
                                <Select
                                    value={formData.phoneCountry}
                                    onValueChange={(value) => setFormData({ ...formData, phoneCountry: value })}
                                >
                                    <SelectTrigger className="w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="id">🇮🇩</SelectItem>
                                        <SelectItem value="us">🇺🇸</SelectItem>
                                        <SelectItem value="gb">🇬🇧</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    id="phone"
                                    placeholder="+62 812-345-678"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="emails">EMAIL ADDRESSES</Label>
                            <Input
                                id="emails"
                                placeholder="Add email addresses separated by commas"
                                value={formData.emails}
                                onChange={(e) => setFormData({ ...formData, emails: e.target.value })}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="projects" className="space-y-6 pt-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>PROJECTS / WORK ORDERS</Label>
                                <Button variant="link" className="h-auto p-0 text-blue-600">
                                    Select all
                                </Button>
                            </div>
                            <Input placeholder="Select projects" />
                        </div>
                    </TabsContent>

                    <TabsContent value="budget" className="space-y-6 pt-5">
                        <p className="text-sm text-muted-foreground">Budget settings will be available here.</p>
                    </TabsContent>

                    <TabsContent value="invoicing" className="space-y-6 pt-5">
                        <p className="text-sm text-muted-foreground">Invoicing settings will be available here.</p>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
