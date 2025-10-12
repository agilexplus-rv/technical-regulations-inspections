"use client";

import { useState, useEffect } from "react";
import { getAllIntegrations, updateIntegration } from "@/lib/server-actions/settings";
import { useAuth } from "@/components/providers-simple";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Mail, Map, AlertTriangle, Database, Brain, Cloud } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  enabled: boolean;
  config_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const integrationIcons: Record<string, any> = {
  email: Mail,
  google_maps: Map,
  safety_gate: Shield,
  nando: Database,
  icsms: Cloud,
  sentiment_ai: Brain,
  azure_ad: Shield,
};

const integrationDescriptions: Record<string, string> = {
  email: "Email service for sending notifications and reports",
  google_maps: "Google Maps integration for location services",
  safety_gate: "EU Safety Gate API for product recall information",
  nando: "NANDO database for notified bodies",
  icsms: "ICSMS for cross-border cooperation",
  sentiment_ai: "AI sentiment analysis for feedback processing",
  azure_ad: "Azure Active Directory authentication",
};

export function IntegrationsManagement() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadIntegrations();
    }
  }, [user]);

  const loadIntegrations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const result = await getAllIntegrations(user.id, user.role);
      
      if (result.success && result.integrations) {
        setIntegrations(result.integrations);
      } else {
        setError(result.error || "Failed to load integrations");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIntegration = async (integration: Integration) => {
    try {
      setUpdating(integration.name);
      
      const result = await updateIntegration(
        integration.name,
        !integration.enabled,
        integration.config_json
      );
      
      if (result.success) {
        setIntegrations(prev => 
          prev.map(int => 
            int.id === integration.id 
              ? { ...int, enabled: !int.enabled }
              : int
          )
        );
      } else {
        setError(result.error || "Failed to update integration");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-MT", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading integrations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={loadIntegrations} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Integrations Management</h2>
        <p className="text-muted-foreground">Configure external service integrations</p>
      </div>

      <div className="grid gap-4">
        {integrations.map((integration) => {
          const IconComponent = integrationIcons[integration.name] || Shield;
          
          return (
            <Card key={integration.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-6 w-6 text-primary" />
                      <CardTitle className="text-lg capitalize">
                        {integration.name === 'icsms' ? 'ICSMS' : 
                         integration.name === 'nando' ? 'NANDO' : 
                         integration.name === 'azure_ad' ? 'Azure AD' :
                         integration.name === 'sentiment_ai' ? 'Sentiment AI' :
                         integration.name.replace(/_/g, ' ')}
                      </CardTitle>
                      <Badge variant={integration.enabled ? "default" : "secondary"}>
                        {integration.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <CardDescription>
                      {integrationDescriptions[integration.name] || "External service integration"}
                    </CardDescription>
                  </div>
                  <Button
                    variant={integration.enabled ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleIntegration(integration)}
                    disabled={updating === integration.name}
                  >
                    {updating === integration.name ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : integration.enabled ? (
                      "Disable"
                    ) : (
                      "Enable"
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Last Updated:</span> {formatDate(integration.updated_at)}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {integration.enabled ? "Active" : "Inactive"}
                  </div>
                </div>

                {Object.keys(integration.config_json).length > 0 && (
                  <div className="mt-4">
                    <span className="text-sm font-medium">Configuration:</span>
                    <div className="mt-1 p-2 bg-muted rounded-md text-xs font-mono">
                      {JSON.stringify(integration.config_json, null, 2)}
                    </div>
                  </div>
                )}

                {!integration.enabled && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Integration Disabled</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      This integration is currently disabled and will not function.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {integrations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No integrations found.
        </div>
      )}
    </div>
  );
}
