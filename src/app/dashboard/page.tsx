import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Users,
  Settings,
  BarChart3,
  ClipboardList
} from "lucide-react";

export default function DashboardPage() {
  console.log('DashboardPage - Rendering dashboard (client-side auth will handle protection)');
  
  // Temporarily disable server-side auth check to break the redirect loop
  // The client-side authentication in the layout will handle protection
  // TODO: Fix server-side authentication to work properly with client-side sessions
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the Technical Regulations Inspections system</p>
      </div>
      
      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button className="flex-1 btn-primary tablet-button" asChild>
          <Link href="/inspections/new">
            <Plus className="h-4 w-4 mr-2" />
            Start New Inspection
          </Link>
        </Button>
        <Button variant="outline" className="flex-1 tablet-button" asChild>
          <Link href="/dashboard/inspections">
            <Search className="h-4 w-4 mr-2" />
            Search Inspections
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+15.8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">In progress inspections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">16</div>
            <p className="text-xs text-muted-foreground">+8.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Electronics Store Inspection</p>
                  <p className="text-xs text-gray-500">Started 2 hours ago</p>
                </div>
                <Badge variant="secondary">In Progress</Badge>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Clothing Retailer Check</p>
                  <p className="text-xs text-gray-500">Completed yesterday</p>
                </div>
                <Badge variant="outline">Completed</Badge>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Food Safety Inspection</p>
                  <p className="text-xs text-gray-500">Scheduled for tomorrow</p>
                </div>
                <Badge variant="outline">Scheduled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/checklists">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Manage Checklists
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/settings/users">
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  System Settings
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/reports">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}