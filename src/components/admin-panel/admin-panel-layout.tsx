"use client";

import { LayoutWrapper } from "@/components/layout/layout-wrapper";

export default function AdminPanelLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <LayoutWrapper>{children}</LayoutWrapper>;
}
