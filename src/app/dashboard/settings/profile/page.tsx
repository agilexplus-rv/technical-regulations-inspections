"use client";

import { useAuth } from "@/components/providers-simple";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Mail, 
  Shield, 
  Key, 
  Calendar,
  Edit3
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserProfile, toggleMFA } from "@/lib/server-actions/auth";

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled || false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMfaLoading, setIsMfaLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="text-muted-foreground">Please log in to view your profile.</div>
          </div>
        </div>
      </div>
    );
  }

  const handleMFAToggle = async (enabled: boolean) => {
    if (!user) return;
    
    setIsMfaLoading(true);
    setError("");
    
    try {
      const result = await toggleMFA(enabled, user.id);
      if (result.success) {
        setMfaEnabled(enabled);
        setSuccess(`Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Failed to update MFA setting");
        // Revert the toggle if it failed
        setMfaEnabled(!enabled);
      }
    } catch (error) {
      setError("Failed to update MFA setting");
      setMfaEnabled(!enabled);
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleChangePassword = () => {
    router.push("/dashboard/settings/password");
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setEditForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    });
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    });
    setError("");
    setSuccess("");
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("firstName", editForm.firstName);
      formData.append("lastName", editForm.lastName);
      
      const result = await updateUserProfile(formData);
      if (result.success) {
        setSuccess("Profile updated successfully");
        setTimeout(() => setSuccess(""), 3000);
        setIsEditing(false);
        // Update the user context if possible
        window.location.reload(); // Simple refresh to get updated data
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch (error) {
      setError("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      case "officer":
        return "secondary";
      case "inspector":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-800">{success}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Your basic account details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">First Name</label>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{user.firstName || "Not set"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{user.lastName || "Not set"}</span>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-base">{user.email}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                    {user.role}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Account Created</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Settings */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">
                      {mfaEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <Switch
                    checked={mfaEnabled}
                    onCheckedChange={handleMFAToggle}
                    disabled={isMfaLoading}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleChangePassword}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleEditProfile}
                    disabled={isEditing || isSaving}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
