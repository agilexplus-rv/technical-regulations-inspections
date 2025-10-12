"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInspection } from "@/lib/server-actions/inspections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Search } from "lucide-react";

interface NewInspectionFormProps {
  onSuccess?: () => void;
}

export function NewInspectionForm({ onSuccess }: NewInspectionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>("");

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });
        
        // Reverse geocoding to get address
        fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_API_KEY`)
          .then(response => response.json())
          .then(data => {
            if (data.results && data.results.length > 0) {
              setAddress(data.results[0].formatted);
            }
          })
          .catch(() => {
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          })
          .finally(() => setLoading(false));
      },
      (error) => {
        setError(`Error getting location: ${error.message}`);
        setLoading(false);
      }
    );
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await createInspection(formData);
      
      if (result.success && result.inspection) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/inspections/${result.inspection.id}`);
        }
      } else {
        setError(result.error || "Failed to create inspection");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Start New Inspection</CardTitle>
        <CardDescription>
          Create a new technical regulations inspection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="vatNumber">VAT Number</Label>
              <Input
                id="vatNumber"
                name="vatNumber"
                type="text"
                placeholder="MT12345678"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="investigationId">Investigation ID (Optional)</Label>
              <Input
                id="investigationId"
                name="investigationId"
                type="text"
                placeholder="INV-2024-001"
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  Get Current Location
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search Address
                </Button>
              </div>
              
              {location && (
                <div className="text-sm text-muted-foreground">
                  Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="addressFinal">Address</Label>
              <Input
                id="addressFinal"
                name="addressFinal"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter the inspection address"
                required
                className="mt-1"
              />
            </div>

            {/* Hidden fields for location data */}
            {location && (
              <>
                <input type="hidden" name="locationLat" value={location.lat} />
                <input type="hidden" name="locationLng" value={location.lng} />
                <input type="hidden" name="addressSuggested" value={address} />
                <input type="hidden" name="addressAccuracy" value="10" />
              </>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Inspection...
                </>
              ) : (
                "Create Inspection"
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
      </CardContent>
    </Card>
  );
}
