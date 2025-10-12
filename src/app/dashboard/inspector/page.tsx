"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Calendar,
  Filter
} from "lucide-react";

export default function InspectorDashboard() {
  // Mock data - in real app, this would come from API
  const stats = {
    totalInspections: 24,
    pendingInspections: 8,
    completedInspections: 16,
    overdueInspections: 2,
  };

  const recentInspections = [
    {
      id: "INSP-2024-001",
      operator: "Electronics Plus Ltd",
      location: "Valletta, Malta",
      status: "in_progress",
      dueDate: "2024-01-15",
      priority: "high",
    },
    {
      id: "INSP-2024-002", 
      operator: "Tech Solutions Malta",
      location: "Sliema, Malta",
      status: "completed",
      dueDate: "2024-01-10",
      priority: "medium",
    },
    {
      id: "INSP-2024-003",
      operator: "Import & Export Co",
      location: "Marsa, Malta", 
      status: "draft",
      dueDate: "2024-01-20",
      priority: "low",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "in_progress":
        return "text-blue-600 bg-blue-100";
      case "draft":
        return "text-gray-600 bg-gray-100";
      case "overdue":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-8">
        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1 btn-primary tablet-button">
            <Plus className="h-4 w-4 mr-2" />
            Start New Inspection
          </Button>
          <Button variant="outline" className="flex-1 tablet-button">
            <Search className="h-4 w-4 mr-2" />
            Search Inspections
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex items-center text-sm text-green-600">
                <span className="font-medium">+15.8%</span>
              </div>
            </div>
            <div className="metric-value">{stats.totalInspections}</div>
            <div className="metric-label">Total Inspections</div>
            <div className="text-xs text-gray-500 mt-1">All time inspections</div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex items-center text-sm text-green-600">
                <span className="font-medium">+8.3%</span>
              </div>
            </div>
            <div className="metric-value text-blue-600">{stats.pendingInspections}</div>
            <div className="metric-label">Pending</div>
            <div className="text-xs text-gray-500 mt-1">In progress inspections</div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex items-center text-sm text-green-600">
                <span className="font-medium">+12.4%</span>
              </div>
            </div>
            <div className="metric-value text-green-600">{stats.completedInspections}</div>
            <div className="metric-label">Completed</div>
            <div className="text-xs text-gray-500 mt-1">Finished inspections</div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex items-center text-sm text-red-600">
                <span className="font-medium">+2.1%</span>
              </div>
            </div>
            <div className="metric-value text-red-600">{stats.overdueInspections}</div>
            <div className="metric-label">Overdue</div>
            <div className="text-xs text-gray-500 mt-1">Past due date</div>
          </div>
        </div>

        {/* Recent Inspections */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Inspections</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  Sort
                </Button>
              </div>
            </div>
          </div>
          <div className="dashboard-card-content">
            <div className="space-y-3">
              {recentInspections.map((inspection) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{inspection.id}</h3>
                      <span className={`status-badge ${getStatusColor(inspection.status)}`}>
                        {inspection.status.replace("_", " ")}
                      </span>
                      <span className={`priority-badge ${getPriorityColor(inspection.priority)}`}>
                        {inspection.priority}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{inspection.operator}</p>
                    <p className="text-xs text-gray-500">{inspection.location}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 flex items-center mb-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        Due: {inspection.dueDate}
                      </div>
                      <div className="text-xs text-gray-400">
                        {inspection.status === 'completed' ? 'Completed' : 'In Progress'}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="ml-4">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Button variant="outline" className="tablet-button">
                View All Inspections
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <CardTitle className="text-lg font-semibold">Quick Tips</CardTitle>
          </div>
          <div className="dashboard-card-content">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Location Verification
                  </p>
                  <p className="text-sm text-gray-600">
                    Always capture GPS location and verify the address before starting an inspection.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-semibold">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Documentation
                  </p>
                  <p className="text-sm text-gray-600">
                    Take clear photos of ID documents and product markings for compliance verification.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm font-semibold">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Checklist Completion
                  </p>
                  <p className="text-sm text-gray-600">
                    Complete all required checklist items before submitting for officer review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
