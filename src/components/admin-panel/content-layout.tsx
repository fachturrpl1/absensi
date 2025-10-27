import { Navbar } from "@/components/admin-panel/navbar";
import TopBar from "../top-bar";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div>
      <Navbar title={title} />
      <div className="w-full pt-6 sm:pt-8 pb-6 sm:pb-8 px-3 sm:px-6 lg:px-8">
        <TopBar />
        <div className="mt-3 sm:mt-4 max-w-screen-2xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
