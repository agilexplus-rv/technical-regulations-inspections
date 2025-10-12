"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers-simple";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  Shield,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  ChevronDown,
  ChevronRight,
  Home,
  MessageSquare,
  HelpCircle,
  Lock,
  Key,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsSubmenuOpen, setSettingsSubmenuOpen] = useState(false);
  const [settingsButtonRect, setSettingsButtonRect] = useState<DOMRect | null>(null);
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const settingsSubmenuRef = useRef<HTMLDivElement>(null);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log('DashboardLayout: No authenticated user, redirecting to login');
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      
      // Check if clicking outside settings submenu (but not on the portal or fallback submenu)
      if (settingsSubmenuRef.current && !settingsSubmenuRef.current.contains(target)) {
        // Check if the target is part of the portal submenu or fallback submenu
        const portalSubmenu = document.querySelector('[data-portal-submenu]');
        const fallbackSubmenu = document.querySelector('[data-fallback-submenu]');
        if ((!portalSubmenu || !portalSubmenu.contains(target)) && 
            (!fallbackSubmenu || !fallbackSubmenu.contains(target))) {
          setSettingsSubmenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navigation = {
    general: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: Home,
        roles: ["inspector", "officer", "manager", "admin"],
      },
      {
        name: "Inspections",
        href: "/dashboard/inspections",
        icon: FileText,
        roles: ["inspector", "officer", "manager", "admin"],
        badge: user?.role === "inspector" ? "8" : null,
      },
      {
        name: "Checklists",
        href: "/dashboard/checklists",
        icon: ClipboardList,
        roles: ["officer", "manager", "admin"],
      },
      {
        name: "Messages",
        href: "/dashboard/messages",
        icon: MessageSquare,
        roles: ["inspector", "officer", "manager", "admin"],
        badge: "3",
      },
    ],
    tools: [
      {
        name: "Reports",
        href: "/dashboard/reports",
        icon: BarChart3,
        roles: ["officer", "manager", "admin"],
      },
      {
        name: "Findings",
        href: "/dashboard/findings",
        icon: AlertTriangle,
        roles: ["inspector", "officer", "manager", "admin"],
      },
      {
        name: "Notices",
        href: "/dashboard/notices",
        icon: FileText,
        roles: ["officer", "manager", "admin"],
      },
      {
        name: "Schedule",
        href: "/dashboard/schedule",
        icon: Clock,
        roles: ["inspector", "officer", "manager", "admin"],
      },
    ],
    support: [
      {
        name: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        roles: ["officer", "manager", "admin"],
        hasSubmenu: true,
        submenuItems: [
          { name: "General Settings", href: "/dashboard/settings", roles: ["admin"] },
          { name: "User Management", href: "/dashboard/settings/users", roles: ["admin"] },
          { name: "Product Categories", href: "/dashboard/settings/product-categories", roles: ["admin"] },
          { name: "Report Templates", href: "/dashboard/settings/templates", roles: ["admin"] },
          { name: "Legislation", href: "/dashboard/settings/legislation", roles: ["officer", "manager", "admin"] },
          { name: "Integrations", href: "/dashboard/settings/integrations", roles: ["admin"] },
          { name: "Geo Settings", href: "/dashboard/settings/geo", roles: ["admin"] },
          { name: "Security", href: "/dashboard/settings/security", roles: ["admin"] },
        ],
      },
      {
        name: "Help",
        href: "/dashboard/help",
        icon: HelpCircle,
        roles: ["inspector", "officer", "manager", "admin"],
      },
    ],
  };

  const getFilteredNavigation = (navItems: any[]) => 
    navItems.filter(item => user && item.roles.includes(user.role));

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-purple-100 text-purple-800";
      case "officer":
        return "bg-blue-100 text-blue-800";
      case "inspector":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render the dashboard if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0 overflow-visible ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                TRIAPP
              </span>
            </div>
            <button
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto scrollbar-thin overflow-x-visible">
            {/* General Section */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                GENERAL
              </h3>
              <div className="space-y-1">
                {getFilteredNavigation(navigation.general).map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || 
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          item.badge === "BETA" 
                            ? "bg-purple-100 text-purple-700" 
                            : "bg-red-100 text-red-700"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Tools Section */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                TOOLS
              </h3>
              <div className="space-y-1">
                {getFilteredNavigation(navigation.tools).map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || 
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          item.badge === "BETA" 
                            ? "bg-purple-100 text-purple-700" 
                            : "bg-red-100 text-red-700"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Support Section */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                SUPPORT
              </h3>
              <div className="space-y-1">
                {getFilteredNavigation(navigation.support).map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || 
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  
                  // Handle Settings with submenu
                  if (item.hasSubmenu) {
                    return (
                      <div key={item.name} className="relative" ref={settingsSubmenuRef}>
                        <button
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setSettingsButtonRect(rect);
                            setSettingsSubmenuOpen(!settingsSubmenuOpen);
                          }}
                          className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full ${
                            isActive
                              ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                            <span>{item.name}</span>
                          </div>
                          <ChevronRight className={`h-4 w-4 transition-transform ${settingsSubmenuOpen ? "rotate-180" : ""}`} />
                        </button>
                        
                        {/* Settings Submenu */}
                        {settingsSubmenuOpen && (
                          <div 
                            data-fallback-submenu 
                            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 w-56 max-h-96 overflow-y-auto"
                            style={{ 
                              zIndex: 999999,
                              left: '280px',
                              top: settingsButtonRect ? settingsButtonRect.top : '100px'
                            }}
                          >
                            <div className="py-2">
                              {navigation.support.find(item => item.hasSubmenu)?.submenuItems?.filter(subItem => 
                                user && subItem.roles.includes(user.role)
                              ).map((subItem) => (
                                <button
                                  key={subItem.name}
                                  onClick={() => {
                                    setSettingsSubmenuOpen(false);
                                    router.push(subItem.href);
                                  }}
                                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer text-left"
                                >
                                  {subItem.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                      </div>
                    );
                  }
                  
                  // Regular navigation item
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <p className="text-xs text-gray-400 text-center">
              © MCCAA
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {pathname.startsWith('/dashboard/settings') ? 'Settings' : title}
                </h1>
                {description && (
                  <p className="text-sm text-gray-500">{description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </button>


              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/dashboard/settings/profile');
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="h-4 w-4 mr-3" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/dashboard/settings/password');
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Key className="h-4 w-4 mr-3" />
                      Change Password
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleSignOut();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="h-full p-6">
            {children}
          </div>
        </main>
      </div>


    </div>
  );
}
