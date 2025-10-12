"use client";

import { NewInspectionForm } from "@/components/inspections/new-inspection-form";

export default function NewInspectionPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Start New Inspection
          </h1>
          <p className="text-muted-foreground mt-2">
            Create a new technical regulations inspection
          </p>
        </div>

        <NewInspectionForm />
      </div>
    </div>
  );
}
