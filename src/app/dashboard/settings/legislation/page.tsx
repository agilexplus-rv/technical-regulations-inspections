"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers-simple";
import { 
  getAllLegislation, 
  createLegislation, 
  updateLegislation, 
  deleteLegislation,
  toggleLegislationStatus
} from "@/lib/server-actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2, 
  Plus, 
  Scale, 
  Edit, 
  Trash2, 
  Calendar, 
  Search,
  Filter,
  Power,
  PowerOff,
  Save,
  X,
  ArrowLeft,
  Eye
} from "lucide-react";

interface Legislation {
  id: string;
  title: string;
  description: string | null;
  act_name: string;
  content: string | null;
  effective_date: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface LegislationFormData {
  title: string;
  description: string;
  act_name: string;
  content: string;
  effective_date: string;
  isActive: boolean;
}

export default function LegislationPage() {
  const { user } = useAuth();
  const [legislations, setLegislations] = useState<Legislation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedLegislation, setSelectedLegislation] = useState<Legislation | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<LegislationFormData>({
    title: "",
    description: "",
    act_name: "",
    content: "",
    effective_date: "",
    isActive: true
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (user) {
      loadLegislation();
    }
  }, [user]);

  const loadLegislation = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await getAllLegislation(user.id, user.role);
      
      if (result.success && result.legislation) {
        setLegislations(result.legislation);
      } else {
        setError(result.error || "Failed to load legislation");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      title: "",
      description: "",
      act_name: "",
      content: "",
      effective_date: "",
      isActive: true
    });
    setFormErrors({});
  };

  const handleCreateLegislation = async () => {
    if (!formData.title.trim()) {
      setFormErrors({ title: "Legislation title is required" });
      return;
    }

    if (!user) {
      setError("You must be logged in to create legislation");
      return;
    }

    try {
      setActionLoading("create");
      const formDataObj = new FormData();
      formDataObj.append("title", formData.title.trim());
      formDataObj.append("description", formData.description.trim());
      formDataObj.append("act_name", formData.act_name.trim());
      formDataObj.append("content", formData.content.trim());
      formDataObj.append("effective_date", formData.effective_date);

      const result = await createLegislation(formDataObj, user.id, user.role);
      
      if (result.success) {
        setSuccessMessage("Legislation created successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowCreateForm(false);
        clearForm();
        loadLegislation();
      } else {
        setError(result.error || "Failed to create legislation");
      }
    } catch (err) {
      setError("Failed to create legislation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditLegislation = (legislation: Legislation) => {
    setFormData({
      title: legislation.title,
      description: legislation.description || "",
      act_name: legislation.act_name,
      content: legislation.content || "",
      effective_date: legislation.effective_date || "",
      isActive: legislation.is_active
    });
    setSelectedLegislation(legislation);
    setShowEditForm(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedLegislation || !formData.title.trim()) {
      setFormErrors({ title: "Legislation title is required" });
      return;
    }

    if (!user) {
      setError("You must be logged in to update legislation");
      return;
    }

    try {
      setActionLoading(selectedLegislation.id);
      const formDataObj = new FormData();
      formDataObj.append("title", formData.title.trim());
      formDataObj.append("description", formData.description.trim());
      formDataObj.append("act_name", formData.act_name.trim());
      formDataObj.append("content", formData.content.trim());
      formDataObj.append("effective_date", formData.effective_date);
      formDataObj.append("isActive", formData.isActive.toString());

      const result = await updateLegislation(selectedLegislation.id, formDataObj, user.id, user.role);
      
      if (result.success) {
        setSuccessMessage("Legislation updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowEditForm(false);
        setSelectedLegislation(null);
        clearForm();
        loadLegislation();
      } else {
        setError(result.error || "Failed to update legislation");
      }
    } catch (err) {
      setError("Failed to update legislation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteLegislation = (legislation: Legislation) => {
    setSelectedLegislation(legislation);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteLegislation = async () => {
    if (!selectedLegislation || !user) {
      return;
    }

    try {
      setActionLoading(selectedLegislation.id);
      const result = await deleteLegislation(selectedLegislation.id, user.id, user.role);
      
      if (result.success) {
        setSuccessMessage("Legislation deleted successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowDeleteConfirm(false);
        setSelectedLegislation(null);
        loadLegislation();
      } else {
        setError(result.error || "Failed to delete legislation");
      }
    } catch (err) {
      setError("Failed to delete legislation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (legislation: Legislation) => {
    if (!user) {
      setError("You must be logged in to update legislation status");
      return;
    }

    try {
      setActionLoading(legislation.id);
      const result = await toggleLegislationStatus(legislation.id, !legislation.is_active, user.id, user.role);
      
      if (result.success) {
        setSuccessMessage(`Legislation ${!legislation.is_active ? 'activated' : 'deactivated'} successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
        loadLegislation();
      } else {
        setError(result.error || "Failed to update legislation status");
      }
    } catch (err) {
      setError("Failed to update legislation status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewLegislation = (legislation: Legislation) => {
    setSelectedLegislation(legislation);
    setShowViewModal(true);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="text-muted-foreground">Admin access required.</div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading legislation...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">{error}</div>
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline"
                onClick={() => setError(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Legislation
              </Button>
              <Button onClick={loadLegislation} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredLegislations = legislations.filter(legislation => {
    const matchesSearch = legislation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    legislation.act_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (legislation.description && legislation.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && legislation.is_active) ||
                         (statusFilter === "inactive" && !legislation.is_active);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Legislation</h1>
        <p className="text-gray-600 mt-2">Manage legal references and regulations for inspections</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={() => setError(null)}
          >
            <X className="h-3 w-3 mr-1" />
            Dismiss
          </Button>
        </div>
      )}

      {/* Search, Filter and Create */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search legislation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
            />
          </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => {
              clearForm();
              setShowCreateForm(true);
            }}>
            <Plus className="mr-2 h-4 w-4" /> New Legislation
          </Button>
        </div>
        </CardContent>
      </Card>

        {/* Legislation List */}
        {filteredLegislations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm || statusFilter !== "all" 
            ? "No legislation matches your criteria." 
            : "No legislation found. Create your first legislation to get started."}
        </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLegislations.map((legislation) => (
              <Card key={legislation.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                  <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Scale className="h-5 w-5" />
                        {legislation.title}
                      </CardTitle>
                      <CardDescription>
                        {legislation.act_name}
                      </CardDescription>
                    </div>
                  <div className="flex flex-col gap-1">
                      {legislation.is_active ? (
                      <Badge variant="outline" className="text-green-600 text-xs justify-center">Active</Badge>
                      ) : (
                      <Badge variant="outline" className="text-gray-500 text-xs justify-center">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1">
                <div className="space-y-1 text-sm text-muted-foreground">
                    {legislation.description && (
                      <div className="line-clamp-2">{legislation.description}</div>
                    )}
                    {legislation.effective_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Effective: {new Date(legislation.effective_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div><strong>Created:</strong> {new Date(legislation.created_at).toLocaleDateString()}</div>
                  <div><strong>Last Updated:</strong> {new Date(legislation.updated_at).toLocaleDateString()}</div>
                  </div>
                </CardContent>
                <div className="mt-auto p-4 border-t">
                  <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewLegislation(legislation)}
                    title="View Details"
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    View
                    </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditLegislation(legislation)}
                    disabled={actionLoading === legislation.id}
                    title="Edit Legislation"
                  >
                    {actionLoading === legislation.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Edit className="h-3 w-3" />
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleToggleStatus(legislation)}
                    disabled={actionLoading === legislation.id}
                    title={legislation.is_active ? "Deactivate" : "Activate"}
                    className={legislation.is_active ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                  >
                    {actionLoading === legislation.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : legislation.is_active ? (
                      <PowerOff className="h-3 w-3" />
                    ) : (
                      <Power className="h-3 w-3" />
                    )}
                    </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteLegislation(legislation)}
                    disabled={actionLoading === legislation.id}
                    title="Delete Legislation"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {actionLoading === legislation.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
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
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Create New Legislation</CardTitle>
                <CardDescription>
                  Add new legal references and regulations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                  <Label htmlFor="create-title">Legislation Title *</Label>
                  <Input 
                    id="create-title" 
                    placeholder="e.g., General Product Safety Regulation"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className={formErrors.title ? "border-red-500" : ""}
                  />
                  {formErrors.title && <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>}
                </div>
                <div>
                  <Label htmlFor="create-act-name">Act Name *</Label>
                  <Input 
                    id="create-act-name" 
                    placeholder="e.g., GPSR"
                    value={formData.act_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, act_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="create-effective-date">Effective Date</Label>
                  <Input 
                    id="create-effective-date" 
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="create-description">Description</Label>
                  <Textarea 
                    id="create-description" 
                    placeholder="Brief description of this legislation"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="create-content">Content</Label>
                  <Textarea 
                    id="create-content" 
                    rows={8}
                    placeholder="Full text or key provisions of this legislation"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    clearForm();
                  }} 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleCreateLegislation}
                  disabled={actionLoading === "create" || !formData.title.trim()}
                >
                  {actionLoading === "create" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Legislation"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && selectedLegislation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Legislation: {selectedLegislation.title}</CardTitle>
              <CardDescription>
                Update legislation information and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Legislation Title *</Label>
                  <Input 
                    id="edit-title" 
                    placeholder="e.g., General Product Safety Regulation"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className={formErrors.title ? "border-red-500" : ""}
                  />
                  {formErrors.title && <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-act-name">Act Name *</Label>
                  <Input 
                    id="edit-act-name" 
                    placeholder="e.g., GPSR"
                    value={formData.act_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, act_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-effective-date">Effective Date</Label>
                  <Input 
                    id="edit-effective-date" 
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea 
                    id="edit-description" 
                    placeholder="Brief description of this legislation"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-content">Content</Label>
                  <Textarea 
                    id="edit-content" 
                    rows={8}
                    placeholder="Full text or key provisions of this legislation"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="edit-active">Active Legislation</Label>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowEditForm(false);
                    setSelectedLegislation(null);
                    clearForm();
                  }} 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleSaveEdit}
                  disabled={actionLoading === selectedLegislation.id || !formData.title.trim()}
                >
                  {actionLoading === selectedLegislation.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
                  </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedLegislation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                {selectedLegislation.title}
              </CardTitle>
              <CardDescription>
                {selectedLegislation.act_name}
                {selectedLegislation.effective_date && ` • Effective: ${new Date(selectedLegislation.effective_date).toLocaleDateString()}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                {selectedLegislation.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-muted-foreground">{selectedLegislation.description}</p>
                  </div>
                )}
                {selectedLegislation.content && (
                    <div>
                    <h4 className="font-semibold mb-2">Content</h4>
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-gray-50 p-4 rounded-md">
                        {selectedLegislation.content}
                      </pre>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <strong>Status:</strong> {selectedLegislation.is_active ? "Active" : "Inactive"}
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(selectedLegislation.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Last Updated:</strong> {new Date(selectedLegislation.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="flex gap-2 p-6 pt-0">
              <Button 
                variant="outline"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedLegislation(null);
                }} 
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedLegislation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Delete Legislation</CardTitle>
              <CardDescription>
                Are you sure you want to delete "{selectedLegislation.title}"? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowDeleteConfirm(false)} 
                  className="flex-1"
                  variant="outline"
                >
                    Cancel
                  </Button>
                <Button 
                  onClick={confirmDeleteLegislation}
                  className="flex-1"
                  variant="destructive"
                  disabled={actionLoading === selectedLegislation.id}
                >
                  {actionLoading === selectedLegislation.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  );
}