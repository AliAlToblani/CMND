import React, { useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, FileText, FolderOpen, GitBranch, ClipboardCheck } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const prefetchMap: Record<string, () => Promise<any>> = {
  "/batelco": () => import("@/pages/batelco/BatelcoDashboard"),
  "/batelco/customers": () => import("@/pages/batelco/BatelcoCustomers"),
  "/batelco/pipeline": () => import("@/pages/batelco/BatelcoPipeline"),
  "/batelco/projects": () => import("@/pages/batelco/BatelcoProjects"),
  "/batelco/contracts": () => import("@/pages/batelco/BatelcoContracts"),
  "/batelco/documents": () => import("@/pages/batelco/BatelcoDocuments"),
};

const navItems = [
  { title: "Dashboard", icon: Home, path: "/batelco" },
  { title: "Customers", icon: Users, path: "/batelco/customers" },
  { title: "Pipeline Map", icon: GitBranch, path: "/batelco/pipeline" },
  { title: "Projects Overview", icon: ClipboardCheck, path: "/batelco/projects" },
  { title: "Contracts", icon: FileText, path: "/batelco/contracts" },
  { title: "Documents", icon: FolderOpen, path: "/batelco/documents" },
];

export function BatelcoSidebar() {
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === "/batelco") return location.pathname === "/batelco";
    return location.pathname.startsWith(path);
  };

  const handleMouseEnter = useCallback((path: string) => {
    const prefetch = prefetchMap[path];
    if (prefetch) prefetch().catch(() => {});
  }, []);

  return (
    <Sidebar className="border-0 transition-all duration-300 bg-transparent backdrop-blur-sm">
      <SidebarHeader className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500/10 to-transparent">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/20 to-red-500/10 flex items-center justify-center">
            <span className="text-lg font-bold text-red-600">B</span>
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-br from-red-600 to-red-500 bg-clip-text text-transparent">
              Batelco
            </h2>
            <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
              Partner Portal
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-transparent px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-semibold text-xs uppercase tracking-wider mb-2 px-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={isActive(item.path)}
                    className="group relative overflow-hidden transition-all duration-300 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-500/5 rounded-xl data-[active=true]:bg-gradient-to-r data-[active=true]:from-red-500/15 data-[active=true]:to-red-500/10 data-[active=true]:shadow-lg"
                  >
                    <Link
                      to={item.path}
                      className="flex items-center py-2.5 px-3"
                      onMouseEnter={() => handleMouseEnter(item.path)}
                    >
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                        <item.icon className="h-5 w-5 text-red-600" />
                      </div>
                      <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground group-data-[active=true]:text-foreground transition-colors">
                        {item.title}
                      </span>
                      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-red-500 to-red-600 rounded-r-full opacity-0 group-hover:opacity-100 group-data-[active=true]:opacity-100 transition-opacity duration-300" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
