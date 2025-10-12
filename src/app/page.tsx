"use client";

import { useAuth } from "@/components/providers-simple";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('HomePage - Current state:', { 
      user: user ? { id: user.id, email: user.email, role: user.role } : null, 
      loading 
    });
    
    if (!loading && user) {
      console.log('User is authenticated, redirecting to role-specific dashboard...');
      // Redirect based on user role to specific dashboard
      switch (user.role) {
        case "inspector":
          console.log('Redirecting inspector to /dashboard/inspector');
          router.push("/dashboard/inspector");
          break;
        case "officer":
        case "manager":
        case "admin":
          console.log(`Redirecting ${user.role} to /dashboard`);
          // For now, redirect all non-inspector roles to the main dashboard
          // This will show the appropriate dashboard based on their role via the dashboard layout
          router.push("/dashboard");
          break;
        default:
          console.log('Unknown role, redirecting to /dashboard/inspector');
          router.push("/dashboard/inspector");
      }
    } else if (!loading && !user) {
      console.log('No user authenticated, redirecting to login...');
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading authentication...</p>
          <p className="mt-2 text-sm text-gray-500">This should only take a few seconds</p>
          <button 
            onClick={() => router.push("/auth/login")} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Skip to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {user.firstName || user.email}
          </h1>
        </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Inspections</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Link href="/dashboard/inspections">
                        <Button className="w-full">View Inspections</Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>New Inspection</CardTitle>
                      <CardDescription>
                        Start a new inspection
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href="/inspections/new">
                        <Button className="w-full">Create Inspection</Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Checklists</CardTitle>
                      <CardDescription>
                        Manage inspection checklists
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href="/dashboard/checklists">
                        <Button className="w-full">View Checklists</Button>
                      </Link>
                    </CardContent>
                  </Card>

          {user.role === 'admin' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage users and roles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Manage Users</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Settings</Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                <p><strong>MFA Enabled:</strong> {user.mfaEnabled ? 'Yes' : 'No'}</p>
                <p><strong>Last Login:</strong> {user.lastLoginAt ? user.lastLoginAt.toLocaleString() : 'Never'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}