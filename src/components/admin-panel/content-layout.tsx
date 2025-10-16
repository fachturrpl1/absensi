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
      <div className="w-full pt-8 pb-8 px-4 sm:px-8">
        <TopBar />
        <div className="mt-4 max-w-screen-xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
