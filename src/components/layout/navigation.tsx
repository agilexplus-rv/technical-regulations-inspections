"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers-simple";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, 
  FileText, 
  Plus, 
  List, 
  Settings, 
  Users, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Navigation() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't render navigation if user is not authenticated
  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
    },
    {
      name: "Inspections",
      href: "/dashboard/inspections",
      icon: FileText,
    },
    {
      name: "New Inspection",
      href: "/inspections/new",
      icon: Plus,
    },
    {
      name: "Checklists",
      href: "/dashboard/checklists",
      icon: List,
    },
  ];

  const adminItems = [
    {
      name: "User Management",
      href: "/dashboard/settings/users",
      icon: Users,
    },
    {
      name: "System Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-lg font-bold text-primary">
                Technical Regulations Inspections
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-1 text-sm text-gray-700 hover:text-primary transition-colors whitespace-nowrap"
              >
                <item.icon className="h-3 w-3" />
                <span className="hidden xl:inline">{item.name}</span>
              </Link>
            ))}
            
            {user?.role === 'admin' && adminItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-1 text-sm text-gray-700 hover:text-primary transition-colors whitespace-nowrap"
              >
                <item.icon className="h-3 w-3" />
                <span className="hidden xl:inline">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="text-xs text-gray-700 hidden xl:block">
              {user?.firstName} {user?.lastName} ({user?.role})
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs">
              <LogOut className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
              
              {user?.role === 'admin' && adminItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="px-3 py-2 text-xs text-gray-700">
                  {user?.firstName} {user?.lastName} ({user?.role})
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="w-full mt-2 text-xs"
                >
                  <LogOut className="h-3 w-3 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
