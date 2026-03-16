import React, { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BatelcoSidebar } from "./BatelcoSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/utils/avatarUtils";
import { BatelcoProvider } from "@/contexts/BatelcoContext";

interface BatelcoLayoutProps {
  children: React.ReactNode;
}

const THEME_KEY = "doo-theme-preference";

export function BatelcoLayout({ children }: BatelcoLayoutProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem(THEME_KEY, "light");
    }
  }, []);

  return (
    <BatelcoProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full dashboard-background">
          <BatelcoSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="backdrop-blur-md bg-background/30 border-b border-border/30 h-16 flex items-center justify-between px-6 z-10">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="hover:bg-muted dark:hover:bg-gray-800 p-2 rounded-md transition-colors text-foreground dark:text-gray-200" />
                <div className="hidden sm:flex items-center gap-2">
                  <div className="h-5 w-px bg-border" />
                  <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded-full">
                    DOO Partner Portal
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-muted dark:hover:bg-gray-800"
                  onClick={toggleTheme}
                >
                  {theme === "light" ? (
                    <Moon className="h-5 w-5 text-muted-foreground dark:text-gray-300" />
                  ) : (
                    <Sun className="h-5 w-5 text-muted-foreground dark:text-gray-300" />
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-full p-0">
                      <Avatar className="h-8 w-8 ring-2 ring-offset-2 ring-red-400">
                        <AvatarImage src={profile?.avatar_url || ""} alt="User" />
                        <AvatarFallback className="bg-red-600 text-white">
                          {getInitials(profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-dropdown">
                    <DropdownMenuLabel>Partner Account</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      className="cursor-pointer hover:bg-white/10 dark:hover:bg-white/5 transition-colors text-red-500"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            <ScrollArea className="flex-1">
              <main className="p-6">
                <div className="animate-fade-in">{children}</div>
              </main>
            </ScrollArea>
          </div>
        </div>
      </SidebarProvider>
    </BatelcoProvider>
  );
}
