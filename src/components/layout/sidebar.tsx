'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Settings,
  CircleHelp,
  BarChart,
  ListTodo,
  Package,
  Hand,
  Upload,
} from 'lucide-react';
import { TechnofiableIcon } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const menuItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/packages', icon: Package, label: 'Packages' },
  { href: '/activities', icon: ListTodo, label: 'Live Planning Bar' },
  { href: '/hold-log', icon: Hand, label: 'Hold Log' },
  { href: '/reports', icon: BarChart, label: 'Advanced Reporting' },
  { href: '/upload', icon: Upload, label: 'Bulk Upload' },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <div className="flex flex-col h-full">
        <div>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2 bg-sidebar-accent rounded-md">
              <TechnofiableIcon className="w-8 h-8 shrink-0" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold font-headline truncate hidden group-hover/sidebar:inline">Technofiable</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span className="hidden group-hover/sidebar:inline">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </div>
        <div className="mt-auto">
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Help">
                  <Link href="#">
                    <CircleHelp />
                    <span className="hidden group-hover/sidebar:inline">Help</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link href="#">
                    <Settings />
                    <span className="hidden group-hover/sidebar:inline">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="border-t border-border -mx-2 my-2"></div>
            <div className="flex items-center gap-3 p-2">
              <Avatar>
                <AvatarImage src="https://picsum.photos/100/100" data-ai-hint="person" alt="User avatar" />
                <AvatarFallback>T</AvatarFallback>
              </Avatar>
              <div className="flex-col group-hover/sidebar:flex hidden">
                <span className="text-sm font-semibold">Tariq</span>
                <span className="text-xs text-muted-foreground">Administrator</span>
              </div>
            </div>
          </SidebarFooter>
        </div>
      </div>
    </Sidebar>
  );
}
