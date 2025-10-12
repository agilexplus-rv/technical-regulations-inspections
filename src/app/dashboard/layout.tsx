"use client";

import { ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { DashboardLayout as ModernDashboardLayout } from '@/components/layout/dashboard-layout';

interface DashboardLayoutProps {
  children: ReactNode;
}

// Helper function to get page title and description based on pathname
function getPageInfo(pathname: string) {
  const pathSegments = pathname.split('/').filter(Boolean);
  
  // Remove 'dashboard' from path segments
  const pagePath = pathSegments.slice(1).join('/');
  
  switch (pagePath) {
    case 'inspector':
      return {
        title: 'Dashboard',
        description: 'Overview of your inspection activities'
      };
    case 'inspections':
      return {
        title: 'Inspections'
      };
    case 'checklists':
      return {
        title: 'Checklists'
      };
    case 'settings':
      return {
        title: 'Settings'
      };
    case 'settings/users':
      return {
        title: 'User Management'
      };
    case 'settings/profile':
      return {
        title: 'Profile Settings'
      };
    case 'settings/integrations':
      return {
        title: 'Integrations'
      };
    case 'settings/geo':
      return {
        title: 'Geographic Settings'
      };
    case 'settings/legislation':
      return {
        title: 'Legislation'
      };
    case 'settings/product-categories':
      return {
        title: 'Product Categories'
      };
    case 'settings/templates':
      return {
        title: 'Templates'
      };
    default:
      return {
        title: 'Dashboard'
      };
  }
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  
  // Memoize the page info to prevent unnecessary recalculations
  const { title, description } = useMemo(() => getPageInfo(pathname), [pathname]);
  
  return (
    <ModernDashboardLayout title={title} description={description}>
      {children}
    </ModernDashboardLayout>
  );
}
