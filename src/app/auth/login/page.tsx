"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers-simple";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Eye, EyeOff, Shield } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { signIn, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  // Redirect when user is authenticated
  useEffect(() => {
    if (user) {
      console.log('LoginPage: User authenticated, redirecting to:', redirectTo);
      setLoading(false); // Stop loading when user is authenticated
      
      // Use the redirect parameter if available, otherwise redirect based on user role
      if (redirectTo && redirectTo !== '/dashboard') {
        router.push(redirectTo);
      } else {
        // Redirect based on user role
        switch (user.role) {
          case "inspector":
            router.push("/dashboard/inspector");
            break;
          case "officer":
          case "manager":
          case "admin":
            router.push("/dashboard");
            break;
          default:
            router.push("/dashboard/inspector");
        }
      }
    }
  }, [user, router, redirectTo]);

  // Add timeout to prevent stuck loading state
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('LoginPage: Loading timeout - forcing loading to false');
        setLoading(false);
      }, 15000); // 15 second timeout to allow for profile loading

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn(email, password);
      
      // Check if MFA is required
      if (result.requiresMFA && result.userId) {
        // Redirect to MFA verification page
        router.push(`/auth/mfa-verify?userId=${result.userId}&email=${encodeURIComponent(email)}`);
        return;
      }
      
      // The loading state will be set to false in the useEffect when user is authenticated
      // or when the auth state changes
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
      setLoading(false); // Set loading to false on error
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              TRIAPP
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the inspection system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  className="tablet-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="tablet-input pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full tablet-button"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need access? Contact your system administrator.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>Technical Regulations Inspections System</p>
          <p>Secure • Compliant • Offline-Capable</p>
        </div>
      </div>
    </div>
  );
}
