"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllChecklists, getPublishedChecklists, deleteChecklist, publishChecklist } from "@/lib/server-actions/checklists";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Search,
  Filter,
  FileText,
  X,
  PowerOff
} from "lucide-react";
import { Checklist, ChecklistStatus } from "@/types";
import { useAuth } from "@/components/providers-simple";
import { ChecklistBuilder } from "@/components/checklists/checklist-builder";

const statusColors: Record<ChecklistStatus, string> = {
  draft: "text-gray-600",
  pending_approval: "text-yellow-600",
  approved: "text-blue-600",
  published: "text-green-600",
  retired: "text-red-600",
};

const statusLabels: Record<ChecklistStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  published: "Published",
  retired: "Retired",
};

export default function ChecklistsDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ChecklistStatus>("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [checklistToDelete, setChecklistToDelete] = useState<Checklist | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canManageChecklists = ["officer", "manager", "admin"].includes(user?.role || "");
  const canPublish = ["manager", "admin"].includes(user?.role || "");

  // Handle URL-based modal state
  useEffect(() => {
    const action = searchParams?.get('action');
    if (action === 'new') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadChecklists();
  }, [user]);

  const loadChecklists = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const result = canManageChecklists 
        ? await getAllChecklists(user.id, user.role) 
        : await getPublishedChecklists(user.id);
      
      if (result.success && result.checklists) {
        setChecklists(result.checklists);
      } else {
        setError(result.error || "Failed to load checklists");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | Date | undefined | null) => {
    if (!dateString) {
      return "No date";
    }
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDeleteChecklist = (checklist: Checklist) => {
    setChecklistToDelete(checklist);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteChecklist = async () => {
    if (!checklistToDelete) return;

    try {
      setActionLoading(checklistToDelete.id);
      const result = await deleteChecklist(checklistToDelete.id);
      
      if (result.success) {
        setSuccessMessage("Checklist deleted successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowDeleteConfirm(false);
        setChecklistToDelete(null);
        loadChecklists();
      } else {
        setError(result.error || "Failed to delete checklist");
      }
    } catch (err) {
      setError("Failed to delete checklist");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishChecklist = async (checklist: Checklist) => {
    if (!canPublish) {
      setError("You don't have permission to publish checklists");
      return;
    }

    try {
      setActionLoading(checklist.id);
      const result = await publishChecklist(checklist.id);
      
      if (result.success) {
        setSuccessMessage("Checklist published successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        loadChecklists();
      } else {
        setError(result.error || "Failed to publish checklist");
      }
    } catch (err) {
      setError("Failed to publish checklist");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    router.push('/dashboard/checklists?action=new', { scroll: false });
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    router.push('/dashboard/checklists', { scroll: false });
  };

  const handleChecklistSaved = () => {
    setSuccessMessage("Checklist created successfully!");
    setTimeout(() => setSuccessMessage(null), 3000);
    handleCloseCreateModal();
    loadChecklists();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="text-muted-foreground">Please log in to view checklists.</div>
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
            <span className="ml-2">Loading checklists...</span>
          </div>
        </div>
      </div>
    );
  }

  const filteredChecklists = checklists.filter(checklist => {
    const matchesSearch = checklist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (checklist.description && checklist.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || checklist.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inspection Checklists</h1>
        <p className="text-gray-600 mt-2">Manage and organize inspection checklists</p>
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
                  placeholder="Search checklists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(value: "all" | ChecklistStatus) => setStatusFilter(value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {canManageChecklists && (
              <Button onClick={handleOpenCreateModal}>
                <Plus className="mr-2 h-4 w-4" /> New Checklist
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checklists Grid */}
      {filteredChecklists.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm || statusFilter !== "all" 
            ? "No checklists match your criteria." 
            : "No checklists found. Create your first checklist to get started."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChecklists.map((checklist) => (
            <Card key={checklist.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {checklist.name}
                    </CardTitle>
                    <CardDescription>
                      {checklist.description || "No description"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={statusColors[checklist.status as ChecklistStatus]}>
                    {statusLabels[checklist.status as ChecklistStatus]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div><strong>Version:</strong> {checklist.version}</div>
                  <div><strong>Created:</strong> {formatDate(checklist.createdAt)}</div>
                  {checklist.updatedAt && (
                    <div><strong>Updated:</strong> {formatDate(checklist.updatedAt)}</div>
                  )}
                </div>
              </CardContent>
              <div className="mt-auto p-4 border-t">
                <div className="flex gap-2">
                  <Link href={`/checklist/${checklist.id}`} className="flex-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      title="View Checklist"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                  </Link>
                  {canManageChecklists && (
                    <>
                      <Link href={`/checklists/new?clone=${checklist.id}`}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          title="Edit Checklist"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </Link>
                      {checklist.status === "draft" && canPublish && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePublishChecklist(checklist)}
                          disabled={actionLoading === checklist.id}
                          title="Publish Checklist"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          {actionLoading === checklist.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      {canPublish && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteChecklist(checklist)}
                          disabled={actionLoading === checklist.id}
                          title="Delete Checklist"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {actionLoading === checklist.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && checklistToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Delete Checklist</CardTitle>
              <CardDescription>
                Are you sure you want to delete "{checklistToDelete.name}"? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setChecklistToDelete(null);
                  }} 
                  className="flex-1"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmDeleteChecklist}
                  className="flex-1"
                  variant="destructive"
                  disabled={actionLoading === checklistToDelete.id}
                >
                  {actionLoading === checklistToDelete.id ? (
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

      {/* Create Checklist Modal */}
      {showCreateModal && (
        <div 
          className="fixed bg-black bg-opacity-50 z-50" 
          style={{ 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            height: '100vh', 
            width: '100vw',
            margin: 0,
            padding: 0
          }}
        >
          <div className="h-full w-full flex items-start justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="w-full max-w-7xl my-8">
              <ChecklistBuilder 
                onSave={handleChecklistSaved} 
                onCancel={handleCloseCreateModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

