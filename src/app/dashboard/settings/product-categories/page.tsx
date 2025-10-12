"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers-simple";
import { 
  getAllProductCategories, 
  createProductCategory, 
  updateProductCategory, 
  deleteProductCategory, 
  toggleCategoryStatus,
  assignUsersToCategory,
  getCategoryUsers,
  getAllUsers
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
  Package, 
  Edit, 
  Trash2, 
  Users, 
  Search, 
  Filter,
  Power,
  PowerOff,
  Save,
  X
} from "lucide-react";

interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  ban_status?: boolean;
}

interface CategoryUser {
  user_id: string;
  users: User;
}

export default function ProductCategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [assigningUsers, setAssigningUsers] = useState<ProductCategory | null>(null);
  const [categoryUsers, setCategoryUsers] = useState<CategoryUser[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    code: ""
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    code: "",
    isActive: true
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [categoryUserCounts, setCategoryUserCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const [categoriesResult, usersResult] = await Promise.all([
        getAllProductCategories(user.id, user.role),
        getAllUsers(user.id, user.role)
      ]);
      
      if (categoriesResult.success && categoriesResult.categories) {
        setCategories(categoriesResult.categories);
        
        // Load user counts for each category
        const counts: Record<string, number> = {};
        for (const category of categoriesResult.categories) {
          try {
            const userResult = await getCategoryUsers(category.id, user.id, user.role);
            if (userResult.success && userResult.users) {
              counts[category.id] = userResult.users.length;
            } else {
              counts[category.id] = 0;
            }
          } catch (err) {
            counts[category.id] = 0;
          }
        }
        setCategoryUserCounts(counts);
      } else {
        setError(categoriesResult.error || "Failed to load categories");
      }

      if (usersResult.success && usersResult.users) {
        setAllUsers(usersResult.users.filter(u => !u.ban_status));
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const clearCreateForm = () => {
    setCreateFormData({
      name: "",
      description: "",
      code: ""
    });
  };

  const clearEditForm = () => {
    setEditFormData({
      name: "",
      description: "",
      code: "",
      isActive: true
    });
  };

  const handleCreateCategory = async () => {
    if (!createFormData.name.trim()) {
      setError("Category name is required");
      return;
    }

    if (!user) {
      setError("You must be logged in to create categories");
      return;
    }

    try {
      setActionLoading("create");
      const formData = new FormData();
      formData.append("name", createFormData.name.trim());
      formData.append("description", createFormData.description.trim());
      formData.append("code", createFormData.code.trim());
      formData.append("userId", user.id);
      formData.append("userRole", user.role);

      const result = await createProductCategory(formData);
      
      if (result.success) {
        setSuccessMessage("Category created successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowCreateForm(false);
        clearCreateForm();
        loadData();
      } else {
        setError(result.error || "Failed to create category");
      }
    } catch (err) {
      setError("Failed to create category");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditCategory = (category: ProductCategory) => {
    setEditFormData({
      name: category.name,
      description: category.description || "",
      code: category.code || "",
      isActive: category.is_active
    });
    setEditingCategory(category);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editFormData.name.trim()) {
      setError("Category name is required");
      return;
    }

    if (!user) {
      setError("You must be logged in to update categories");
      return;
    }

    try {
      setActionLoading(editingCategory.id);
      const formData = new FormData();
      formData.append("name", editFormData.name.trim());
      formData.append("description", editFormData.description.trim());
      formData.append("code", editFormData.code.trim());
      formData.append("isActive", editFormData.isActive.toString());
      formData.append("userId", user.id);
      formData.append("userRole", user.role);

      const result = await updateProductCategory(editingCategory.id, formData);
      
      if (result.success) {
        setSuccessMessage("Category updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setEditingCategory(null);
        clearEditForm();
        loadData();
      } else {
        setError(result.error || "Failed to update category");
      }
    } catch (err) {
      setError("Failed to update category");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCategory = (category: ProductCategory) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete || !user) {
      return;
    }

    try {
      setActionLoading(categoryToDelete.id);
      const result = await deleteProductCategory(categoryToDelete.id, user.id, user.role);
      
      if (result.success) {
        setSuccessMessage("Category deleted successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowDeleteConfirm(false);
        setCategoryToDelete(null);
        loadData();
      } else {
        setError(result.error || "Failed to delete category");
      }
    } catch (err) {
      setError("Failed to delete category");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (category: ProductCategory) => {
    if (!user) {
      setError("You must be logged in to update category status");
      return;
    }

    try {
      setActionLoading(category.id);
      const result = await toggleCategoryStatus(category.id, !category.is_active, user.id, user.role);
      
      if (result.success) {
        setSuccessMessage(`Category ${!category.is_active ? 'activated' : 'deactivated'} successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
        loadData();
      } else {
        setError(result.error || "Failed to update category status");
      }
    } catch (err) {
      setError("Failed to update category status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignUsers = async (category: ProductCategory) => {
    if (!user) {
      setError("You must be logged in to assign users");
      return;
    }

    try {
      setAssigningUsers(category);
      setUserSearchTerm(""); // Clear search term
      
      // Load current users assigned to this category
      const result = await getCategoryUsers(category.id, user.id, user.role);
      
      if (result.success && result.users) {
        setCategoryUsers(result.users);
        setSelectedUserIds(result.users.map(user => user.id).filter(Boolean));
      } else {
        setError(result.error || "Failed to load category users");
      }
    } catch (err) {
      setError("Failed to load category users");
    }
  };

  const handleSaveUserAssignments = async () => {
    if (!assigningUsers) return;

    if (!user) {
      setError("You must be logged in to assign users");
      return;
    }

    try {
      setActionLoading(`assign-${assigningUsers.id}`);
      const result = await assignUsersToCategory(assigningUsers.id, selectedUserIds, user.id, user.role);
      
      if (result.success) {
        setSuccessMessage("User assignments updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setAssigningUsers(null);
        setSelectedUserIds([]);
        setCategoryUsers([]);
        setUserSearchTerm("");
        loadData(); // This will refresh the user counts
      } else {
        setError(result.error || "Failed to update user assignments");
      }
    } catch (err) {
      setError("Failed to update user assignments");
    } finally {
      setActionLoading(null);
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
            <span className="ml-2">Loading product categories...</span>
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
                Back to Categories
              </Button>
              <Button onClick={loadData} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (category.code && category.code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && category.is_active) ||
                         (statusFilter === "inactive" && !category.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                         (user.first_name && user.first_name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
                         (user.last_name && user.last_name.toLowerCase().includes(userSearchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Product Categories</h1>
        <p className="text-gray-600 mt-2">Manage product categories for inspection assignments</p>
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
                  placeholder="Search categories..."
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
              clearCreateForm();
              setShowCreateForm(true);
            }}>
              <Plus className="mr-2 h-4 w-4" /> New Category
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm || statusFilter !== "all" 
            ? "No categories match your criteria." 
            : "No product categories found. Create your first category to get started."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {category.name}
                    </CardTitle>
                    <CardDescription>
                      {category.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    {category.code && (
                      <Badge variant="outline" className="text-xs justify-center">{category.code}</Badge>
                    )}
                    {category.is_active ? (
                      <Badge variant="outline" className="text-green-600 text-xs justify-center">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500 text-xs justify-center">Inactive</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div><strong>Created:</strong> {new Date(category.created_at).toLocaleDateString()}</div>
                  <div><strong>Last Updated:</strong> {new Date(category.updated_at).toLocaleDateString()}</div>
                </div>
              </CardContent>
              <div className="mt-auto p-4 border-t">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleAssignUsers(category)}
                    disabled={actionLoading === `assign-${category.id}`}
                    title="Assign Users"
                  >
                    {actionLoading === `assign-${category.id}` ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Users className="mr-1 h-3 w-3" />
                    )}
                    Assign Users ({categoryUserCounts[category.id] || 0})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                    disabled={actionLoading === category.id}
                    title="Edit Category"
                  >
                    {actionLoading === category.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Edit className="h-3 w-3" />
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleToggleStatus(category)}
                    disabled={actionLoading === category.id}
                    title={category.is_active ? "Deactivate" : "Activate"}
                    className={category.is_active ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                  >
                    {actionLoading === category.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : category.is_active ? (
                      <PowerOff className="h-3 w-3" />
                    ) : (
                      <Power className="h-3 w-3" />
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteCategory(category)}
                    disabled={actionLoading === category.id}
                    title="Delete Category"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {actionLoading === category.id ? (
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
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Create New Product Category</CardTitle>
              <CardDescription>
                Create a new product category for inspection assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="create-name">Category Name *</Label>
                  <Input 
                    id="create-name" 
                    placeholder="e.g., Electronics, Toys, Cosmetics"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="create-code">Category Code</Label>
                  <Input 
                    id="create-code" 
                    placeholder="e.g., ELEC, TOYS, COSM"
                    value={createFormData.code}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="create-description">Description</Label>
                  <Textarea 
                    id="create-description" 
                    placeholder="Brief description of this product category"
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    clearCreateForm();
                  }} 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleCreateCategory}
                  disabled={actionLoading === "create" || !createFormData.name.trim()}
                >
                  {actionLoading === "create" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Category"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Edit Product Category: {editingCategory.name}</CardTitle>
              <CardDescription>
                Update category information and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Category Name *</Label>
                  <Input 
                    id="edit-name" 
                    placeholder="e.g., Electronics, Toys, Cosmetics"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-code">Category Code</Label>
                  <Input 
                    id="edit-code" 
                    placeholder="e.g., ELEC, TOYS, COSM"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea 
                    id="edit-description" 
                    placeholder="Brief description of this product category"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-active"
                    checked={editFormData.isActive}
                    onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="edit-active">Active Category</Label>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(null);
                    clearEditForm();
                  }} 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleSaveEdit}
                  disabled={actionLoading === editingCategory.id || !editFormData.name.trim()}
                >
                  {actionLoading === editingCategory.id ? (
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

      {/* User Assignment Modal */}
      {assigningUsers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <CardHeader>
              <CardTitle>Assign Users to: {assigningUsers.name}</CardTitle>
              <CardDescription>
                Select which users should be assigned to this product category
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                {/* Search Filter */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Selected Users Count */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {selectedUserIds.length} of {allUsers.length} users selected
                  </span>
                  {selectedUserIds.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUserIds([])}
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Users List */}
                <div className="grid gap-3">
                  {filteredUsers.map((user) => {
                    const isAssigned = selectedUserIds.includes(user.id);
                    return (
                      <div key={user.id} className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                        isAssigned ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}>
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={isAssigned}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds(prev => [...prev, user.id]);
                            } else {
                              setSelectedUserIds(prev => prev.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <Label htmlFor={`user-${user.id}`} className="font-medium">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : user.first_name || user.last_name || 'No Name'
                            }
                          </Label>
                          <div className="text-sm text-muted-foreground">
                            {user.email} • {user.role}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                          {isAssigned && (
                            <Badge variant="default" className="text-xs bg-blue-600">
                              Assigned
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {userSearchTerm ? "No users match your search." : "No users available for assignment."}
                  </div>
                )}
              </div>
            </CardContent>
            <div className="flex gap-2 p-6 pt-0">
              <Button 
                variant="outline"
                onClick={() => {
                  setAssigningUsers(null);
                  setSelectedUserIds([]);
                  setCategoryUsers([]);
                  setUserSearchTerm("");
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSaveUserAssignments}
                disabled={actionLoading === `assign-${assigningUsers.id}`}
              >
                {actionLoading === `assign-${assigningUsers.id}` ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Assignments
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Delete Category</CardTitle>
              <CardDescription>
                Are you sure you want to delete "{categoryToDelete.name}"? This action cannot be undone.
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
                  onClick={confirmDeleteCategory}
                  className="flex-1"
                  variant="destructive"
                  disabled={actionLoading === categoryToDelete.id}
                >
                  {actionLoading === categoryToDelete.id ? (
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
