"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";

const getTitle = (pathname: string): string => {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/packages")) return "Packages";
  if (pathname === "/activities") return "Live Planning Bar";
  if (pathname === "/hold-log") return "Hold Log";
  if (pathname === "/reports") return "Advanced Reporting";
  if (pathname === "/upload") return "Bulk Upload";
  return "Technofiable";
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader title={title} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
