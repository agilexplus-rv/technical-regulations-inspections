"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getUserInspections } from "@/lib/server-actions/inspections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Eye, MapPin, Calendar, User } from "lucide-react";
import { Inspection, InspectionStatus } from "@/types";
import { useAuth } from "@/components/providers-simple";

interface InspectionsListProps {
  showCreateButton?: boolean;
}

const statusColors: Record<InspectionStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<InspectionStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function InspectionsList({ showCreateButton = true }: InspectionsListProps) {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadInspections();
    }
  }, [user]);

  const loadInspections = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const result = await getUserInspections(user.id, user.role);
      
      if (result.success && result.inspections) {
        setInspections(result.inspections);
      } else {
        setError(result.error || "Failed to load inspections");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
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

  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Please log in to view inspections.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading inspections...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={loadInspections} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showCreateButton && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">My Inspections</h2>
          <Link href="/inspections/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Inspection
            </Button>
          </Link>
        </div>
      )}

      {inspections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              No inspections found. Create your first inspection to get started.
            </div>
            <Link href="/inspections/new">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Inspection
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {inspections.map((inspection) => (
            <Card key={inspection.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      <Link 
                        href={`/inspections/${inspection.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        Inspection #{inspection.id.slice(-8)}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {inspection.vatNumber ? `VAT: ${inspection.vatNumber}` : "No VAT number"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={statusColors[inspection.status as InspectionStatus]}>
                    {statusLabels[inspection.status as InspectionStatus]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">
                      {inspection.addressFinal || inspection.addressSuggested || "No address"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Created {formatDate(inspection.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      {inspection.assignedTo === inspection.createdBy ? "Self-assigned" : "Assigned"}
                    </span>
                  </div>
                </div>

                {inspection.locationLat && inspection.locationLng && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    📍 {inspection.locationLat.toFixed(4)}, {inspection.locationLng.toFixed(4)}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Link href={`/inspections/${inspection.id}`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                  
                  {inspection.status === "draft" && (
                    <Link href={`/inspections/${inspection.id}/edit`}>
                      <Button size="sm" className="flex items-center gap-2">
                        Continue Setup
                      </Button>
                    </Link>
                  )}
                  
                  {inspection.status === "in_progress" && (
                    <Link href={`/inspections/${inspection.id}/run`}>
                      <Button size="sm" className="flex items-center gap-2">
                        Continue Inspection
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

