"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getAllOrganization, deleteOrganization } from "@/action/organization";
import { IOrganization } from "@/interface";
import { useRouter } from "next/navigation";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import Link from "next/link";
import { Edit, PlusCircleIcon, Trash, Check, X } from "lucide-react";
import { Can } from "@/components/can";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ambil data saat load
  useEffect(() => {
    fetchOrganizations();
  }, []);

  async function fetchOrganizations() {
    setLoading(true);
    const res = await getAllOrganization();
    if (res.success) {
      setOrganizations(res.data);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this organization?")) return;

    const res = await deleteOrganization(id);
    if (res.success) {
      toast.success("Organization deleted successfully");
      setOrganizations((prev) => prev.filter((org) => org.id !== id));
    } else {
      toast.error(res.message);
    }
  }

  // definisi kolom table
  const columns: ColumnDef<IOrganization>[] = [

    {
      accessorKey: "name",
      header: "Organization",
      cell: ({ row }) => {
        const org = row.original;
        return (
          <div className="flex items-center gap-3">
            {org.logo_url && (
              <img
                src={org.logo_url}
                alt={org.name}
                className="w-8 h-8 rounded object-cover border"
              />
            )}
            <div>
              <p className="font-semibold">{org.name}</p>
              <p className="text-sm text-muted-foreground">
                {org.email || "No email"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.getValue("is_active") as boolean;
        return active ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
            <Check className="w-3 h-3 mr-1" /> Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-300 text-black">
            <X className="w-3 h-3 mr-1" /> Inactive
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const org = row.original;
        return (
          <div className="flex gap-2">
            <Can permission="edit_organization">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push(`/organization/edit/${org.id}`)}
                className="cursor-pointer bg-secondary border-0 shadow-0 p-0 m-0"
              >
                <Edit />
              </Button>
            </Can>
            <Button
              variant="outline"
              size="icon"
              className="text-red-500 cursor-pointer bg-secondary border-0 p-0 m-0"
              onClick={() => handleDelete(org.id!)}
            >
              <Trash />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <ContentLayout title="Organization">
      <div className="w-full max-w-6xl mx-auto mt-20">
        <div className="">

          <Can permission="add_organization">
            <Link href="/organization/add" >
              <Button className="flex gap-2 float-end ml-5">
                <PlusCircleIcon className="w-5 h-5" /> Add
              </Button>
            </Link>
          </Can>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <DataTable columns={columns} data={organizations} filterColumn="name" />
        )}
      </div>

    </ContentLayout>
  );
}
