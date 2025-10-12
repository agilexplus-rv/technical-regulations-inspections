"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllUsers, getAllProductCategories, updateUser, resetUserPassword, deactivateUser, reactivateUser, deleteUser, createUser } from "@/lib/server-actions/settings";
import { toggleMFA } from "@/lib/server-actions/auth";
import { useAuth } from "@/components/providers-simple";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Key, 
  UserX, 
  UserCheck,
  Search,
  Filter,
  ArrowLeft,
  Shield
} from "lucide-react";

interface User {
  id: string;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  mfa_enabled: boolean;
  ban_status?: boolean;
  created_at: string;
  updated_at: string;
  user_product_categories?: Array<{
    product_category_id: string;
    product_categories: {
      id: string;
      name: string;
      code: string;
    };
  }>;
}

interface ProductCategory {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createFormData, setCreateFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "inspector",
    productCategories: [] as string[],
    mfaEnabled: false
  });

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      const [usersResult, categoriesResult] = await Promise.all([
        getAllUsers(currentUser.id, currentUser.role),
        getAllProductCategories()
      ]);
      
      if (usersResult.success && usersResult.users) {
        setUsers(usersResult.users);
      } else {
        setError(usersResult.error || "Failed to load users");
      }

      if (categoriesResult.success && categoriesResult.categories) {
        setCategories(categoriesResult.categories.filter(c => c.is_active));
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Ensure at least one character from each category
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Fill the rest with random characters from all categories
    const allChars = uppercase + lowercase + numbers + specialChars;
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const clearCreateForm = () => {
    setCreateFormData({
      email: "",
      password: generateRandomPassword(),
      firstName: "",
      lastName: "",
      role: "inspector",
      productCategories: [],
      mfaEnabled: false
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-MT", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800";
      case "manager": return "bg-purple-100 text-purple-800";
      case "officer": return "bg-blue-100 text-blue-800";
      case "inspector": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleCreateUser = async () => {
    if (!currentUser) return;
    
    // Validate required fields
    if (!createFormData.email || !createFormData.firstName || !createFormData.lastName) {
      setError("Email, first name, and last name are required fields");
      return;
    }
    
    try {
      setActionLoading("create");
      const formData = new FormData();
      formData.append("email", createFormData.email);
      formData.append("password", createFormData.password);
      formData.append("firstName", createFormData.firstName);
      formData.append("lastName", createFormData.lastName);
      formData.append("role", createFormData.role);
      formData.append("productCategories", JSON.stringify(createFormData.productCategories));
      formData.append("mfaEnabled", createFormData.mfaEnabled.toString());

      const result = await createUser(formData);
      
      if (result.success) {
        setSuccessMessage("User created successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowCreateForm(false);
        setCreateFormData({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          role: "inspector",
          productCategories: [],
          mfaEnabled: false
        });
        loadData(); // Reload data to show new user
      } else {
        setError(result.error || "Failed to create user");
      }
    } catch (err) {
      setError("Failed to create user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveUserChanges = async () => {
    if (!editingUser || !currentUser) return;
    
    // Get form data from the modal
    const form = document.getElementById('edit-user-form') as HTMLFormElement;
    if (!form) return;
    
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    
    // Validate required fields
    if (!email || !firstName || !lastName) {
      setError("Email, first name, and last name are required fields");
      return;
    }
    
    try {
      setActionLoading(editingUser.id);
      
      const result = await updateUser(editingUser.id, formData);
      
      if (result.success) {
        setSuccessMessage("User updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setEditingUser(null);
        loadData(); // Reload data to reflect changes
      } else {
        setError(result.error || "Failed to update user");
      }
    } catch (err) {
      setError("Failed to update user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!currentUser) return;
    
    setActionLoading(userId);
    try {
      const result = await resetUserPassword(userId);
      if (result.success) {
        setSuccessMessage("Password reset email sent successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || "Failed to reset password");
      }
    } catch (err) {
      setError("Failed to reset password");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!currentUser) return;
    
    setActionLoading(userId);
    try {
      const result = await deactivateUser(userId);
      if (result.success) {
        setSuccessMessage("User deactivated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        loadData(); // Reload data to reflect changes
      } else {
        setError(result.error || "Failed to deactivate user");
      }
    } catch (err) {
      setError("Failed to deactivate user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    if (!currentUser) return;
    
    setActionLoading(userId);
    try {
      const result = await reactivateUser(userId);
      if (result.success) {
        setSuccessMessage("User reactivated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        loadData(); // Reload data to reflect changes
      } else {
        setError(result.error || "Failed to reactivate user");
      }
    } catch (err) {
      setError("Failed to reactivate user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !currentUser) {
      return;
    }
    
    setActionLoading(userToDelete.id);
    try {
      const result = await deleteUser(userToDelete.id);
      if (result.success) {
        setSuccessMessage("User deleted successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        loadData(); // Reload data to reflect changes
      } else {
        setError(result.error || "Failed to delete user");
      }
    } catch (err) {
      setError("Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleMFA = async (userId: string, currentMfaStatus: boolean) => {
    if (!currentUser) return;
    
    setActionLoading(userId);
    try {
      const result = await toggleMFA(!currentMfaStatus, userId);
      if (result.success) {
        setSuccessMessage(`MFA ${!currentMfaStatus ? 'enabled' : 'disabled'} successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
        loadData(); // Reload data to reflect changes
      } else {
        setError(result.error || "Failed to update MFA setting");
      }
    } catch (err) {
      setError("Failed to update MFA setting");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <div className="flex gap-2 justify-center">
          <Button 
            variant="outline"
            onClick={() => setError(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
          <Button onClick={loadData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-muted-foreground">Manage system users and their permissions</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          {successMessage}
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
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="officer">Officer</SelectItem>
                  <SelectItem value="inspector">Inspector</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => {
              clearCreateForm();
              setShowCreateForm(true);
            }}>
              <Plus className="mr-2 h-4 w-4" /> Create User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user.first_name || user.last_name || 'No Name'
                      }
                    </CardTitle>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                    {user.ban_status === true && (
                      <Badge variant="destructive">Deactivated</Badge>
                    )}
                    {user.mfa_enabled && (
                      <Badge variant="outline">MFA Enabled</Badge>
                    )}
                  </div>
                  <CardDescription>{user.email}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    disabled={actionLoading === user.id || user.ban_status === true}
                    title={user.ban_status === true ? "Cannot edit deactivated user" : "Edit User"}
                    className={user.ban_status === true ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleResetPassword(user.id)}
                    disabled={actionLoading === user.id || user.ban_status === true}
                    title={user.ban_status === true ? "Cannot reset password for deactivated user" : "Reset Password"}
                    className={user.ban_status === true ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleToggleMFA(user.id, user.mfa_enabled)}
                    disabled={actionLoading === user.id || user.ban_status === true}
                    title={user.ban_status === true ? "Cannot toggle MFA for deactivated user" : 
                           user.mfa_enabled ? "Disable MFA" : "Enable MFA"}
                    className={`${user.ban_status === true ? "opacity-50 cursor-not-allowed" : ""} ${
                      user.mfa_enabled ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    }`}
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                  </Button>
                  {user.ban_status === true ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReactivateUser(user.id)}
                      disabled={actionLoading === user.id}
                      title="Reactivate User"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeactivateUser(user.id)}
                      disabled={actionLoading === user.id || user.id === currentUser?.id}
                      title={user.id === currentUser?.id ? "Cannot deactivate yourself" : "Deactivate User"}
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteUser(user)}
                    disabled={actionLoading === user.id || user.id === currentUser?.id}
                    title={user.id === currentUser?.id ? "Cannot delete yourself" : "Delete User"}
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Created:</span> {formatDate(user.created_at)}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span> {formatDate(user.updated_at)}
                </div>
              </div>

              {user.user_product_categories && user.user_product_categories.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm font-medium">Product Categories:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.user_product_categories.map((assignment) => (
                      <Badge key={assignment.product_category_id} variant="secondary" className="text-xs">
                        {assignment.product_categories.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm || selectedRole !== "all" 
            ? "No users match your criteria." 
            : "No users found. Create your first user to get started."}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
              <CardDescription>
                Add a new user to the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="create-email">Email *</Label>
                <Input 
                  id="create-email"
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-firstName">First Name *</Label>
                  <Input 
                    id="create-firstName"
                    value={createFormData.firstName}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="First name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="create-lastName">Last Name *</Label>
                  <Input 
                    id="create-lastName"
                    value={createFormData.lastName}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-role">Role *</Label>
                  <Select 
                    value={createFormData.role} 
                    onValueChange={(value) => setCreateFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="officer">Officer</SelectItem>
                      <SelectItem value="inspector">Inspector</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="create-mfa"
                    checked={createFormData.mfaEnabled}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, mfaEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="create-mfa" className="text-sm">
                    Enable MFA (Multi-Factor Authentication)
                  </Label>
                </div>
              </div>

              <div>
                <Label>Product Categories</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`create-category-${category.id}`}
                        checked={createFormData.productCategories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCreateFormData(prev => ({
                              ...prev,
                              productCategories: [...prev.productCategories, category.id]
                            }));
                          } else {
                            setCreateFormData(prev => ({
                              ...prev,
                              productCategories: prev.productCategories.filter(id => id !== category.id)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`create-category-${category.id}`} className="text-sm">
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <div className="flex gap-2 p-6 pt-0">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleCreateUser}
                disabled={actionLoading === "create" || !createFormData.email || !createFormData.firstName || !createFormData.lastName}
              >
                {actionLoading === "create" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Edit User: {editingUser.email}</CardTitle>
              <CardDescription>
                Update user information and permissions
              </CardDescription>
            </CardHeader>
            <form id="edit-user-form">
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input 
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingUser.email} 
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-firstName">First Name *</Label>
                    <Input 
                      id="edit-firstName"
                      name="firstName"
                      defaultValue={editingUser.first_name || ""} 
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-lastName">Last Name *</Label>
                    <Input 
                      id="edit-lastName"
                      name="lastName"
                      defaultValue={editingUser.last_name || ""} 
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-role">Role</Label>
                    <Select defaultValue={editingUser.role} name="role">
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="officer">Officer</SelectItem>
                        <SelectItem value="inspector">Inspector</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-mfa"
                      name="mfaEnabled"
                      defaultChecked={editingUser.mfa_enabled}
                      className="rounded"
                    />
                    <Label htmlFor="edit-mfa" className="text-sm">
                      Enable MFA (Multi-Factor Authentication)
                    </Label>
                  </div>
                </div>

                <div>
                  <Label>Product Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-category-${category.id}`}
                          name="productCategories"
                          value={category.id}
                          defaultChecked={editingUser.user_product_categories?.some(
                            upc => upc.product_category_id === category.id
                          )}
                        />
                        <Label htmlFor={`edit-category-${category.id}`} className="text-sm">
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <div className="flex gap-2 p-6 pt-0">
                <Button 
                  type="button"
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  className="flex-1"
                  onClick={handleSaveUserChanges}
                  disabled={actionLoading === editingUser.id}
                >
                  {actionLoading === editingUser.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Delete User</CardTitle>
              <CardDescription>
                Are you sure you want to delete "{userToDelete.email}"? This action cannot be undone.
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
                  onClick={confirmDeleteUser}
                  className="flex-1"
                  variant="destructive"
                  disabled={actionLoading === userToDelete.id}
                >
                  {actionLoading === userToDelete.id ? (
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
