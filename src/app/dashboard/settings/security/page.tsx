"use client";

import { useAuth } from "@/components/providers-simple";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Key, 
  Users, 
  Lock,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

export default function SecuritySettingsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="text-muted-foreground">Please log in to access security settings.</div>
          </div>
        </div>
      </div>
    );
  }

  // Only admins can access security settings
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="text-muted-foreground">Access denied. Admin privileges required.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-600 mt-2">Manage system security, access controls, and authentication settings</p>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Authentication Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Authentication
              </CardTitle>
              <CardDescription>
                Configure authentication methods and password policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password Policy</p>
                  <p className="text-sm text-muted-foreground">Minimum 8 characters, mixed case</p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Optional for all users</p>
                </div>
                <Badge variant="secondary">Optional</Badge>
              </div>
              <Button variant="outline" className="w-full">
                Configure Authentication
              </Button>
            </CardContent>
          </Card>

          {/* Access Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Access Control
              </CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Role-Based Access</p>
                  <p className="text-sm text-muted-foreground">Inspector, Officer, Manager, Admin</p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Session Timeout</p>
                  <p className="text-sm text-muted-foreground">8 hours</p>
                </div>
                <Badge variant="secondary">Configured</Badge>
              </div>
              <Button variant="outline" className="w-full">
                Manage Permissions
              </Button>
            </CardContent>
          </Card>

          {/* System Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                System Security
              </CardTitle>
              <CardDescription>
                Monitor and configure system security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">API Security</p>
                  <p className="text-sm text-muted-foreground">JWT tokens with expiration</p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Data Encryption</p>
                  <p className="text-sm text-muted-foreground">AES-256 encryption at rest</p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
              <Button variant="outline" className="w-full">
                Security Configuration
              </Button>
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Audit & Monitoring
              </CardTitle>
              <CardDescription>
                View security logs and monitor system activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Login Attempts</p>
                  <p className="text-sm text-muted-foreground">Last 24 hours: 45 attempts</p>
                </div>
                <Badge variant="outline">Normal</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Failed Logins</p>
                  <p className="text-sm text-muted-foreground">3 failed attempts</p>
                </div>
                <Badge variant="secondary">Low Risk</Badge>
              </div>
              <Button variant="outline" className="w-full">
                View Audit Logs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Security Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Security Status
            </CardTitle>
            <CardDescription>
              Overall security health of the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">System Secure</p>
                  <p className="text-sm text-green-700">All security measures active</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Updates Available</p>
                  <p className="text-sm text-blue-700">2 security patches pending</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                <Lock className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">Backup Status</p>
                  <p className="text-sm text-yellow-700">Last backup: 2 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
