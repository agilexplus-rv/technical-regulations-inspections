"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  FolderPlus, 
  FileQuestion, 
  MoveRight,
  Folder,
  HelpCircle
} from "lucide-react";
import { ConditionalContent as ConditionalContentType } from "@/types/conditional-logic";

interface ConditionalContentProps {
  content?: ConditionalContentType;
  label: "If True" | "If False";
  availableBlocks: Array<{ id: string; title: string; type: string; actionBlockType?: string }>;
  availableQuestions: Array<{ id: string; blockId: string; title: string; type: string }>;
  movedBlocks?: Array<{ id: string; title: string; type: string; actionBlockType?: string; questions: any[] }>;
  movedQuestions?: Array<{ id: string; blockId: string; title: string; type: string }>;
  onChange?: (content: ConditionalContentType) => void;
  onMoveExistingBlock?: (blockId: string) => void;
  onMoveExistingQuestion?: (questionId: string) => void;
  onRestoreBlock?: (blockId: string) => void;
  onRestoreQuestion?: (questionId: string) => void;
  readOnly?: boolean;
}

type ContentItemType = "new_action_block" | "new_conditional_block" | "new_question" | "existing_block" | "existing_question";

export function ConditionalContent({
  content,
  label,
  availableBlocks,
  availableQuestions,
  movedBlocks = [],
  movedQuestions = [],
  onChange,
  onMoveExistingBlock,
  onMoveExistingQuestion,
  onRestoreBlock,
  onRestoreQuestion,
  readOnly = false
}: ConditionalContentProps) {
  const [localContent, setLocalContent] = useState<ConditionalContentType>(
    content || {
      existingBlockIds: [],
      existingQuestionIds: [],
      newBlocks: [],
      newQuestions: []
    }
  );
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<ContentItemType | "">("");

  const handleContentChange = (updates: Partial<ConditionalContentType>) => {
    const updated = { ...localContent, ...updates };
    setLocalContent(updated);
    onChange?.(updated);
  };

  const addExistingBlock = (blockId: string) => {
    const existingBlockIds = [...(localContent.existingBlockIds || []), blockId];
    handleContentChange({ existingBlockIds });
    onMoveExistingBlock?.(blockId);
    setShowAddMenu(false);
    setSelectedItemType("");
  };

  const addExistingQuestion = (questionId: string) => {
    const existingQuestionIds = [...(localContent.existingQuestionIds || []), questionId];
    handleContentChange({ existingQuestionIds });
    onMoveExistingQuestion?.(questionId);
    setShowAddMenu(false);
    setSelectedItemType("");
  };

  const addNewActionBlock = () => {
    // This will be handled by the parent component
    const newBlocks = [...(localContent.newBlocks || []), {
      id: `new_block_${Date.now()}`,
      type: "action",
      actionBlockType: "product",
      title: "Action Block",
      description: "",
      questions: []
    }];
    handleContentChange({ newBlocks });
    setShowAddMenu(false);
    setSelectedItemType("");
  };

  const addNewConditionalBlock = () => {
    // This will be handled by the parent component
    const newBlocks = [...(localContent.newBlocks || []), {
      id: `new_block_${Date.now()}`,
      type: "conditional",
      title: "Conditional Block",
      description: "",
      questions: []
    }];
    handleContentChange({ newBlocks });
    setShowAddMenu(false);
    setSelectedItemType("");
  };

  const addNewQuestion = () => {
    const newQuestions = [...(localContent.newQuestions || []), {
      id: `new_q_${Date.now()}`,
      type: "text",
      title: "",
      description: "",
      required: false,
      enforceable: true,
      legislationId: "",
      articleNumber: ""
    }];
    handleContentChange({ newQuestions });
    setShowAddMenu(false);
    setSelectedItemType("");
  };

  const removeExistingBlock = (blockId: string) => {
    const existingBlockIds = (localContent.existingBlockIds || []).filter(id => id !== blockId);
    handleContentChange({ existingBlockIds });
    onRestoreBlock?.(blockId);
  };

  const removeExistingQuestion = (questionId: string) => {
    const existingQuestionIds = (localContent.existingQuestionIds || []).filter(id => id !== questionId);
    handleContentChange({ existingQuestionIds });
    onRestoreQuestion?.(questionId);
  };

  const removeNewBlock = (blockId: string) => {
    const newBlocks = (localContent.newBlocks || []).filter(b => b.id !== blockId);
    handleContentChange({ newBlocks });
  };

  const removeNewQuestion = (questionId: string) => {
    const newQuestions = (localContent.newQuestions || []).filter(q => q.id !== questionId);
    handleContentChange({ newQuestions });
  };

  const totalItems = 
    (localContent.existingBlockIds?.length || 0) +
    (localContent.existingQuestionIds?.length || 0) +
    (localContent.newBlocks?.length || 0) +
    (localContent.newQuestions?.length || 0);

  return (
    <Card className={`p-4 ${label === "If True" ? "bg-green-50 border-green-300" : "bg-orange-50 border-orange-300"}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={label === "If True" ? "bg-green-600" : "bg-orange-600"}>
              {label}
            </Badge>
            <span className="text-sm font-medium">
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </span>
          </div>
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddMenu(!showAddMenu)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Content
            </Button>
          )}
        </div>

        {/* Add Content Menu */}
        {showAddMenu && !readOnly && (
          <Card className="p-3 bg-white border-2">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Add Content to {label} Section</Label>
              
              <div>
                <Label className="text-xs">Content Type</Label>
                <Select value={selectedItemType} onValueChange={(value) => setSelectedItemType(value as ContentItemType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_action_block">New Action Block</SelectItem>
                    <SelectItem value="new_conditional_block">New Conditional Block</SelectItem>
                    <SelectItem value="new_question">New Question</SelectItem>
                    <SelectItem value="existing_block">Existing Block</SelectItem>
                    <SelectItem value="existing_question">Existing Question</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedItemType === "existing_block" && (
                <div>
                  <Label className="text-xs">Select Block to Move</Label>
                  <Select onValueChange={addExistingBlock}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select block" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBlocks.map((block) => (
                        <SelectItem key={block.id} value={block.id}>
                          {block.title} ({block.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedItemType === "existing_question" && (
                <div>
                  <Label className="text-xs">Select Question to Move</Label>
                  <Select onValueChange={addExistingQuestion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select question" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableQuestions.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedItemType === "new_action_block" && (
                <Button onClick={addNewActionBlock} className="w-full">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create New Action Block
                </Button>
              )}

              {selectedItemType === "new_conditional_block" && (
                <Button onClick={addNewConditionalBlock} className="w-full">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create New Conditional Block
                </Button>
              )}

              {selectedItemType === "new_question" && (
                <Button onClick={addNewQuestion} className="w-full">
                  <FileQuestion className="h-4 w-4 mr-2" />
                  Create New Question
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Display content items */}
        <div className="space-y-2">
          {/* Existing Blocks */}
          {localContent.existingBlockIds?.map((blockId) => {
            const block = movedBlocks.find(b => b.id === blockId);
            if (!block) return null;
            
            return (
              <div key={blockId} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{block.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {block.type} {block.actionBlockType && `(${block.actionBlockType})`}
                  </Badge>
                  <MoveRight className="h-3 w-3 text-gray-400" />
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExistingBlock(blockId)}
                    title="Restore block to main list"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}

          {/* Existing Questions */}
          {localContent.existingQuestionIds?.map((questionId) => {
            const question = movedQuestions.find(q => q.id === questionId);
            if (!question) return null;
            
            return (
              <div key={questionId} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{question.title}</span>
                  <Badge variant="outline" className="text-xs">{question.type}</Badge>
                  <MoveRight className="h-3 w-3 text-gray-400" />
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExistingQuestion(questionId)}
                    title="Restore question to original block"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}

          {/* New Blocks */}
          {localContent.newBlocks?.map((block) => (
            <div key={block.id} className="flex items-center justify-between p-2 bg-white rounded border border-dashed border-blue-400">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-blue-600" />
                <span className="text-sm">{block.title || "Untitled Block"}</span>
                <Badge variant="outline" className="text-xs bg-blue-100">New</Badge>
              </div>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeNewBlock(block.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {/* New Questions */}
          {localContent.newQuestions?.map((question) => (
            <div key={question.id} className="flex items-center justify-between p-2 bg-white rounded border border-dashed border-green-400">
              <div className="flex items-center gap-2">
                <FileQuestion className="h-4 w-4 text-green-600" />
                <span className="text-sm">{question.title || "Untitled Question"}</span>
                <Badge variant="outline" className="text-xs bg-green-100">New</Badge>
              </div>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeNewQuestion(question.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {totalItems === 0 && (
            <div className="text-center py-6 text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-sm">No content defined for {label} section</p>
              <p className="text-xs mt-1">Add blocks or questions that will execute when condition is {label.toLowerCase()}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

