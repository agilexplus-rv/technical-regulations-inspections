"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  isLoading?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
  confirmButtonText = "Delete",
  cancelButtonText = "Cancel"
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-600">{title}</CardTitle>
          <CardDescription>
            {itemName ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.` : description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              onClick={onClose} 
              className="flex-1"
              variant="outline"
              disabled={isLoading}
            >
              {cancelButtonText}
            </Button>
            <Button 
              onClick={onConfirm}
              className="flex-1"
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                confirmButtonText
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
