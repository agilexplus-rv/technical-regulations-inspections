"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers-simple";
import { getAllStreets } from "@/lib/server-actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, MapPin, Edit, Trash2, Download, Upload } from "lucide-react";

interface Street {
  id: string;
  name: string;
  locality: string;
  region: string;
  postcode: string | null;
  is_manual: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export default function GeoSettingsPage() {
  const { user } = useAuth();
  const [streets, setStreets] = useState<Street[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocality, setSelectedLocality] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");

  useEffect(() => {
    if (user) {
      loadStreets();
    }
  }, [user]);

  const loadStreets = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const result = await getAllStreets(user.id, user.role);
      
      if (result.success && result.streets) {
        setStreets(result.streets);
      } else {
        setError(result.error || "Failed to load streets");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-gray-600">Admin access required.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading geo settings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={() => setLoading(true)}>Retry</Button>
        </div>
      </div>
    );
  }

  const filteredStreets = streets.filter(street => {
    const matchesSearch = street.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         street.locality.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         street.region.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocality = selectedLocality === "all" || street.locality === selectedLocality;
    const matchesRegion = selectedRegion === "all" || street.region === selectedRegion;
    
    return matchesSearch && matchesLocality && matchesRegion;
  });

  const localities = [...new Set(streets.map(s => s.locality))].sort();
  const regions = [...new Set(streets.map(s => s.region))].sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Geo Settings</h1>
        <p className="text-gray-600 mt-2">Manage street names and geographic data for Malta and Gozo</p>
      </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search streets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedLocality} onValueChange={setSelectedLocality}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Localities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Localities</SelectItem>
                {localities.map(locality => (
                  <SelectItem key={locality} value={locality}>{locality}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Street
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Fetch from OpenStreetMap
          </Button>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </Button>
        </div>

        {/* Streets List */}
        {filteredStreets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || selectedLocality !== "all" || selectedRegion !== "all" 
              ? "No streets match your filters." 
              : "No streets found. Fetch data from OpenStreetMap to get started."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStreets.map((street) => (
              <Card key={street.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {street.name}
                      </CardTitle>
                      <CardDescription>
                        {street.locality}, {street.region}
                        {street.postcode && ` - ${street.postcode}`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {street.is_manual && (
                        <Badge variant="outline">Manual</Badge>
                      )}
                      {street.is_active ? (
                        <Badge variant="outline" className="text-green-600">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div><strong>Created:</strong> {new Date(street.created_at).toLocaleDateString()}</div>
                    <div><strong>Last Updated:</strong> {new Date(street.updated_at).toLocaleDateString()}</div>
                  </div>
                </CardContent>
                <div className="mt-auto p-4 border-t">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>Add New Street</CardTitle>
                <CardDescription>
                  Manually add a street to the geographic database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Street Name</Label>
                    <Input id="name" placeholder="e.g., Republic Street" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="locality">Locality</Label>
                      <Input id="locality" placeholder="e.g., Valletta" />
                    </div>
                    <div>
                      <Label htmlFor="region">Region</Label>
                      <Input id="region" placeholder="e.g., Malta" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="postcode">Postcode (Optional)</Label>
                    <Input id="postcode" placeholder="e.g., VLT 1117" />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button onClick={() => setShowCreateForm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button className="flex-1">
                    Add Street
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  );
}
