"use client";

import { useRouter } from "next/navigation";
import { ChecklistBuilder } from "@/components/checklists/checklist-builder";

export default function NewChecklistPage() {
  const router = useRouter();

  const handleSave = () => {
    router.push("/dashboard/checklists");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Create New Checklist
          </h1>
          <p className="text-muted-foreground mt-2">
            Build a custom inspection checklist with questions and validation rules
          </p>
        </div>

        <ChecklistBuilder onSave={handleSave} />
      </div>
    </div>
  );
}
