"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers-simple";
import { useRouter } from "next/navigation";
import { 
  getAllReportTemplates, 
  createReportTemplate, 
  updateReportTemplate, 
  deleteReportTemplate,
  setDefaultReportTemplate,
  toggleReportTemplateActive,
  getReportTemplate
} from "@/lib/server-actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FileText, Edit, Trash2, Eye, Star, StarOff, Power, PowerOff, ArrowLeft, Filter, Search } from "lucide-react";

interface ReportTemplate {
  id: string;
  name: string;
  description?: string | null;
  format: string;
  template_content?: string;
  mapping_json: any;
  version: string;
  is_default: boolean;
  is_active?: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

interface TemplateFormData {
  name: string;
  description: string;
  content: string;
  isDefault: boolean;
  isActive: boolean;
}

export default function ReportTemplatesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<TemplateFormData>({
    name: "",
    description: "",
    content: "",
    isDefault: false,
    isActive: true
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user]);

  const loadTemplates = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('TemplatesPage: Loading templates...');
      const result = await getAllReportTemplates();
      console.log('TemplatesPage: Result from getAllReportTemplates:', result);
      
      if (result.success && result.templates) {
        console.log('TemplatesPage: Raw templates data:', result.templates);
        const templatesWithDefaults = result.templates.map(t => ({
          ...t,
          is_default: t.is_default === true
        }));
        console.log('TemplatesPage: Processed templates:', templatesWithDefaults);
        setTemplates(templatesWithDefaults);
        console.log('TemplatesPage: Templates loaded:', templatesWithDefaults.length);
      } else {
        console.log('TemplatesPage: Error loading templates:', result.error);
        setError(result.error || "Failed to load templates");
      }
    } catch (err) {
      console.error('TemplatesPage: Exception loading templates:', err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = "Template name is required";
    }
    
    if (!formData.content.trim()) {
      errors.content = "Template content is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      content: "",
      isDefault: false,
      isActive: true
    });
    setFormErrors({});
  };

  const openCreateForm = () => {
    resetForm();
    setShowCreateForm(true);
  };

  const openEditForm = (template: ReportTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || "",
      content: template.template_content || "",
      isDefault: template.is_default,
      isActive: template.is_active !== false
    });
    setFormErrors({});
    setSelectedTemplate(template);
    setShowEditForm(true);
  };

  const openViewModal = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setShowViewModal(true);
  };

  const openDeleteConfirm = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setShowDeleteConfirm(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("content", formData.content);
      formDataToSend.append("isDefault", formData.isDefault.toString());
      formDataToSend.append("isActive", formData.isActive.toString());
      
      let result;
      if (showCreateForm) {
        result = await createReportTemplate(formDataToSend);
      } else if (showEditForm && selectedTemplate) {
        result = await updateReportTemplate(selectedTemplate.id, formDataToSend);
      }
      
      if (result?.success) {
        setSuccess(showCreateForm ? "Template created successfully" : "Template updated successfully");
        setTimeout(() => setSuccess(null), 3000);
        setShowCreateForm(false);
        setShowEditForm(false);
        resetForm();
        loadTemplates();
      } else {
        setError(result?.error || "Failed to save template");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const result = await deleteReportTemplate(selectedTemplate.id);
      
      if (result.success) {
        setSuccess("Template deleted successfully");
        setTimeout(() => setSuccess(null), 3000);
        setShowDeleteConfirm(false);
        setSelectedTemplate(null);
        loadTemplates();
      } else {
        setError(result.error || "Failed to delete template");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (template: ReportTemplate) => {
    setSaving(true);
    setError(null);
    
    try {
      console.log('TemplatesPage: Setting default template:', template.id, template.name);
      const result = await setDefaultReportTemplate(template.id);
      console.log('TemplatesPage: SetDefault result:', result);
      
      if (result.success) {
        setSuccess("Default template updated successfully");
        setTimeout(() => setSuccess(null), 3000);
        console.log('TemplatesPage: Success, reloading templates...');
        await loadTemplates();
        console.log('TemplatesPage: Templates reloaded');
      } else {
        setError(result.error || "Failed to set default template");
      }
    } catch (err) {
      console.error('TemplatesPage: Error in handleSetDefault:', err);
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (template: ReportTemplate) => {
    setSaving(true);
    setError(null);
    
    try {
      const result = await toggleReportTemplateActive(template.id, !template.is_active);
      
      if (result.success) {
        setSuccess(`Template ${!template.is_active ? 'activated' : 'deactivated'} successfully`);
        setTimeout(() => setSuccess(null), 3000);
        loadTemplates();
      } else {
        setError(result.error || "Failed to toggle template status");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
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
            <span className="ml-2">Loading report templates...</span>
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
                Back to Templates
              </Button>
              <Button onClick={loadTemplates} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && (template.is_active === undefined || template.is_active !== false)) ||
      (filterStatus === 'inactive' && template.is_active === false);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Report Templates</h1>
        <p className="text-gray-600 mt-2">Manage HTML report templates for inspection summaries</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-800">{success}</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setError(null)}
            className="mt-2"
          >
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
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={(value: "all" | "active" | "inactive") => setFilterStatus(value)}>
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
            <Button onClick={openCreateForm} disabled={saving}>
              <Plus className="mr-2 h-4 w-4" /> New Template
            </Button>
          </div>
        </CardContent>
      </Card>

        {/* Templates List */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No templates match your criteria." : "No report templates found."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {template.name}
                      </CardTitle>
                      <CardDescription>
                        {template.description || "No description available"}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-1">
                      {template.is_default && (
                        <Badge variant="outline" className="text-xs justify-center">Default</Badge>
                      )}
                      {template.is_active !== false ? (
                        <Badge variant="outline" className="text-green-600 text-xs justify-center">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500 text-xs justify-center">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div><strong>Version:</strong> {template.version}</div>
                  <div><strong>Created:</strong> {new Date(template.created_at).toLocaleDateString()}</div>
                  <div><strong>Updated:</strong> {new Date(template.updated_at).toLocaleDateString()}</div>
                </div>
                </CardContent>
                <div className="mt-auto p-4 border-t">
                <div className="flex gap-2 mb-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openViewModal(template)}
                  >
                      <Eye className="mr-1 h-3 w-3" /> View
                    </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditForm(template)}
                  >
                      <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openDeleteConfirm(template)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleToggleActive(template)}
                    disabled={saving}
                  >
                    {template.is_active !== false ? (
                      <>
                        <PowerOff className="mr-1 h-3 w-3" /> Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="mr-1 h-3 w-3" /> Activate
                      </>
                    )}
                  </Button>
                  {!template.is_default && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSetDefault(template)}
                      disabled={saving}
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  )}
                  {template.is_default && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled
                    >
                      <StarOff className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      {/* Create/Edit Form Modal */}
      {(showCreateForm || showEditForm) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
              <CardTitle>
                {showCreateForm ? "Create New Report Template" : "Edit Report Template"}
              </CardTitle>
                <CardDescription>
                {showCreateForm 
                  ? "Create a new HTML template for inspection reports" 
                  : "Update the template details and content"
                }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Standard Inspection Report" 
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
                  )}
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description of this template" 
                  />
                  </div>
                  <div>
                  <Label htmlFor="content">HTML Template *</Label>
                    <Textarea 
                      id="content" 
                    rows={12}
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                      placeholder="Enter your HTML template with placeholders like {{inspection_id}}, {{operator_name}}, etc."
                  />
                  {formErrors.content && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.content}</p>
                  )}
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="isDefault"
                      checked={formData.isDefault}
                      onCheckedChange={(checked) => setFormData({...formData, isDefault: checked})}
                    />
                    <Label htmlFor="isDefault">Default</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                <Button 
                  onClick={() => {
                    setShowCreateForm(false);
                    setShowEditForm(false);
                    resetForm();
                  }} 
                  className="flex-1"
                  variant="outline"
                >
                    Cancel
                  </Button>
                <Button 
                  onClick={handleSave}
                  className="flex-1"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {showCreateForm ? "Creating..." : "Updating..."}
                    </>
                  ) : (
                    showCreateForm ? "Create Template" : "Update Template"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedTemplate.name}
              </CardTitle>
              <CardDescription>{selectedTemplate.description || "No description"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Version:</strong> {selectedTemplate.version}</div>
                  <div><strong>HTML Template</strong></div>
                  <div><strong>Status:</strong> 
                    <Badge variant={selectedTemplate.is_active !== false ? "default" : "secondary"} className="ml-2">
                      {selectedTemplate.is_active !== false ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div><strong>Default:</strong> 
                    <Badge variant={selectedTemplate.is_default ? "default" : "outline"} className="ml-2">
                      {selectedTemplate.is_default ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div><strong>Created:</strong> {new Date(selectedTemplate.created_at).toLocaleString()}</div>
                  <div><strong>Updated:</strong> {new Date(selectedTemplate.updated_at).toLocaleString()}</div>
                </div>
                <div>
                  <Label>Template Content</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-md border max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {selectedTemplate.template_content || "No template content available"}
                    </pre>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowViewModal(false)} variant="outline">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Delete Template</CardTitle>
              <CardDescription>
                Are you sure you want to delete "{selectedTemplate.name}"? This action cannot be undone.
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
                  onClick={handleDelete}
                  className="flex-1"
                  variant="destructive"
                  disabled={saving}
                >
                  {saving ? (
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