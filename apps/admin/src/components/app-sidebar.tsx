import * as React from "react"
import { Link } from "react-router-dom"
import {
  ActivityIcon,
  BarChart3Icon,
  BrainIcon,
  CoinsIcon,
  CodeIcon,
  FileTextIcon,
  GlobeIcon,
  HardDriveIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  PackageIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Users",
      url: "/users",
      icon: UsersIcon,
    },
    {
      title: "Chats",
      url: "/chats",
      icon: MessageSquareIcon,
    },
    {
      title: "AI Models",
      url: "/models",
      icon: BrainIcon,
    },
    {
      title: "Tokens",
      url: "/tokens",
      icon: CoinsIcon,
    },
    {
      title: "Storage",
      url: "/storage",
      icon: HardDriveIcon,
    },
    {
      title: "Publications",
      url: "/publications",
      icon: GlobeIcon,
    },
    {
      title: "System Health",
      url: "/health",
      icon: ActivityIcon,
    },
    {
      title: "Functions",
      url: "/functions",
      icon: CodeIcon,
    },
    {
      title: "User Analytics",
      url: "/analytics",
      icon: BarChart3Icon,
    },
    {
      title: "Dependencies",
      url: "/dependencies",
      icon: PackageIcon,
    },
    {
      title: "Audit Logs",
      url: "/audit-logs",
      icon: FileTextIcon,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: SettingsIcon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/">
                <LayoutDashboardIcon className="h-5 w-5" />
                <span className="text-base font-semibold tracking-tight">
                  CepatUsaha Admin
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
