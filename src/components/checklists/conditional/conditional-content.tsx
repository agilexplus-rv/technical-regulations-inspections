"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
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
  HelpCircle,
  ChevronDown,
  ChevronRight,
  X,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { ConditionalContent as ConditionalContentType, ConditionalBlockData } from "@/types/conditional-logic";
import { ActionBlockSelector } from "../action-blocks/action-block-selector";
import { ActionBlockType } from "../action-blocks/index";
import { ConditionalBlockEditor } from "./conditional-block-editor";

interface ConditionalContentProps {
  content?: ConditionalContentType;
  label: "If True" | "If False";
  availableBlocks: Array<{ id: string; title: string; type: string; actionBlockType?: string }>;
  availableQuestions: Array<{ id: string; blockId: string; title: string; type: string }>;
  movedBlocks?: Array<{ id: string; title: string; type: string; actionBlockType?: string; questions: unknown[] }>;
  movedQuestions?: Array<{ id: string; blockId: string; title: string; type: string }>;
  onChange?: (content: ConditionalContentType) => void;
  onMoveExistingBlock?: (blockId: string, destination: "ifTrue" | "ifFalse") => void;
  onMoveExistingQuestion?: (questionId: string, destination: "ifTrue" | "ifFalse") => void;
  onRestoreBlock?: (blockId: string) => void;
  onRestoreQuestion?: (questionId: string) => void;
  legislations?: Array<{id: string, name: string}>;
  validationErrors?: Record<string, { title?: string; legislationId?: string; articleNumber?: string }>;
  isNested?: boolean; // Flag to indicate if this is already inside a conditional block
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
  legislations = [],
  validationErrors = {},
  isNested = false,
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
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  
  // Delete confirmation modal states
  const [showDeleteExistingBlockModal, setShowDeleteExistingBlockModal] = useState(false);
  const [existingBlockToDelete, setExistingBlockToDelete] = useState<string | null>(null);
  const [showDeleteExistingQuestionModal, setShowDeleteExistingQuestionModal] = useState(false);
  const [existingQuestionToDelete, setExistingQuestionToDelete] = useState<string | null>(null);
  const [showDeleteNewBlockModal, setShowDeleteNewBlockModal] = useState(false);
  const [newBlockToDelete, setNewBlockToDelete] = useState<string | null>(null);
  const [showDeleteNewQuestionModal, setShowDeleteNewQuestionModal] = useState(false);
  const [newQuestionToDelete, setNewQuestionToDelete] = useState<string | null>(null);
  
  // Move animation states
  const [movedNewBlockId, setMovedNewBlockId] = useState<string | null>(null);
  const [movedNewQuestionId, setMovedNewQuestionId] = useState<string | null>(null);

  const toggleBlockExpansion = (blockId: string) => {
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  };

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
    const timestamp = Date.now();
    const productBlockId = `new_block_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    const productDetailsBlockId = `new_block_${timestamp}_${Math.random().toString(36).substr(2, 9)}_details`;
    
    // Check if there's already a Product Details block in this conditional section
    const hasProductDetails = (localContent.newBlocks || []).some(b => 
      b.type === "action" && b.actionBlockType === "product_details"
    );
    
    const newBlocks = [...(localContent.newBlocks || [])];
    
    if (!hasProductDetails) {
      // Create Product Details block with default settings
      const productDetailsBlock = {
        id: productDetailsBlockId,
        type: "action" as const,
        actionBlockType: "product_details" as ActionBlockType,
        title: "Action Block",
        description: "",
        questions: [
          {
            id: `q${timestamp}_${Math.random().toString(36).substr(2, 9)}_1`,
            type: "text",
            title: "Enter the product's name",
            description: "",
            required: true,
            options: [],
            enforceable: true,
            legislationId: "",
            articleNumber: "",
            photosAllowed: false,
            filesAllowed: false
          },
          {
            id: `q${timestamp}_${Math.random().toString(36).substr(2, 9)}_2`,
            type: "text", 
            title: "Enter the product's manufacturer's name",
            description: "",
            required: true,
            options: [],
            enforceable: true,
            legislationId: "",
            articleNumber: "",
            photosAllowed: false,
            filesAllowed: false
          },
          {
            id: `q${timestamp}_${Math.random().toString(36).substr(2, 9)}_3`,
            type: "barcode",
            title: "Enter the product's identification (GTIN, serial number, etc.)",
            description: "",
            required: true,
            options: [],
            enforceable: true,
            legislationId: "",
            articleNumber: "",
            photosAllowed: false,
            filesAllowed: false
          }
        ],
        blockSettings: {
          photosAllowed: true,
          filesAllowed: false
        }
      };
      
      newBlocks.push(productDetailsBlock);
    }
    
    // Create the Product block
    const productBlock = {
      id: productBlockId,
      type: "action",
      actionBlockType: "product" as ActionBlockType,
      title: "Action Block",
      description: "",
      questions: [],
      blockSettings: undefined
    };
    
    newBlocks.push(productBlock);
    handleContentChange({ newBlocks });
    
    // Expand the newly created blocks
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      if (!hasProductDetails) {
        newSet.add(productDetailsBlockId);
      }
      newSet.add(productBlockId);
      return newSet;
    });
    
    setShowAddMenu(false);
    setSelectedItemType("");
  };

  const addNewConditionalBlock = () => {
    const newBlockId = `new_block_${Date.now()}`;
    const newBlocks = [...(localContent.newBlocks || []), {
      id: newBlockId,
      type: "conditional",
      title: "Conditional Block",
      description: "",
      questions: [],
      conditionalData: {
        id: `cond_${Date.now()}`,
        title: "Conditional Block",
        description: "",
        condition: {
          id: `cond_${Date.now()}_inner`,
          operator: "AND",
          items: []
        },
        ifTrue: {
          existingBlockIds: [],
          existingQuestionIds: [],
          newBlocks: [],
          newQuestions: []
        },
        ifFalse: {
          existingBlockIds: [],
          existingQuestionIds: [],
          newBlocks: [],
          newQuestions: []
        },
        testData: {}
      }
    }];
    handleContentChange({ newBlocks });
    
    // Expand the newly created block
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      newSet.add(newBlockId);
      return newSet;
    });
    
    setShowAddMenu(false);
    setSelectedItemType("");
  };

  const addNewQuestion = () => {
    const questionId = `new_q_${Date.now()}`;
    const newQuestions = [...(localContent.newQuestions || []), {
      id: questionId,
      type: "text",
      title: "",
      description: "",
      required: false,
      options: [],
      validation: {},
      legalRefs: [],
      enforceable: true,
      legislationId: "",
      articleNumber: "",
      photosAllowed: false,
      filesAllowed: false
    }];
    handleContentChange({ newQuestions });
    
    // Expand the newly created question
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      newSet.add(questionId);
      return newSet;
    });
    
    setShowAddMenu(false);
    setSelectedItemType("");
  };

  const removeExistingBlock = (blockId: string) => {
    setExistingBlockToDelete(blockId);
    setShowDeleteExistingBlockModal(true);
  };

  const confirmDeleteExistingBlock = () => {
    if (!existingBlockToDelete) return;
    
    const existingBlockIds = (localContent.existingBlockIds || []).filter(id => id !== existingBlockToDelete);
    handleContentChange({ existingBlockIds });
    onRestoreBlock?.(existingBlockToDelete);
    
    setShowDeleteExistingBlockModal(false);
    setExistingBlockToDelete(null);
  };

  const removeExistingQuestion = (questionId: string) => {
    setExistingQuestionToDelete(questionId);
    setShowDeleteExistingQuestionModal(true);
  };

  const confirmDeleteExistingQuestion = () => {
    if (!existingQuestionToDelete) return;
    
    const existingQuestionIds = (localContent.existingQuestionIds || []).filter(id => id !== existingQuestionToDelete);
    handleContentChange({ existingQuestionIds });
    onRestoreQuestion?.(existingQuestionToDelete);
    
    setShowDeleteExistingQuestionModal(false);
    setExistingQuestionToDelete(null);
  };

  const removeNewBlock = (blockId: string) => {
    setNewBlockToDelete(blockId);
    setShowDeleteNewBlockModal(true);
  };

  const confirmDeleteNewBlock = () => {
    if (!newBlockToDelete) return;
    
    const blockToRemove = localContent.newBlocks?.find(b => b.id === newBlockToDelete);
    
    // Prevent deleting Product Details block if Product blocks exist
    if (blockToRemove?.type === "action" && blockToRemove.actionBlockType === "product_details") {
      const hasProductBlock = (localContent.newBlocks || []).some(b => 
        b.type === "action" && b.actionBlockType === "product" && b.id !== newBlockToDelete
      );
      
      if (hasProductBlock) {
        setShowDeleteNewBlockModal(false);
        setNewBlockToDelete(null);
        return;
      }
    }
    
    const newBlocks = (localContent.newBlocks || []).filter(b => b.id !== newBlockToDelete);
    handleContentChange({ newBlocks });
    
    // Also remove from expanded blocks
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      newSet.delete(newBlockToDelete);
      return newSet;
    });
    
    setShowDeleteNewBlockModal(false);
    setNewBlockToDelete(null);
  };

  const removeNewQuestion = (questionId: string) => {
    setNewQuestionToDelete(questionId);
    setShowDeleteNewQuestionModal(true);
  };

  const confirmDeleteNewQuestion = () => {
    if (!newQuestionToDelete) return;
    
    const newQuestions = (localContent.newQuestions || []).filter(q => q.id !== newQuestionToDelete);
    handleContentChange({ newQuestions });
    
    // Also remove from expanded blocks
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      newSet.delete(newQuestionToDelete);
      return newSet;
    });
    
    setShowDeleteNewQuestionModal(false);
    setNewQuestionToDelete(null);
  };

  // Move functions for new blocks
  const moveNewBlockUp = (blockIndex: number) => {
    if (blockIndex === 0) return; // Already at the top
    
    const newBlocks = localContent.newBlocks || [];
    const block = newBlocks[blockIndex];
    const blockAbove = newBlocks[blockIndex - 1];
    
    // Prevent moving conditional block to first position
    if (block.type === "conditional" && blockIndex === 1) {
      return;
    }
    
    // Prevent moving Product block before Product Details block
    if (block.type === "action" && block.actionBlockType === "product" &&
        blockAbove.type === "action" && blockAbove.actionBlockType === "product_details") {
      return;
    }
    
    const updatedBlocks = [...newBlocks];
    [updatedBlocks[blockIndex - 1], updatedBlocks[blockIndex]] = [updatedBlocks[blockIndex], updatedBlocks[blockIndex - 1]];
    
    handleContentChange({ newBlocks: updatedBlocks });
    setMovedNewBlockId(block.id);
    setTimeout(() => setMovedNewBlockId(null), 500);
  };

  const moveNewBlockDown = (blockIndex: number) => {
    const newBlocks = localContent.newBlocks || [];
    if (blockIndex === newBlocks.length - 1) return; // Already at the bottom
    
    const block = newBlocks[blockIndex];
    const blockBelow = newBlocks[blockIndex + 1];
    
    // Prevent moving Product Details block after Product block
    if (block.type === "action" && block.actionBlockType === "product_details" &&
        blockBelow.type === "action" && blockBelow.actionBlockType === "product") {
      return;
    }
    
    const updatedBlocks = [...newBlocks];
    [updatedBlocks[blockIndex], updatedBlocks[blockIndex + 1]] = [updatedBlocks[blockIndex + 1], updatedBlocks[blockIndex]];
    
    handleContentChange({ newBlocks: updatedBlocks });
    setMovedNewBlockId(block.id);
    setTimeout(() => setMovedNewBlockId(null), 500);
  };

  // Move functions for new questions
  const moveNewQuestionUp = (questionIndex: number) => {
    if (questionIndex === 0) return; // Already at the top
    
    const newQuestions = localContent.newQuestions || [];
    const question = newQuestions[questionIndex];
    
    const updatedQuestions = [...newQuestions];
    [updatedQuestions[questionIndex - 1], updatedQuestions[questionIndex]] = [updatedQuestions[questionIndex], updatedQuestions[questionIndex - 1]];
    
    handleContentChange({ newQuestions: updatedQuestions });
    setMovedNewQuestionId(question.id);
    setTimeout(() => setMovedNewQuestionId(null), 500);
  };

  const moveNewQuestionDown = (questionIndex: number) => {
    const newQuestions = localContent.newQuestions || [];
    if (questionIndex === newQuestions.length - 1) return; // Already at the bottom
    
    const question = newQuestions[questionIndex];
    
    const updatedQuestions = [...newQuestions];
    [updatedQuestions[questionIndex], updatedQuestions[questionIndex + 1]] = [updatedQuestions[questionIndex + 1], updatedQuestions[questionIndex]];
    
    handleContentChange({ newQuestions: updatedQuestions });
    setMovedNewQuestionId(question.id);
    setTimeout(() => setMovedNewQuestionId(null), 500);
  };

  const updateNewQuestion = (questionId: string, updates: Partial<unknown>) => {
    const newQuestions = (localContent.newQuestions || []).map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    );
    handleContentChange({ newQuestions });
  };

  const updateNewActionBlock = (blockId: string, blockType: ActionBlockType, questions: any[], blockSettings?: any) => {
    const updatedBlocks = [...(localContent.newBlocks || [])];
    
    // Find the block being updated
    const blockIndex = updatedBlocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const currentBlock = updatedBlocks[blockIndex];
    
    // Handle Product block logic
    if (blockType === "product") {
      // Check if there's already a Product Details block in this conditional section
      const hasProductDetails = updatedBlocks.some(b => 
        b.type === "action" && b.actionBlockType === "product_details"
      );
      
      if (!hasProductDetails) {
        // Create Product Details block with default settings
        const productDetailsBlock = {
          id: `new_block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_details`,
          type: "action" as const,
          actionBlockType: "product_details" as ActionBlockType,
          title: "Action Block",
          description: "",
          questions: [
            {
              id: `q${Date.now()}_${Math.random().toString(36).substr(2, 9)}_1`,
              type: "text",
              title: "Enter the product's name",
              description: "",
              required: true,
              options: [],
              enforceable: true,
              legislationId: "",
              articleNumber: "",
              photosAllowed: false,
              filesAllowed: false
            },
            {
              id: `q${Date.now()}_${Math.random().toString(36).substr(2, 9)}_2`,
              type: "text", 
              title: "Enter the product's manufacturer's name",
              description: "",
              required: true,
              options: [],
              enforceable: true,
              legislationId: "",
              articleNumber: "",
              photosAllowed: false,
              filesAllowed: false
            },
            {
              id: `q${Date.now()}_${Math.random().toString(36).substr(2, 9)}_3`,
              type: "barcode",
              title: "Enter the product's identification (GTIN, serial number, etc.)",
              description: "",
              required: true,
              options: [],
              enforceable: true,
              legislationId: "",
              articleNumber: "",
              photosAllowed: false,
              filesAllowed: false
            }
          ],
          blockSettings: {
            photosAllowed: true,
            filesAllowed: false
          }
        };
        
        // Insert Product Details block before the Product block
        updatedBlocks.splice(blockIndex, 0, productDetailsBlock);
      }
    }
    
    // Update the current block
    const finalUpdatedBlocks = [...updatedBlocks];
    finalUpdatedBlocks[blockIndex] = {
      ...currentBlock,
      actionBlockType: blockType,
      questions: questions,
      blockSettings: blockSettings
    };
    
    handleContentChange({ newBlocks: finalUpdatedBlocks });
  };

  const updateNewConditionalBlock = (blockId: string, conditionalData: ConditionalBlockData) => {
    const newBlocks = (localContent.newBlocks || []).map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          conditionalData: conditionalData
        };
      }
      return block;
    });
    handleContentChange({ newBlocks });
  };

  // Check if Product Details blocks come before Product blocks
  const checkProductDetailsOrder = () => {
    const actionBlocks = (localContent.newBlocks || []).filter(b => b.type === "action");
    let lastProductDetailsIndex = -1;
    let firstProductIndex = -1;
    
    actionBlocks.forEach((block, index) => {
      if (block.actionBlockType === "product_details") {
        lastProductDetailsIndex = index;
      } else if (block.actionBlockType === "product" && firstProductIndex === -1) {
        firstProductIndex = index;
      }
    });
    
    return firstProductIndex === -1 || lastProductDetailsIndex < firstProductIndex;
  };

  const isProductDetailsOrderCorrect = checkProductDetailsOrder();

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
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Add Content to {label} Section</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddMenu(false);
                    setSelectedItemType("");
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div>
                <Label className="text-xs">Content Type</Label>
                <Select value={selectedItemType} onValueChange={(value) => setSelectedItemType(value as ContentItemType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_action_block">New Action Block</SelectItem>
                    {!isNested && <SelectItem value="new_conditional_block">New Conditional Block</SelectItem>}
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

        {/* Product Details Order Warning */}
        {!isProductDetailsOrderCorrect && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
            <div className="flex items-start gap-2">
              <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <strong>Product Details Order Issue:</strong> Product Details blocks must always come before Product blocks. Please reorder your blocks.
              </div>
            </div>
          </div>
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
          {localContent.newBlocks?.map((block, blockIndex) => {
            const isExpanded = expandedBlocks.has(block.id);
            
            return (
              <div 
                key={block.id} 
                className={`bg-white rounded-lg border border-dashed border-blue-400 p-4 ${movedNewBlockId === block.id ? 'swap-highlight' : ''}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-2 cursor-pointer flex-1"
                    onClick={() => toggleBlockExpansion(block.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <div className="flex items-start gap-2">
                      <Folder className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                      <h4 className="font-medium flex items-center gap-2">
                        <span className="text-gray-600">Block {blockIndex + 1}:</span>
                        {block.title || (block.type === "action" ? "Action Block" : "Conditional Block")}
                        <span className={`text-xs px-2 py-1 rounded ${
                          block.type === "action" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {block.type === "action" ? "Action" : "Conditional"}
                        </span>
                        {block.type === "action" && block.actionBlockType && (
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 capitalize">
                            {block.actionBlockType.replace(/_/g, " ")}
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">{block.description || ""}</p>
                      {!isExpanded && (
                        <div className="text-xs text-gray-500 mt-2">
                          {(block.questions || []).length} question{(block.questions || []).length !== 1 ? 's' : ''}
                          {block.type === "action" && block.actionBlockType === "product_details" && block.blockSettings && (
                            <span>
                              <span> • Photos: {block.blockSettings.photosAllowed ? 'Allowed' : 'Not allowed'}</span>
                              <span> • Files: {block.blockSettings.filesAllowed ? 'Allowed' : 'Not allowed'}</span>
                            </span>
                          )}
                          {block.type === "conditional" && block.conditionalData && (
                            <span>
                              <span> • {((block.conditionalData.ifTrue?.existingBlockIds?.length || 0) + (block.conditionalData.ifTrue?.newBlocks?.length || 0))} block{((block.conditionalData.ifTrue?.existingBlockIds?.length || 0) + (block.conditionalData.ifTrue?.newBlocks?.length || 0)) !== 1 ? 's' : ''} in If True</span>
                              <span> • {((block.conditionalData.ifFalse?.existingBlockIds?.length || 0) + (block.conditionalData.ifFalse?.newBlocks?.length || 0))} block{((block.conditionalData.ifFalse?.existingBlockIds?.length || 0) + (block.conditionalData.ifFalse?.newBlocks?.length || 0)) !== 1 ? 's' : ''} in If False</span>
                            </span>
                          )}
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveNewBlockUp(blockIndex)}
                        disabled={
                          blockIndex === 0 ||
                          (block.type === "action" && block.actionBlockType === "product" &&
                           blockIndex > 0 && localContent.newBlocks && localContent.newBlocks[blockIndex - 1].type === "action" && 
                           localContent.newBlocks[blockIndex - 1].actionBlockType === "product_details")
                        }
                        title={
                          blockIndex === 0 
                            ? "Already at the top"
                            : (block.type === "action" && block.actionBlockType === "product" &&
                               blockIndex > 0 && localContent.newBlocks && localContent.newBlocks[blockIndex - 1].type === "action" && 
                               localContent.newBlocks[blockIndex - 1].actionBlockType === "product_details")
                              ? "Product block cannot be moved before Product Details block"
                              : "Move block up"
                        }
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveNewBlockDown(blockIndex)}
                        disabled={
                          blockIndex === (localContent.newBlocks || []).length - 1 ||
                          (block.type === "action" && block.actionBlockType === "product_details" &&
                           blockIndex < (localContent.newBlocks || []).length - 1 && localContent.newBlocks && localContent.newBlocks[blockIndex + 1].type === "action" && 
                           localContent.newBlocks[blockIndex + 1].actionBlockType === "product")
                        }
                        title={
                          blockIndex === (localContent.newBlocks || []).length - 1
                            ? "Already at the bottom"
                            : (block.type === "action" && block.actionBlockType === "product_details" &&
                               blockIndex < (localContent.newBlocks || []).length - 1 && localContent.newBlocks && localContent.newBlocks[blockIndex + 1].type === "action" && 
                               localContent.newBlocks[blockIndex + 1].actionBlockType === "product")
                              ? "Product Details block cannot be moved after Product block"
                              : "Move block down"
                        }
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeNewBlock(block.id)}
                        disabled={
                          block.type === "action" && 
                          block.actionBlockType === "product_details" &&
                          (localContent.newBlocks || []).some(b => b.type === "action" && b.actionBlockType === "product" && b.id !== block.id)
                        }
                        title={
                          block.type === "action" && 
                          block.actionBlockType === "product_details" &&
                          (localContent.newBlocks || []).some(b => b.type === "action" && b.actionBlockType === "product" && b.id !== block.id)
                            ? "Cannot delete Product Details block while a Product block exists"
                            : `Remove this ${block.type} block`
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {isExpanded && (
                  <>
                    {/* Block Title/Description Edit */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label>Block Title *</Label>
                        <Input
                          value={block.title || ""}
                          onChange={(e) => {
                            const updatedBlocks = (localContent.newBlocks || []).map(b => 
                              b.id === block.id ? { ...b, title: e.target.value } : b
                            );
                            handleContentChange({ newBlocks: updatedBlocks });
                          }}
                          placeholder="Enter block title"
                          required
                        />
                      </div>
                      <div>
                        <Label>Block Description</Label>
                        <Input
                          value={block.description || ""}
                          onChange={(e) => {
                            const updatedBlocks = (localContent.newBlocks || []).map(b => 
                              b.id === block.id ? { ...b, description: e.target.value } : b
                            );
                            handleContentChange({ newBlocks: updatedBlocks });
                          }}
                          placeholder="Enter block description"
                        />
                      </div>
                    </div>
                  
                    {/* Render Action Block */}
                    {block.type === "action" && (
                      <>
                        {block.actionBlockType === "product_details" &&
                         (localContent.newBlocks || []).some(b => b.type === "action" && b.actionBlockType === "product" && b.id !== block.id) && (
                          <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800">
                              <strong>Note:</strong> This Product Details block type cannot be changed while a Product block exists in the checklist.
                            </p>
                          </div>
                        )}
                        <ActionBlockSelector
                  blockType={block.actionBlockType as ActionBlockType || "product"}
                  questions={block.questions || []}
                  blockSettings={block.blockSettings}
                  onChange={(blockType, questions, blockSettings) => {
                    // Prevent changing Product Details block type if Product blocks exist
                    if (block.actionBlockType === "product_details" && blockType !== "product_details") {
                      const hasProductBlock = (localContent.newBlocks || []).some(b => 
                        b.type === "action" && b.actionBlockType === "product" && b.id !== block.id
                      );
                      
                      if (hasProductBlock) {
                        alert("Cannot change Product Details block type while a Product block exists. Please delete the Product block first.");
                        return;
                      }
                    }
                    
                    updateNewActionBlock(block.id, blockType, questions, blockSettings);
                  }}
                  readOnly={readOnly}
                  disableTypeChange={
                    // Disable type change for Product Details blocks if Product blocks exist
                    block.actionBlockType === "product_details" && 
                    (localContent.newBlocks || []).some(b => 
                      b.type === "action" && b.actionBlockType === "product" && b.id !== block.id
                    )
                  }
                  legislations={legislations}
                  validationErrors={validationErrors}
                  blockId={block.id}
                />
                      </>
                    )}
              
                    {/* Render Conditional Block */}
                    {block.type === "conditional" && block.conditionalData && (
                      <ConditionalBlockEditor
                        blockData={block.conditionalData}
                        availableQuestions={availableQuestions}
                        availableBlocks={availableBlocks}
                        movedBlocks={[]} // New conditional blocks don't have moved blocks initially
                        movedQuestions={[]} // New conditional blocks don't have moved questions initially
                        currentBlockId={block.id}
                        onChange={(conditionalData) => 
                          updateNewConditionalBlock(block.id, conditionalData)
                        }
                        onMoveExistingBlock={(blockId, destination) => {
                          // Handle moving blocks within nested conditional blocks
                          onMoveExistingBlock?.(blockId, destination);
                        }}
                        onMoveExistingQuestion={(questionId, destination) => {
                          // Handle moving questions within nested conditional blocks
                          onMoveExistingQuestion?.(questionId, destination);
                        }}
                        legislations={legislations}
                        validationErrors={validationErrors}
                        isNested={true} // This is a nested conditional block
                        readOnly={readOnly}
                      />
                    )}
                  </>
                )}
                </div>
              </div>
            );
          })}

          {/* New Questions */}
          {localContent.newQuestions?.map((question, questionIndex) => {
            const isExpanded = expandedBlocks.has(question.id);
            
            return (
              <div 
                key={question.id} 
                className={`bg-white rounded-lg border border-dashed border-green-400 p-4 ${movedNewQuestionId === question.id ? 'swap-highlight' : ''}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-2 cursor-pointer flex-1"
                      onClick={() => toggleBlockExpansion(question.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <div className="flex items-start gap-2">
                        <FileQuestion className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium flex items-center gap-2">
                            <span className="text-gray-600">Question {questionIndex + 1}:</span>
                            {question.title || "New Question"}
                            <Badge variant="outline" className="text-xs bg-green-100">New</Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground">{question.description || ""}</p>
                          {!isExpanded && (
                            <div className="text-xs text-gray-500 mt-2">
                              Type: {question.type?.replace(/_/g, " ") || "Not set"}
                              {question.required && <span> • Required</span>}
                              {question.enforceable !== false && <span> • Enforceable</span>}
                              {question.photosAllowed && <span> • Photos: Allowed</span>}
                              {question.filesAllowed && <span> • Files: Allowed</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {!readOnly && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveNewQuestionUp(questionIndex)}
                          disabled={questionIndex === 0}
                          title={questionIndex === 0 ? "Already at the top" : "Move question up"}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveNewQuestionDown(questionIndex)}
                          disabled={questionIndex === (localContent.newQuestions || []).length - 1}
                          title={questionIndex === (localContent.newQuestions || []).length - 1 ? "Already at the bottom" : "Move question down"}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNewQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="space-y-4">
                {/* Required */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`required-${question.id}`}>Required</Label>
                  <Switch
                    id={`required-${question.id}`}
                    checked={question.required}
                    onCheckedChange={(checked) => updateNewQuestion(question.id, { required: checked })}
                  />
                </div>

                {/* Enforceable */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`enforceable-${question.id}`}>Enforceable</Label>
                  <Switch
                    id={`enforceable-${question.id}`}
                    checked={question.enforceable !== false}
                    onCheckedChange={(checked) => {
                      const updates: any = { enforceable: checked };
                      // If changing to info only, clear legislation fields
                      if (!checked) {
                        updates.legislationId = "";
                        updates.articleNumber = "";
                      }
                      updateNewQuestion(question.id, updates);
                    }}
                  />
                </div>

                {/* Legislation (only if enforceable) */}
                {question.enforceable !== false && (
                  <div>
                    <Label htmlFor={`legislation-${question.id}`}>Legislation *</Label>
                    <Select
                      value={question.legislationId || ""}
                      onValueChange={(value) => updateNewQuestion(question.id, { legislationId: value })}
                    >
                      <SelectTrigger className={validationErrors.questions?.[question.id]?.legislationId ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select legislation" />
                      </SelectTrigger>
                      <SelectContent>
                        {legislations.map((legislation) => (
                          <SelectItem key={legislation.id} value={legislation.id}>
                            {legislation.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.questions?.[question.id]?.legislationId && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.questions[question.id].legislationId}</p>
                    )}
                  </div>
                )}

                {/* Article Number (only if enforceable) */}
                {question.enforceable !== false && (
                  <div>
                    <Label htmlFor={`article-${question.id}`}>Article Number *</Label>
                    <Input
                      id={`article-${question.id}`}
                      value={question.articleNumber || ""}
                      onChange={(e) => updateNewQuestion(question.id, { articleNumber: e.target.value })}
                      placeholder="Enter article number (e.g., Article 5, Section 2.1)"
                      className={validationErrors.questions?.[question.id]?.articleNumber ? "border-red-500" : ""}
                    />
                    {validationErrors.questions?.[question.id]?.articleNumber && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.questions[question.id].articleNumber}</p>
                    )}
                  </div>
                )}

                {/* Question Type */}
                <div>
                  <Label htmlFor={`type-${question.id}`}>Question Type</Label>
                  <Select
                    value={question.type}
                    onValueChange={(value) => updateNewQuestion(question.id, { type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Input</SelectItem>
                      <SelectItem value="number">Number Input</SelectItem>
                      <SelectItem value="yes_no">Yes/No</SelectItem>
                      <SelectItem value="single_choice">Single Choice</SelectItem>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="barcode">Barcode/QR Code</SelectItem>
                      <SelectItem value="ocr">OCR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Question Title */}
                <div>
                  <Label htmlFor={`title-${question.id}`}>Question Title *</Label>
                  <Input
                    id={`title-${question.id}`}
                    value={question.title}
                    onChange={(e) => updateNewQuestion(question.id, { title: e.target.value })}
                    placeholder="e.g., Is the CE marking visible?"
                    className={validationErrors.questions?.[question.id]?.title ? "border-red-500" : ""}
                    required
                  />
                  {validationErrors.questions?.[question.id]?.title && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.questions[question.id].title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor={`description-${question.id}`}>Description (Optional)</Label>
                  <Textarea
                    id={`description-${question.id}`}
                    value={question.description || ""}
                    onChange={(e) => updateNewQuestion(question.id, { description: e.target.value })}
                    placeholder="Additional context or instructions"
                    rows={3}
                  />
                </div>

                {/* Photo(s) Allowed */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`photos-${question.id}`}>Photo(s) Allowed</Label>
                  <Switch
                    id={`photos-${question.id}`}
                    checked={question.photosAllowed || false}
                    onCheckedChange={(checked) => updateNewQuestion(question.id, { photosAllowed: checked })}
                  />
                </div>

                {/* File(s) Allowed */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`files-${question.id}`}>File(s) Allowed</Label>
                  <Switch
                    id={`files-${question.id}`}
                    checked={question.filesAllowed || false}
                    onCheckedChange={(checked) => updateNewQuestion(question.id, { filesAllowed: checked })}
                  />
                </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {totalItems === 0 && (
            <div className="text-center py-6 text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-sm">No content defined for {label} section</p>
              <p className="text-xs mt-1">Add blocks or questions that will execute when condition is {label.toLowerCase()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modals */}
      <DeleteConfirmationModal
        isOpen={showDeleteExistingBlockModal}
        onClose={() => {
          setShowDeleteExistingBlockModal(false);
          setExistingBlockToDelete(null);
        }}
        onConfirm={confirmDeleteExistingBlock}
        title="Restore Block"
        description={`This will remove it from the ${label} section and restore it to the main checklist.`}
        itemName={existingBlockToDelete ? movedBlocks.find(b => b.id === existingBlockToDelete)?.title : undefined}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteExistingQuestionModal}
        onClose={() => {
          setShowDeleteExistingQuestionModal(false);
          setExistingQuestionToDelete(null);
        }}
        onConfirm={confirmDeleteExistingQuestion}
        title="Restore Question"
        description={`This will remove it from the ${label} section and restore it to its original block.`}
        itemName={existingQuestionToDelete ? movedQuestions.find(q => q.id === existingQuestionToDelete)?.title : undefined}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteNewBlockModal}
        onClose={() => {
          setShowDeleteNewBlockModal(false);
          setNewBlockToDelete(null);
        }}
        onConfirm={confirmDeleteNewBlock}
        title="Delete Block"
        description="This action cannot be undone."
        itemName={newBlockToDelete ? localContent.newBlocks?.find(b => b.id === newBlockToDelete)?.title : undefined}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteNewQuestionModal}
        onClose={() => {
          setShowDeleteNewQuestionModal(false);
          setNewQuestionToDelete(null);
        }}
        onConfirm={confirmDeleteNewQuestion}
        title="Delete Question"
        description="This action cannot be undone."
        itemName={newQuestionToDelete ? localContent.newQuestions?.find(q => q.id === newQuestionToDelete)?.title : undefined}
      />
    </Card>
  );
}

