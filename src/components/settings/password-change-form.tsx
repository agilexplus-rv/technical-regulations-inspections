"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers-simple";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { usePasswordValidation } from "@/lib/utils/password-validation";

export function PasswordChangeForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Password validation
  const passwordValidation = usePasswordValidation(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== "";

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!user) {
      setError("You must be logged in to change your password");
      setLoading(false);
      return;
    }

    try {
      const currentPassword = formData.get("currentPassword") as string;

      // Validate passwords match
      if (!passwordsMatch) {
        setError("New passwords do not match");
        setLoading(false);
        return;
      }

      // Validate password strength
      if (!passwordValidation.isValid) {
        setError(`Password requirements not met: ${passwordValidation.errors.join(", ")}`);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          currentPassword,
          newPassword: newPassword,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setError(result.error || "Failed to change password");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
        </div>

        <div className="max-w-md mx-auto">
          <div className="text-center py-8">
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-600 mb-2">Password Changed Successfully</h3>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
      </div>

      <div className="max-w-md mx-auto">
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              Enter your current password and choose a new secure password
            </p>
          </div>
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative mt-2">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative mt-2">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Password Requirements */}
                {newPassword && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Password Strength:</span>
                      <span className={`text-sm font-medium ${passwordValidation.strengthColor}`}>
                        {passwordValidation.strengthDescription}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-xs">
                        {passwordValidation.hasLength ? (
                          <Check className="h-3 w-3 text-green-500 mr-2" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-2" />
                        )}
                        <span className={passwordValidation.hasLength ? "text-green-600" : "text-red-600"}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center text-xs">
                        {passwordValidation.hasUppercase ? (
                          <Check className="h-3 w-3 text-green-500 mr-2" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-2" />
                        )}
                        <span className={passwordValidation.hasUppercase ? "text-green-600" : "text-red-600"}>
                          At least one uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center text-xs">
                        {passwordValidation.hasLowercase ? (
                          <Check className="h-3 w-3 text-green-500 mr-2" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-2" />
                        )}
                        <span className={passwordValidation.hasLowercase ? "text-green-600" : "text-red-600"}>
                          At least one lowercase letter
                        </span>
                      </div>
                      <div className="flex items-center text-xs">
                        {passwordValidation.hasNumbers ? (
                          <Check className="h-3 w-3 text-green-500 mr-2" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-2" />
                        )}
                        <span className={passwordValidation.hasNumbers ? "text-green-600" : "text-red-600"}>
                          At least one number
                        </span>
                      </div>
                      <div className="flex items-center text-xs">
                        {passwordValidation.hasSpecialChars ? (
                          <Check className="h-3 w-3 text-green-500 mr-2" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-2" />
                        )}
                        <span className={passwordValidation.hasSpecialChars ? "text-green-600" : "text-red-600"}>
                          At least one special character
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative mt-2">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Password Match Validation */}
                {confirmPassword && (
                  <div className="mt-2">
                    <div className="flex items-center text-xs">
                      {passwordsMatch ? (
                        <Check className="h-3 w-3 text-green-500 mr-2" />
                      ) : (
                        <X className="h-3 w-3 text-red-500 mr-2" />
                      )}
                      <span className={passwordsMatch ? "text-green-600" : "text-red-600"}>
                        {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={loading || !passwordValidation.isValid || !passwordsMatch} 
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              ← Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
