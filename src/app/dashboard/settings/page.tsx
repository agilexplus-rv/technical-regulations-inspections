"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers-simple";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, Globe, Clock, Mail, Phone, MapPin, Save, RefreshCw } from "lucide-react";
import { getOrganizationSettings, updateOrganizationSettings, type OrganizationSettings as OrgSettings } from "@/lib/server-actions/organization-settings";

// Use the imported type from server actions
type OrganizationSettings = OrgSettings;

const timezones = [
  { value: "Europe/Malta", label: "Europe/Malta (GMT+1)" },
  { value: "Europe/London", label: "Europe/London (GMT+0)" },
  { value: "Europe/Paris", label: "Europe/Paris (GMT+1)" },
  { value: "Europe/Rome", label: "Europe/Rome (GMT+1)" },
  { value: "America/New_York", label: "America/New_York (GMT-5)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (GMT+9)" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "mt", label: "Maltese" },
  { value: "it", label: "Italian" },
];

const currencies = [
  { value: "EUR", label: "Euro (€)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "GBP", label: "British Pound (£)" },
];

const dateFormats = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (European)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (American)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
];

const timeFormats = [
  { value: "12h", label: "12-hour (AM/PM)" },
  { value: "24h", label: "24-hour" },
];

const backupFrequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function GeneralSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  console.log('GeneralSettings: Current auth state:', { user: user ? { id: user.id, email: user.email, role: user.role } : null, authLoading });
  
  const [settings, setSettings] = useState<OrganizationSettings>({
    name: "",
    shortName: "",
    description: "",
    website: "",
    email: "",
    phone: "",
    address: "",
    timezone: "Europe/Malta",
    language: "en",
    currency: "EUR",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    inspectionPrefix: "INS",
    autoGenerateReports: true,
    emailNotifications: true,
    smsNotifications: false,
    backupFrequency: "daily",
    dataRetentionDays: 2555, // 7 years
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getOrganizationSettings();
      
      if (result.success && result.settings) {
        setSettings(result.settings);
      } else {
        setError(result.error || "Failed to load settings");
      }
    } catch (err) {
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const result = await updateOrganizationSettings(settings);
      
      if (result.success && result.settings) {
        setSettings(result.settings);
        setSuccess("Settings saved successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to save settings");
      }
    } catch (err) {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof OrganizationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading authentication...</span>
        </div>
      </div>
    );
  }

  console.log('GeneralSettings: Admin check details:', {
    user: user ? { id: user.id, email: user.email, role: user.role } : null,
    userExists: !!user,
    roleIsAdmin: user?.role === "admin",
    roleCheck: user?.role !== "admin",
    conditionResult: !user || user.role !== "admin"
  });

  if (!user || user.role !== "admin") {
    console.log('GeneralSettings: ACCESS DENIED - User:', user ? { id: user.id, email: user.email, role: user.role } : null);
    return (
      <div className="space-y-6">
          <div className="text-center py-8">
          <div className="text-gray-600">Admin access required.</div>
          <div className="text-sm text-gray-500 mt-2">
            Current user: {user ? `${user.email} (${user.role})` : 'Not logged in'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Debug: user exists: {user ? 'yes' : 'no'}, role is admin: {user?.role === 'admin' ? 'yes' : 'no'}
          </div>
        </div>
          </div>
    );
  }

  console.log('GeneralSettings: ACCESS GRANTED - User:', { id: user.id, email: user.email, role: user.role });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">General Settings</h1>
          <p className="text-gray-600 mt-2">Configure your organization and system preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSettings} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
                    </div>
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

      <div className="grid gap-6">
        {/* Organization Information */}
            <Card>
              <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Information
            </CardTitle>
                <CardDescription>
              Basic information about your organization
                </CardDescription>
              </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortName">Short Name</Label>
                <Input
                  id="shortName"
                  value={settings.shortName}
                  onChange={(e) => handleInputChange("shortName", e.target.value)}
                  placeholder="Enter short name"
                />
                      </div>
                      </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter organization description"
                rows={3}
              />
                      </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={settings.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://example.com"
                />
                      </div>
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="contact@organization.com"
                />
                    </div>
                  </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+356 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inspectionPrefix">Inspection Prefix</Label>
                <Input
                  id="inspectionPrefix"
                  value={settings.inspectionPrefix}
                  onChange={(e) => handleInputChange("inspectionPrefix", e.target.value)}
                  placeholder="INS"
                  className="uppercase"
                />
                  </div>
                </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter full address"
                rows={2}
              />
                </div>
              </CardContent>
            </Card>

        {/* Regional Settings */}
            <Card>
              <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Regional Settings
            </CardTitle>
                <CardDescription>
              Configure timezone, language, and regional preferences
                </CardDescription>
              </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={settings.timezone} onValueChange={(value) => handleInputChange("timezone", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={settings.language} onValueChange={(value) => handleInputChange("language", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={settings.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select value={settings.dateFormat} onValueChange={(value) => handleInputChange("dateFormat", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeFormat">Time Format</Label>
              <Select value={settings.timeFormat} onValueChange={(value) => handleInputChange("timeFormat", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time format" />
                </SelectTrigger>
                <SelectContent>
                  {timeFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                </div>
              </CardContent>
            </Card>

        {/* System Preferences */}
            <Card>
              <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              System Preferences
            </CardTitle>
                <CardDescription>
              Configure automation and notification settings
                </CardDescription>
              </CardHeader>
          <CardContent className="space-y-6">
                <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-generate Reports</Label>
                  <p className="text-sm text-gray-600">Automatically generate reports after inspections</p>
                </div>
                <Switch
                  checked={settings.autoGenerateReports}
                  onCheckedChange={(checked) => handleInputChange("autoGenerateReports", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-600">Send email notifications for important events</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleInputChange("emailNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-gray-600">Send SMS notifications for urgent alerts</p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => handleInputChange("smsNotifications", checked)}
                />
              </div>
                </div>
              </CardContent>
            </Card>

        {/* Data Management */}
            <Card>
              <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Data Management
            </CardTitle>
                <CardDescription>
              Configure backup and data retention policies
                </CardDescription>
              </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                <Select value={settings.backupFrequency} onValueChange={(value) => handleInputChange("backupFrequency", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select backup frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {backupFrequencies.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataRetentionDays">Data Retention (Days)</Label>
                <Input
                  id="dataRetentionDays"
                  type="number"
                  value={settings.dataRetentionDays}
                  onChange={(e) => handleInputChange("dataRetentionDays", parseInt(e.target.value) || 0)}
                  placeholder="2555"
                />
                <p className="text-sm text-gray-600">
                  Currently set to {Math.floor(settings.dataRetentionDays / 365)} years
                </p>
              </div>
                </div>
              </CardContent>
            </Card>
      </div>
    </div>
  );
}