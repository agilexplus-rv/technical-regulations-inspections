"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Eye, Save, X, FolderPlus, Folder, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from "lucide-react";
import { createChecklist, updateChecklist } from "@/lib/server-actions/checklists";
import { Checklist, ChecklistQuestion, QuestionType, ConditionalLogic, LegalReference, QuestionOption, QuestionValidation } from "@/types";
import { ActionBlockSelector, ActionBlockType } from "./action-blocks";
import { ConditionalBlockEditor } from "./conditional/conditional-block-editor";
import { AvailableQuestion } from "@/types/conditional-logic";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";

interface ChecklistBuilderProps {
  checklist?: Checklist;
  onSave?: () => void;
  onCancel?: () => void;
}

interface QuestionFormData {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  conditional?: ConditionalLogic;
  legalRefs?: LegalReference[];
  photosAllowed?: boolean; // For question-level photo attachments
  filesAllowed?: boolean; // For question-level file attachments
  enforceable?: boolean; // Whether question is enforceable or info only
  legislationId?: string; // Selected legislation ID
  articleNumber?: string; // Article number in free text
}

interface QuestionBlock {
  id: string;
  type: "action" | "conditional";
  actionBlockType?: ActionBlockType;
  title: string;
  description?: string;
  questions: QuestionFormData[];
  blockSettings?: any; // For Product Details block settings (photos/documents allowed)
  conditionalData?: any; // For conditional blocks - stores condition logic and if/else content
}

type BlockType = "action" | "conditional";

export function ChecklistBuilder({ checklist, onSave, onCancel }: ChecklistBuilderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    description?: string;
    blocks?: Record<string, string>;
    questions?: Record<string, { title?: string; legislationId?: string; articleNumber?: string }>;
  }>({});
  const [movedBlockId, setMovedBlockId] = useState<string | null>(null);
  const [movedQuestionKey, setMovedQuestionKey] = useState<string | null>(null);
  const [showFloatingButtons, setShowFloatingButtons] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [legislations, setLegislations] = useState<Array<{id: string, name: string}>>([]);
  const [movedBlocks, setMovedBlocks] = useState<Array<{ id: string; title: string; type: string; actionBlockType?: string; questions: any[] }>>([]);
  const [movedQuestions, setMovedQuestions] = useState<Array<{ id: string; blockId: string; title: string; type: string }>>([]);
  
  // Delete confirmation modal states
  const [showDeleteBlockModal, setShowDeleteBlockModal] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<QuestionBlock | null>(null);
  const [showDeleteQuestionModal, setShowDeleteQuestionModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<{ blockId: string; questionIndex: number; question: QuestionFormData } | null>(null);
  const [showDeleteOptionModal, setShowDeleteOptionModal] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState<{ blockId: string; questionIndex: number; optionIndex: number; option: QuestionOption } | null>(null);
  
  const addButtonsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Form state
  const [name, setName] = useState(checklist?.name || "");
  const [description, setDescription] = useState(checklist?.description || "");
  const [version, setVersion] = useState(checklist?.version || "1.0.0");
  const [questions, setQuestions] = useState<QuestionFormData[]>(
    checklist?.jsonSchema?.questions || []
  );
  const [blocks, setBlocks] = useState<QuestionBlock[]>(
    (checklist?.jsonSchema as any)?.blocks || []
  );

  // Auto-manage version based on checklist existence
  const currentVersion = checklist ? checklist.version : "1.0.0";

  // Settings state
  const [enforcementAction, setEnforcementAction] = useState(false);
  const [sampleCollection, setSampleCollection] = useState(false);
  const [repeatable, setRepeatable] = useState(true);
  const [maxRepetitions, setMaxRepetitions] = useState<number>(0);

  // Scroll detection for floating buttons
  useEffect(() => {
    const handleScroll = () => {
      if (addButtonsRef.current && scrollContainerRef.current) {
        const buttonRect = addButtonsRef.current.getBoundingClientRect();
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        
        // Show floating buttons only when original buttons are completely above the visible area
        // buttonRect.bottom < containerRect.top means the buttons have scrolled completely out of view
        setShowFloatingButtons(buttonRect.bottom < containerRect.top);
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      // Also check on mount and when blocks change
      handleScroll();
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [blocks.length]);

  // Fetch legislations on component mount
  useEffect(() => {
    const fetchLegislations = async () => {
      try {
        const response = await fetch('/api/legislation');
        if (response.ok) {
          const data = await response.json();
          setLegislations(data.legislations || []);
        }
      } catch (error) {
        console.error('Failed to fetch legislations:', error);
      }
    };
    
    fetchLegislations();
  }, []);

  // Auto-dismiss error after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [error]);

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

  const scrollToBlock = (blockId: string) => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Find the block element by its ID
    const blockElement = scrollContainer.querySelector(`[data-block-id="${blockId}"]`);
    if (blockElement) {
      // Scroll the block into view with some offset from the top
      const containerRect = scrollContainer.getBoundingClientRect();
      const blockRect = blockElement.getBoundingClientRect();
      const scrollTop = scrollContainer.scrollTop;
      const targetScrollTop = scrollTop + blockRect.top - containerRect.top - 20; // 20px offset from top
      
      scrollContainer.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  };

  const addBlock = (type: BlockType) => {
    // Validate: Conditional blocks cannot be added as the first block
    if (type === "conditional" && blocks.length === 0) {
      setError("Conditional blocks cannot be placed first. Please add at least one Action block before adding a Conditional block.");
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return;
    }

    const newBlock: QuestionBlock = {
      id: `block${Date.now()}`,
      type,
      actionBlockType: type === "action" ? "product" : undefined,
      title: type === "action" ? "Action Block" : "Conditional Block",
      description: "",
      questions: [],
      conditionalData: type === "conditional" ? {
        id: `cond_${Date.now()}`,
        title: "Conditional Block",
        description: "",
        condition: {
          id: `cond_logic_${Date.now()}`,
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
      } : undefined
    };
    
    // If adding an action block with product type, auto-add Product Details if it doesn't exist
    if (type === "action") {
      const hasProductDetails = blocks.some(b => 
        b.type === "action" && b.actionBlockType === "product_details"
      );
      
      if (!hasProductDetails) {
        const productDetailsBlock: QuestionBlock = {
          id: `block${Date.now() + 1}`, // Ensure unique ID
          type: "action",
          actionBlockType: "product_details",
          title: "Action Block",
          description: "",
          questions: [
            {
              id: `q${Date.now() + 2}`,
              type: "text",
              title: "Enter the product's name",
              description: "",
              required: true,
              options: [],
              validation: {},
              legalRefs: [],
              enforceable: true,
              legislationId: "",
              articleNumber: "",
            },
            {
              id: `q${Date.now() + 3}`,
              type: "text",
              title: "Enter the product's manufacturer's name",
              description: "",
              required: true,
              options: [],
              validation: {},
              legalRefs: [],
              enforceable: true,
              legislationId: "",
              articleNumber: "",
            },
            {
              id: `q${Date.now() + 4}`,
              type: "barcode",
              title: "Enter the product's identification (GTIN, serial number, etc.)",
              description: "",
              required: true,
              options: [],
              validation: {},
              legalRefs: [],
              enforceable: true,
              legislationId: "",
              articleNumber: "",
            }
          ],
          blockSettings: {
            photosAllowed: true,
            filesAllowed: false
          }
        };
        // Add Product Details BEFORE Product block
        setBlocks([...blocks, productDetailsBlock, newBlock]);
        // Expand both the Product Details and Product blocks when auto-creating Product Details
        setExpandedBlocks(new Set([productDetailsBlock.id, newBlock.id]));
        // Scroll to the newly created block after state update
        setTimeout(() => scrollToBlock(newBlock.id), 100);
      } else {
    setBlocks([...blocks, newBlock]);
        // Expand only the new block and collapse others
        setExpandedBlocks(new Set([newBlock.id]));
        // Scroll to the newly created block after state update
        setTimeout(() => scrollToBlock(newBlock.id), 100);
      }
    } else {
      setBlocks([...blocks, newBlock]);
      // Expand only the new block and collapse others
      setExpandedBlocks(new Set([newBlock.id]));
      // Scroll to the newly created block after state update
      setTimeout(() => scrollToBlock(newBlock.id), 100);
    }
  };

  const addQuestion = (blockId: string) => {
    const newQuestion: QuestionFormData = {
      id: `q${Date.now()}`,
      type: "text",
      title: "",
      description: "",
      required: false,
      options: [],
      validation: {},
      legalRefs: [],
      enforceable: true, // Default to enforceable
      legislationId: "",
      articleNumber: "",
    };
    
    setBlocks(blocks.map(block => 
      block.id === blockId 
        ? { ...block, questions: [...block.questions, newQuestion] }
        : block
    ));
  };

  const removeBlock = (blockId: string) => {
    const blockToRemove = blocks.find(block => block.id === blockId);
    if (blockToRemove) {
      setBlockToDelete(blockToRemove);
      setShowDeleteBlockModal(true);
    }
  };

  const confirmDeleteBlock = () => {
    if (!blockToDelete) return;
    
    const blockId = blockToDelete.id;
    
    // Prevent deletion of Product Details block if a Product block exists
    if (blockToDelete.type === "action" && blockToDelete.actionBlockType === "product_details") {
      const hasProductBlock = blocks.some(block => 
        block.type === "action" && block.actionBlockType === "product" && block.id !== blockId
      );
      
      if (hasProductBlock) {
        setError("Cannot delete Product Details block while a Product block exists. Please delete the Product block first.");
        setShowDeleteBlockModal(false);
        setBlockToDelete(null);
        return;
      }
    }
    
    setBlocks(blocks.filter(block => block.id !== blockId));
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      newSet.delete(blockId);
      return newSet;
    });
    setError(null); // Clear any previous errors
    
    setShowDeleteBlockModal(false);
    setBlockToDelete(null);
  };

  const updateQuestion = (blockId: string, questionIndex: number, updatedQuestion: Partial<QuestionFormData>) => {
    setBlocks(blocks.map(block => 
      block.id === blockId 
        ? {
            ...block,
            questions: block.questions.map((question, index) =>
              index === questionIndex 
                ? { ...question, ...updatedQuestion }
                : question
            )
          }
        : block
    ));
  };

  const removeQuestion = (blockId: string, questionIndex: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (block && block.questions[questionIndex]) {
      setQuestionToDelete({ blockId, questionIndex, question: block.questions[questionIndex] });
      setShowDeleteQuestionModal(true);
    }
  };

  const confirmDeleteQuestion = () => {
    if (!questionToDelete) return;
    
    const { blockId, questionIndex } = questionToDelete;
    
    setBlocks(blocks.map(block => 
      block.id === blockId 
        ? {
            ...block,
            questions: block.questions.filter((_, index) => index !== questionIndex)
          }
        : block
    ));
    
    setShowDeleteQuestionModal(false);
    setQuestionToDelete(null);
  };

  const updateBlock = (blockId: string, updatedBlock: Partial<QuestionBlock>) => {
    setBlocks(blocks.map(block => 
      block.id === blockId ? { ...block, ...updatedBlock } : block
    ));
  };

  const moveBlockUp = (blockIndex: number) => {
    if (blockIndex === 0) return; // Already at the top
    
    const block = blocks[blockIndex];
    const blockAbove = blocks[blockIndex - 1];
    
    // Prevent moving conditional block to first position
    if (block.type === "conditional" && blockIndex === 1) {
      setError("Conditional blocks cannot be placed first. They must have at least one block before them to reference questions.");
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return;
    }
    
    // Prevent moving Product block before Product Details block
    if (block.type === "action" && block.actionBlockType === "product" &&
        blockAbove.type === "action" && blockAbove.actionBlockType === "product_details") {
      setError("Product block cannot be moved before Product Details block.");
      return;
    }
    
    const newBlocks = [...blocks];
    [newBlocks[blockIndex - 1], newBlocks[blockIndex]] = [newBlocks[blockIndex], newBlocks[blockIndex - 1]];
    
    setBlocks(newBlocks);
    setMovedBlockId(block.id);
    setTimeout(() => setMovedBlockId(null), 500);
    setError(null);
  };

  const moveBlockDown = (blockIndex: number) => {
    if (blockIndex === blocks.length - 1) return; // Already at the bottom
    
    const block = blocks[blockIndex];
    const blockBelow = blocks[blockIndex + 1];
    
    // Prevent moving Product Details block after Product block
    if (block.type === "action" && block.actionBlockType === "product_details" &&
        blockBelow.type === "action" && blockBelow.actionBlockType === "product") {
      setError("Product Details block cannot be moved after Product block.");
      return;
    }
    
    const newBlocks = [...blocks];
    [newBlocks[blockIndex], newBlocks[blockIndex + 1]] = [newBlocks[blockIndex + 1], newBlocks[blockIndex]];
    
    setBlocks(newBlocks);
    setMovedBlockId(block.id);
    setTimeout(() => setMovedBlockId(null), 500);
    setError(null);
  };

  const moveQuestionUp = (blockId: string, questionIndex: number) => {
    if (questionIndex === 0) return; // Already at the top
    
    const block = blocks.find(b => b.id === blockId);
    const questionId = block?.questions[questionIndex]?.id;
    
    setBlocks(blocks.map(block => {
      if (block.id === blockId) {
        const newQuestions = [...block.questions];
        [newQuestions[questionIndex - 1], newQuestions[questionIndex]] = [newQuestions[questionIndex], newQuestions[questionIndex - 1]];
        return { ...block, questions: newQuestions };
      }
      return block;
    }));
    
    if (questionId) {
      setMovedQuestionKey(`${blockId}-${questionId}`);
      setTimeout(() => setMovedQuestionKey(null), 500);
    }
  };

  const moveQuestionDown = (blockId: string, questionIndex: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (questionIndex === block!.questions.length - 1) return; // Already at the bottom
    
    const questionId = block?.questions[questionIndex]?.id;
    
    setBlocks(blocks.map(block => {
      if (block.id === blockId) {
        const newQuestions = [...block.questions];
        [newQuestions[questionIndex], newQuestions[questionIndex + 1]] = [newQuestions[questionIndex + 1], newQuestions[questionIndex]];
        return { ...block, questions: newQuestions };
      }
      return block;
    }));
    
    if (questionId) {
      setMovedQuestionKey(`${blockId}-${questionId}`);
      setTimeout(() => setMovedQuestionKey(null), 500);
    }
  };

  const addOption = (blockId: string, questionIndex: number) => {
    const block = blocks.find(b => b.id === blockId);
    const question = block?.questions[questionIndex];
    if (question?.options) {
      const newOption = {
        id: `opt${Date.now()}`,
        label: "",
        value: "",
      };
      const updatedOptions = [...question.options, newOption];
      updateQuestion(blockId, questionIndex, { options: updatedOptions });
    }
  };

  const updateOption = (blockId: string, questionIndex: number, optionIndex: number, updates: Partial<{ label: string; value: string }>) => {
    const block = blocks.find(b => b.id === blockId);
    const question = block?.questions[questionIndex];
    if (question?.options) {
      const updatedOptions = [...question.options];
      updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], ...updates };
      updateQuestion(blockId, questionIndex, { options: updatedOptions });
    }
  };

  const removeOption = (blockId: string, questionIndex: number, optionIndex: number) => {
    const block = blocks.find(b => b.id === blockId);
    const question = block?.questions[questionIndex];
    if (question?.options && question.options[optionIndex]) {
      setOptionToDelete({ blockId, questionIndex, optionIndex, option: question.options[optionIndex] });
      setShowDeleteOptionModal(true);
    }
  };

  const confirmDeleteOption = () => {
    if (!optionToDelete) return;
    
    const { blockId, questionIndex, optionIndex } = optionToDelete;
    
    const block = blocks.find(b => b.id === blockId);
    const question = block?.questions[questionIndex];
    if (question?.options) {
      const updatedOptions = [...question.options];
      updatedOptions.splice(optionIndex, 1);
      updateQuestion(blockId, questionIndex, { options: updatedOptions });
    }
    
    setShowDeleteOptionModal(false);
    setOptionToDelete(null);
  };

  const handleSave = async () => {
    // Clear previous validation errors
    setValidationErrors({});
    setError(null);

    // Validate required fields
    const errors: { name?: string; description?: string; blocks?: Record<string, string> } = {};
    
    if (!name.trim()) {
      errors.name = "Checklist Name is required";
    }
    
    if (!description.trim()) {
      errors.description = "Checklist Description is required";
    }

    // Validate block names
    const blockErrors: Record<string, string> = {};
    blocks.forEach(block => {
      if (!block.title.trim()) {
        blockErrors[block.id] = "Block name is required";
      }
    });
    
    if (Object.keys(blockErrors).length > 0) {
      errors.blocks = blockErrors;
    }

    // Validate Product block requires Product Details block
    const hasProductBlock = blocks.some(block => 
      block.type === "action" && block.actionBlockType === "product"
    );
    const hasProductDetailsBlock = blocks.some(block => 
      block.type === "action" && block.actionBlockType === "product_details"
    );

    if (hasProductBlock && !hasProductDetailsBlock) {
      setError("A Product block requires a Product Details block to be present in the checklist.");
      // Scroll to top to show error message
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return;
    }

    // Validate Product Details block comes before Product block
    if (hasProductBlock && hasProductDetailsBlock) {
      const productDetailsIndex = blocks.findIndex(b => 
        b.type === "action" && b.actionBlockType === "product_details"
      );
      const productIndex = blocks.findIndex(b => 
        b.type === "action" && b.actionBlockType === "product"
      );
      
      if (productDetailsIndex > productIndex) {
        setError("Product Details block must appear before the Product block. Please reorder your blocks.");
        // Scroll to top to show error message
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
        return;
      }
    }

    // Validate conditional blocks are not first
    if (blocks.length > 0 && blocks[0].type === "conditional") {
      setError("Conditional blocks cannot be placed first. They must have at least one block before them to reference questions.");
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return;
    }

    // If there are basic validation errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Also show in main error banner
      const errorMessages: string[] = [];
      if (errors.name) errorMessages.push(errors.name);
      if (errors.description) errorMessages.push(errors.description);
      if (errors.blocks) {
        Object.values(errors.blocks).forEach(msg => errorMessages.push(msg));
      }
      if (errorMessages.length > 0) {
        setError(`Validation errors:\n${errorMessages.join('\n')}`);
      }
      // Scroll to top to show error message
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return;
    }

    // Validate all questions
    const enforceableErrors: string[] = [];
    const questionErrors: Record<string, { title?: string; legislationId?: string; articleNumber?: string }> = {};
    
    blocks.forEach((block, blockIndex) => {
      block.questions.forEach((question, questionIndex) => {
        const questionKey = `${block.id}-${question.id}`;
        
        // Validate question title is always required (for all questions)
        if (!question.title || !question.title.trim()) {
          enforceableErrors.push(`Block ${blockIndex + 1}, Question ${questionIndex + 1}: Question title is required`);
          if (!questionErrors[questionKey]) questionErrors[questionKey] = {};
          questionErrors[questionKey].title = "Question title is required";
        }
        
        // Check if question is enforceable (default is true)
        const isEnforceable = question.enforceable !== false;
        
        if (isEnforceable) {
          // Validate legislation is selected
          if (!question.legislationId || !question.legislationId.trim()) {
            enforceableErrors.push(`Block ${blockIndex + 1}, Question ${questionIndex + 1} ("${question.title || 'Untitled'}"): Legislation is required for enforceable questions`);
            if (!questionErrors[questionKey]) questionErrors[questionKey] = {};
            questionErrors[questionKey].legislationId = "Legislation is required";
          }
          
          // Validate article number is provided
          if (!question.articleNumber || !question.articleNumber.trim()) {
            enforceableErrors.push(`Block ${blockIndex + 1}, Question ${questionIndex + 1} ("${question.title || 'Untitled'}"): Article number is required for enforceable questions`);
            if (!questionErrors[questionKey]) questionErrors[questionKey] = {};
            questionErrors[questionKey].articleNumber = "Article number is required";
          }
        }
      });
    });

    if (enforceableErrors.length > 0) {
      setError(`Validation errors:\n${enforceableErrors.join('\n')}`);
      setValidationErrors({ questions: questionErrors });
      // Scroll to top to show error message
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return;
    }

    setLoading(true);

    try {
      const jsonSchema = {
        metadata: {
          version: currentVersion,
          title: name,
          description,
          legalBasis: "General Product Safety Regulation (EU) 2023/988",
        },
        settings: {
          enforcementAction,
          sampleCollection,
          repeatable,
          maxRepetitions: repeatable ? maxRepetitions : undefined,
        },
        blocks: blocks.map(block => ({
          ...block,
          questions: block.questions.filter(q => q.title.trim())
        })),
        questions: questions.filter(q => q.title.trim()),
      };

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("version", currentVersion);
      formData.append("jsonSchema", JSON.stringify(jsonSchema));

      let result;
      if (checklist) {
        result = await updateChecklist(checklist.id, formData);
      } else {
        result = await createChecklist(formData);
      }

      if (result.success) {
        if (onSave) {
          onSave();
        }
      } else {
        setError(result.error || "Failed to save checklist");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const questionTypes: { value: QuestionType; label: string }[] = [
    { value: "text", label: "Text Input" },
    { value: "boolean", label: "Yes/No" },
    { value: "single_choice", label: "Single Choice" },
    { value: "multi_choice", label: "Multiple Choice" },
    { value: "number", label: "Number" },
    { value: "barcode", label: "Barcode" },
    { value: "ocr", label: "OCR/Text Recognition" },
  ];

  // Helper function to get available questions for conditional block
  const getAvailableQuestionsForBlock = (currentBlockIndex: number): AvailableQuestion[] => {
    const available: AvailableQuestion[] = [];
    
    blocks.forEach((block, blockIndex) => {
      // Only include questions from blocks that come BEFORE the current conditional block
      if (blockIndex < currentBlockIndex) {
        block.questions.forEach((question) => {
          available.push({
            id: question.id,
            blockId: block.id,
            blockTitle: block.title,
            blockIndex: blockIndex,
            title: question.title,
            type: question.type,
            isFromCurrentBlock: false
          });
        });
      }
    });
    
    return available;
  };

  return (
    <div className="w-full mx-auto space-y-6 relative">
      <Card className="max-h-[90vh] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {checklist ? "Edit Checklist" : "Create New Checklist"}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? "Edit Mode" : "Preview"}
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Checklist
              </Button>
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent ref={scrollContainerRef} className="space-y-6 overflow-y-auto flex-1">
          {/* Error Alert at the top */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md relative" role="alert">
              <div className="flex items-start gap-2">
                <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <strong className="font-semibold">Validation Error</strong>
                  <div className="mt-1 text-sm whitespace-pre-line">{error}</div>
                </div>
              </div>
            </div>
          )}
          
          {!previewMode ? (
            <>
              {/* Checklist Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Checklist Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Checklist Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., General Product Safety Inspection"
                      required
                      className={validationErrors.name ? "border-red-500" : ""}
                    />
                    {validationErrors.name && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={currentVersion}
                      readOnly
                      className="bg-gray-100 text-gray-500 cursor-not-allowed"
                      title="Version is auto-managed by the system"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-managed by the system
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this checklist's purpose"
                    required
                    className={validationErrors.description ? "border-red-500" : ""}
                  />
                  {validationErrors.description && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.description}</p>
                  )}
                </div>
              </div>

              {/* Checklist Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Checklist Settings
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enforcement-action">Enforcement Action</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable enforcement actions for non-compliance
                      </p>
                    </div>
                    <Switch
                      id="enforcement-action"
                      checked={enforcementAction}
                      onCheckedChange={setEnforcementAction}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sample-collection">Sample Collection</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable sample collection during inspections
                      </p>
                    </div>
                    <Switch
                      id="sample-collection"
                      checked={sampleCollection}
                      onCheckedChange={setSampleCollection}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="repeatable">Repeatable</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow multiple completions during the same inspection visit
                        </p>
                      </div>
                      <Switch
                        id="repeatable"
                        checked={repeatable}
                        onCheckedChange={setRepeatable}
                      />
                    </div>
                    
                    {repeatable && (
                      <div className="ml-4 space-y-2">
                        <Label htmlFor="max-repetitions">Maximum Repetitions</Label>
                        <Input
                          id="max-repetitions"
                          type="number"
                          min="0"
                          value={maxRepetitions}
                          onChange={(e) => setMaxRepetitions(parseInt(e.target.value) || 0)}
                          placeholder="0 for unlimited"
                          className="w-32"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter 0 or leave empty for unlimited repetitions (inspector can stop manually)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Question Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Question Configuration
                  </h3>
                  <div ref={addButtonsRef} className="flex gap-2">
                    <Button 
                      onClick={() => addBlock("action")} 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Add Action Block
                    </Button>
                    <Button 
                      onClick={() => addBlock("conditional")} 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Add Conditional Block
                    </Button>
                  </div>
                </div>

                {/* Block Types Explanation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Understanding Block Types:</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-start gap-2">
                      <span className="inline-block w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></span>
                      <div>
                        <strong>Action Block:</strong> Contains questions that require immediate action or response. These questions are always shown during the inspection.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>
                      <div>
                        <strong>Conditional Block:</strong> Contains questions that only appear when certain conditions are met based on previous answers. For example, if a previous question asks "Is the toy intended for children below the age of 3?" and the answer is "Yes", then a conditional block with age-specific safety questions will be shown.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validation Warnings */}
                {blocks.some(block => block.type === "action" && block.actionBlockType === "product") && 
                 !blocks.some(block => block.type === "action" && block.actionBlockType === "product_details") && (
                  <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="font-medium text-yellow-900 mb-1">Missing Required Block</h4>
                        <p className="text-sm text-yellow-800">
                          A <strong>Product block</strong> requires a <strong>Product Details block</strong> to be present. The Product Details block may have been deleted. Please add it back using "Add Action Block" before saving.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {(() => {
                  const hasProduct = blocks.some(block => block.type === "action" && block.actionBlockType === "product");
                  const hasProductDetails = blocks.some(block => block.type === "action" && block.actionBlockType === "product_details");
                  if (hasProduct && hasProductDetails) {
                    const productDetailsIndex = blocks.findIndex(b => b.type === "action" && b.actionBlockType === "product_details");
                    const productIndex = blocks.findIndex(b => b.type === "action" && b.actionBlockType === "product");
                    if (productDetailsIndex > productIndex) {
                      return (
                        <div className="bg-red-50 border border-red-400 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <svg className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <h4 className="font-medium text-red-900 mb-1">Invalid Block Order</h4>
                              <p className="text-sm text-red-800">
                                The <strong>Product Details block</strong> must appear <strong>before</strong> the <strong>Product block</strong>. Currently, Product Details is at position {productDetailsIndex + 1} and Product is at position {productIndex + 1}. Please reorder your blocks.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}

                {blocks.map((block, blockIndex) => (
                  <Card key={block.id} data-block-id={block.id} className={`p-4 transition-all duration-300 ease-in-out ${movedBlockId === block.id ? 'animate-swap' : ''}`}>
                    <div className="space-y-4">
                      {/* Block Header */}
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-2 cursor-pointer flex-1"
                          onClick={() => toggleBlockExpansion(block.id)}
                        >
                          {expandedBlocks.has(block.id) ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                          <div className="flex items-start gap-2">
                            <Folder className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium flex items-center gap-2">
                                <span className="text-gray-600">Block {blockIndex + 1}:</span>
                              {block.title}
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
                            <p className="text-sm text-muted-foreground">{block.description}</p>
                            {!expandedBlocks.has(block.id) && (
                              <div className="text-xs text-gray-500 mt-2">
                                {block.questions.length} question{block.questions.length !== 1 ? 's' : ''}
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
                        <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                            onClick={() => moveBlockUp(blockIndex)}
                            disabled={
                              blockIndex === 0 ||
                              (block.type === "action" && block.actionBlockType === "product" &&
                               blockIndex > 0 && blocks[blockIndex - 1].type === "action" && 
                               blocks[blockIndex - 1].actionBlockType === "product_details")
                            }
                            title={
                              blockIndex === 0 
                                ? "Already at the top"
                                : (block.type === "action" && block.actionBlockType === "product" &&
                                   blockIndex > 0 && blocks[blockIndex - 1].type === "action" && 
                                   blocks[blockIndex - 1].actionBlockType === "product_details")
                                  ? "Product block cannot be moved before Product Details block"
                                  : "Move block up"
                            }
                          >
                            <ArrowUp className="h-4 w-4" />
                            </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveBlockDown(blockIndex)}
                            disabled={
                              blockIndex === blocks.length - 1 ||
                              (block.type === "action" && block.actionBlockType === "product_details" &&
                               blockIndex < blocks.length - 1 && blocks[blockIndex + 1].type === "action" && 
                               blocks[blockIndex + 1].actionBlockType === "product")
                            }
                            title={
                              blockIndex === blocks.length - 1
                                ? "Already at the bottom"
                                : (block.type === "action" && block.actionBlockType === "product_details" &&
                                   blockIndex < blocks.length - 1 && blocks[blockIndex + 1].type === "action" && 
                                   blocks[blockIndex + 1].actionBlockType === "product")
                                  ? "Product Details block cannot be moved after Product block"
                                  : "Move block down"
                            }
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeBlock(block.id)}
                            disabled={
                              block.type === "action" && 
                              block.actionBlockType === "product_details" &&
                              blocks.some(b => b.type === "action" && b.actionBlockType === "product" && b.id !== block.id)
                            }
                            title={
                              block.type === "action" && 
                              block.actionBlockType === "product_details" &&
                              blocks.some(b => b.type === "action" && b.actionBlockType === "product" && b.id !== block.id)
                                ? "Cannot delete Product Details block while a Product block exists"
                                : "Delete block"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Collapsible Block Content */}
                      {expandedBlocks.has(block.id) && (
                        <div className="space-y-4">
                      {/* Block Title/Description Edit */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Block Title *</Label>
                          <Input
                            value={block.title}
                            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                            placeholder="Enter block title"
                            className={validationErrors.blocks?.[block.id] ? "border-red-500" : ""}
                          />
                          {validationErrors.blocks?.[block.id] && (
                            <p className="text-sm text-red-500 mt-1">{validationErrors.blocks[block.id]}</p>
                          )}
                        </div>
                        <div>
                          <Label>Block Description</Label>
                          <Input
                            value={block.description || ""}
                            onChange={(e) => updateBlock(block.id, { description: e.target.value })}
                            placeholder="Enter block description"
                          />
                        </div>
                      </div>

                      {/* Questions in Block */}
                      {block.type === "action" ? (
                        // Action Block - Use ActionBlockSelector
                        <div className="border-t pt-4">
                          {block.actionBlockType === "product_details" &&
                           blocks.some(b => b.type === "action" && b.actionBlockType === "product" && b.id !== block.id) && (
                            <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-xs text-blue-800">
                                <strong>Note:</strong> This Product Details block type cannot be changed while a Product block exists in the checklist.
                              </p>
                            </div>
                          )}
                          <ActionBlockSelector
                            blockType={block.actionBlockType || "product"}
                            questions={block.questions}
                            blockSettings={block.blockSettings}
                            disableTypeChange={
                              block.actionBlockType === "product_details" &&
                              blocks.some(b => b.type === "action" && b.actionBlockType === "product" && b.id !== block.id)
                            }
                            onChange={(blockType, questions, blockSettings) => {
                              // Prevent changing Product Details block type if a Product block exists
                              if (block.actionBlockType === "product_details" && blockType !== "product_details") {
                                const hasProductBlock = blocks.some(b => 
                                  b.type === "action" && b.actionBlockType === "product" && b.id !== block.id
                                );
                                
                                if (hasProductBlock) {
                                  setError("Cannot change Product Details block type while a Product block exists. Please delete the Product block first.");
                                  return;
                                }
                              }
                              
                              updateBlock(block.id, { 
                                actionBlockType: blockType, 
                                questions: questions,
                                blockSettings: blockSettings
                              });
                              setError(null); // Clear any previous errors
                              
                              // Auto-add Product Details block if Product block is selected and no Product Details exists
                              if (blockType === "product") {
                                const hasProductDetails = blocks.some(b => 
                                  b.type === "action" && b.actionBlockType === "product_details"
                                );
                                
                                if (!hasProductDetails) {
                                  const productDetailsBlock: QuestionBlock = {
                                    id: `block${Date.now()}`,
                                    type: "action",
                                    actionBlockType: "product_details",
                                    title: "Action Block",
                                    description: "",
                                    questions: [],
                                  };
                                  // Insert Product Details block BEFORE the current block
                                  const currentBlockIndex = blocks.findIndex(b => b.id === block.id);
                                  const newBlocks = [...blocks];
                                  newBlocks.splice(currentBlockIndex, 0, productDetailsBlock);
                                  setBlocks(newBlocks);
                                }
                              }
                            }}
                            legislations={legislations}
                            validationErrors={validationErrors.questions || {}}
                            blockId={block.id}
                          />
                        </div>
                      ) : (
                        // Conditional Block - Use ConditionalBlockEditor
                        <div className="border-t pt-4">
                          <ConditionalBlockEditor
                            blockData={block.conditionalData}
                            availableQuestions={getAvailableQuestionsForBlock(blockIndex)}
                            availableBlocks={blocks.filter((b, idx) => idx < blockIndex && b.id !== block.id)}
                            movedBlocks={movedBlocks}
                            movedQuestions={movedQuestions}
                            currentBlockId={block.id}
                            legislations={legislations}
                            validationErrors={validationErrors.questions || {}}
                            onChange={(conditionalData) => {
                              updateBlock(block.id, { conditionalData });
                            }}
                            onMoveExistingBlock={(blockId, destination) => {
                              // Remove block from main blocks array and add to conditional content
                              const blockToMove = blocks.find(b => b.id === blockId);
                              if (blockToMove) {
                                // Store the moved block data
                                setMovedBlocks(prev => [...prev, blockToMove]);
                                
                                // Remove from main blocks
                                setBlocks(blocks.filter(b => b.id !== blockId));
                                
                                // Add to conditional block's content
                                const updatedConditionalData = { ...block.conditionalData };
                                if (destination === "ifTrue") {
                                  updatedConditionalData.ifTrue = {
                                    ...updatedConditionalData.ifTrue,
                                    existingBlockIds: [...(updatedConditionalData.ifTrue?.existingBlockIds || []), blockId]
                                  };
                                } else {
                                  updatedConditionalData.ifFalse = {
                                    ...updatedConditionalData.ifFalse,
                                    existingBlockIds: [...(updatedConditionalData.ifFalse?.existingBlockIds || []), blockId]
                                  };
                                }
                                updateBlock(block.id, { conditionalData: updatedConditionalData });
                              }
                            }}
                            onMoveExistingQuestion={(questionId, destination) => {
                              // Remove question from its block and add to conditional content
                              let questionToMove: any = null;
                              let sourceBlockId: string = "";
                              
                              // Find and remove the question
                              const updatedBlocks = blocks.map(b => {
                                const questionIndex = b.questions.findIndex(q => q.id === questionId);
                                if (questionIndex !== -1) {
                                  questionToMove = b.questions[questionIndex];
                                  sourceBlockId = b.id;
                                  return {
                                    ...b,
                                    questions: b.questions.filter(q => q.id !== questionId)
                                  };
                                }
                                return b;
                              });
                              
                              if (questionToMove) {
                                // Store the moved question data
                                setMovedQuestions(prev => [...prev, {
                                  id: questionToMove.id,
                                  blockId: sourceBlockId,
                                  title: questionToMove.title,
                                  type: questionToMove.type
                                }]);
                                
                                setBlocks(updatedBlocks);
                                
                                // Add to conditional block's content
                                const updatedConditionalData = { ...block.conditionalData };
                                if (destination === "ifTrue") {
                                  updatedConditionalData.ifTrue = {
                                    ...updatedConditionalData.ifTrue,
                                    existingQuestionIds: [...(updatedConditionalData.ifTrue?.existingQuestionIds || []), questionId]
                                  };
                                } else {
                                  updatedConditionalData.ifFalse = {
                                    ...updatedConditionalData.ifFalse,
                                    existingQuestionIds: [...(updatedConditionalData.ifFalse?.existingQuestionIds || []), questionId]
                                  };
                                }
                                updateBlock(block.id, { conditionalData: updatedConditionalData });
                              }
                            }}
                            onRestoreBlock={(blockId) => {
                              // Find the moved block and restore it to the main blocks array
                              const blockToRestore = movedBlocks.find(b => b.id === blockId);
                              if (blockToRestore) {
                                // Add back to main blocks array
                                setBlocks(prev => [...prev, blockToRestore as QuestionBlock]);
                                
                                // Remove from moved blocks
                                setMovedBlocks(prev => prev.filter(b => b.id !== blockId));
                                
                                // Remove from conditional content
                                const updatedConditionalData = { ...block.conditionalData };
                                if (updatedConditionalData.ifTrue?.existingBlockIds?.includes(blockId)) {
                                  updatedConditionalData.ifTrue = {
                                    ...updatedConditionalData.ifTrue,
                                    existingBlockIds: updatedConditionalData.ifTrue.existingBlockIds.filter((id: string) => id !== blockId)
                                  };
                                }
                                if (updatedConditionalData.ifFalse?.existingBlockIds?.includes(blockId)) {
                                  updatedConditionalData.ifFalse = {
                                    ...updatedConditionalData.ifFalse,
                                    existingBlockIds: updatedConditionalData.ifFalse.existingBlockIds.filter((id: string) => id !== blockId)
                                  };
                                }
                                updateBlock(block.id, { conditionalData: updatedConditionalData });
                              }
                            }}
                            onRestoreQuestion={(questionId) => {
                              // Find the moved question and restore it to its original block
                              const questionToRestore = movedQuestions.find(q => q.id === questionId);
                              if (questionToRestore) {
                                // Add back to the original block
                                setBlocks(prev => prev.map(b => {
                                  if (b.id === questionToRestore.blockId) {
                                    return {
                                      ...b,
                                      questions: [...b.questions, {
                                        id: questionToRestore.id,
                                        title: questionToRestore.title,
                                        type: questionToRestore.type as QuestionType,
                                        description: "",
                                        required: false,
                                        enforceable: true,
                                        legislationId: "",
                                        articleNumber: "",
                                        photosAllowed: false,
                                        filesAllowed: false
                                      }]
                                    };
                                  }
                                  return b;
                                }));
                                
                                // Remove from moved questions
                                setMovedQuestions(prev => prev.filter(q => q.id !== questionId));
                                
                                // Remove from conditional content
                                const updatedConditionalData = { ...block.conditionalData };
                                if (updatedConditionalData.ifTrue?.existingQuestionIds?.includes(questionId)) {
                                  updatedConditionalData.ifTrue = {
                                    ...updatedConditionalData.ifTrue,
                                    existingQuestionIds: updatedConditionalData.ifTrue.existingQuestionIds.filter((id: string) => id !== questionId)
                                  };
                                }
                                if (updatedConditionalData.ifFalse?.existingQuestionIds?.includes(questionId)) {
                                  updatedConditionalData.ifFalse = {
                                    ...updatedConditionalData.ifFalse,
                                    existingQuestionIds: updatedConditionalData.ifFalse.existingQuestionIds.filter((id: string) => id !== questionId)
                                  };
                                }
                                updateBlock(block.id, { conditionalData: updatedConditionalData });
                              }
                            }}
                            readOnly={previewMode}
                          />
                        </div>
                      )}

                      {/* Legacy conditional block questions - hidden for now */}
                  {false && block.type === "conditional" && (
                        <>
                          {block.questions.map((question, questionIndex) => (
                        <div key={question.id} className={`border-l-4 border-gray-200 pl-4 space-y-4 transition-all duration-300 ease-in-out ${movedQuestionKey === `${block.id}-${question.id}` ? 'animate-swap' : ''}`}>
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">Question {questionIndex + 1}</h5>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveQuestionUp(block.id, questionIndex)}
                                disabled={questionIndex === 0}
                                title={questionIndex === 0 ? "Already at the top" : "Move question up"}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveQuestionDown(block.id, questionIndex)}
                                disabled={questionIndex === block.questions.length - 1}
                                title={questionIndex === block.questions.length - 1 ? "Already at the bottom" : "Move question down"}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeQuestion(block.id, questionIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor={`required-${block.id}-${questionIndex}`}>Required</Label>
                            <Switch
                              id={`required-${block.id}-${questionIndex}`}
                              checked={question.required}
                              onCheckedChange={(checked) => updateQuestion(block.id, questionIndex, { required: checked })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor={`enforceable-${block.id}-${questionIndex}`}>Enforceable</Label>
                            <Switch
                              id={`enforceable-${block.id}-${questionIndex}`}
                              checked={question.enforceable !== false}
                              onCheckedChange={(checked) => {
                                const updates: any = { enforceable: checked };
                                // If changing to info only, clear legislation fields
                                if (!checked) {
                                  updates.legislationId = "";
                                  updates.articleNumber = "";
                                }
                                updateQuestion(block.id, questionIndex, updates);
                              }}
                            />
                          </div>

                          {question.enforceable !== false && (
                            <>
                              <div>
                                <Label htmlFor={`legislation-${block.id}-${questionIndex}`}>Legislation *</Label>
                                <Select
                                  value={question.legislationId || ""}
                                  onValueChange={(value) => updateQuestion(block.id, questionIndex, { legislationId: value })}
                                >
                                  <SelectTrigger className={validationErrors.questions?.[`${block.id}-${question.id}`]?.legislationId ? "border-red-500" : ""}>
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
                                {validationErrors.questions?.[`${block.id}-${question.id}`]?.legislationId && (
                                  <p className="text-sm text-red-500 mt-1">{validationErrors.questions[`${block.id}-${question.id}`].legislationId}</p>
                                )}
                              </div>

                              <div>
                                <Label htmlFor={`article-${block.id}-${questionIndex}`}>Article Number *</Label>
                                <Input
                                  id={`article-${block.id}-${questionIndex}`}
                                  value={question.articleNumber || ""}
                                  onChange={(e) => updateQuestion(block.id, questionIndex, { articleNumber: e.target.value })}
                                  placeholder="Enter article number (e.g., Article 5, Section 2.1)"
                                  className={validationErrors.questions?.[`${block.id}-${question.id}`]?.articleNumber ? "border-red-500" : ""}
                                />
                                {validationErrors.questions?.[`${block.id}-${question.id}`]?.articleNumber && (
                                  <p className="text-sm text-red-500 mt-1">{validationErrors.questions[`${block.id}-${question.id}`].articleNumber}</p>
                                )}
                              </div>
                            </>
                          )}

                            <div>
                              <Label>Question Type</Label>
                              <Select
                                value={question.type}
                                onValueChange={(value) => updateQuestion(block.id, questionIndex, { type: value as QuestionType })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select question type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {questionTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                          </div>

                          <div>
                            <Label>Question Title *</Label>
                            <Input
                              value={question.title}
                              onChange={(e) => updateQuestion(block.id, questionIndex, { title: e.target.value })}
                              placeholder="e.g., Is the CE marking visible?"
                              required
                              className={validationErrors.questions?.[`${block.id}-${question.id}`]?.title ? "border-red-500" : ""}
                            />
                            {validationErrors.questions?.[`${block.id}-${question.id}`]?.title && (
                              <p className="text-sm text-red-500 mt-1">{validationErrors.questions[`${block.id}-${question.id}`].title}</p>
                            )}
                          </div>

                          <div>
                            <Label>Description (Optional)</Label>
                            <Input
                              value={question.description || ""}
                              onChange={(e) => updateQuestion(block.id, questionIndex, { description: e.target.value })}
                              placeholder="Additional context or instructions"
                            />
                          </div>

                          {/* Question-level settings */}
                          <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`photos-allowed-${block.id}-${questionIndex}`} className="text-sm">
                                Photo(s) Allowed
                              </Label>
                              <Switch
                                id={`photos-allowed-${block.id}-${questionIndex}`}
                                checked={question.photosAllowed || false}
                                onCheckedChange={(checked) => updateQuestion(block.id, questionIndex, { photosAllowed: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`files-allowed-${block.id}-${questionIndex}`} className="text-sm">
                                File(s) Allowed
                              </Label>
                              <Switch
                                id={`files-allowed-${block.id}-${questionIndex}`}
                                checked={question.filesAllowed || false}
                                onCheckedChange={(checked) => updateQuestion(block.id, questionIndex, { filesAllowed: checked })}
                              />
                            </div>
                          </div>

                          {/* Options for choice questions */}
                          {(question.type === "single_choice" || question.type === "multi_choice") && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label>Options</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addOption(block.id, questionIndex)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Option
                                </Button>
                              </div>
                              {question.options?.map((option, optionIndex) => (
                                <div key={option.id} className="flex gap-2 mb-2">
                                  <Input
                                    placeholder="Option label"
                                    value={option.label}
                                    onChange={(e) => updateOption(block.id, questionIndex, optionIndex, { label: e.target.value })}
                                  />
                                  <Input
                                    placeholder="Value"
                                    value={option.value}
                                    onChange={(e) => updateOption(block.id, questionIndex, optionIndex, { value: e.target.value })}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeOption(block.id, questionIndex, optionIndex)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                      {block.questions.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                          No questions in this block yet. Click "Add Question" to get started.
                        </div>
                      )}
                    </>
                  )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {blocks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                    <Folder className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No blocks created yet. Create your first block to organize questions.</p>
                  </div>
                )}
              </div>

              {/* Floating Add Buttons */}
              {showFloatingButtons && !previewMode && (
                <div className="absolute right-[-240px] bottom-0 z-[100] flex flex-col gap-3 animate-in slide-in-from-right-5 fade-in duration-300">
                  <Button 
                    onClick={() => addBlock("action")} 
                    className="shadow-2xl hover:shadow-2xl transition-all bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 px-6 py-6 w-56"
                    size="lg"
                  >
                    <FolderPlus className="h-5 w-5 flex-shrink-0" />
                    <span className="font-semibold">Add Action Block</span>
                  </Button>
                  <Button 
                    onClick={() => addBlock("conditional")} 
                    className="shadow-2xl hover:shadow-2xl transition-all bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 px-6 py-6 w-56"
                    size="lg"
                  >
                    <FolderPlus className="h-5 w-5 flex-shrink-0" />
                    <span className="font-semibold">Add Conditional Block</span>
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Preview Mode */
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold">{name}</h2>
                <p className="text-muted-foreground">{description}</p>
                <p className="text-sm text-muted-foreground mt-2">Version: {currentVersion}</p>
              </div>

              {/* Checklist Settings Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Checklist Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Enforcement:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        enforcementAction 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {enforcementAction ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Sample Taking:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        sampleCollection 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {sampleCollection ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Repeatable:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        repeatable 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {repeatable ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Max Repetitions:</span>
                      <span className="text-gray-600">{maxRepetitions || "Unlimited"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {blocks.map((block) => (
                <div key={block.id} className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      {block.title}
                      <span className={`text-xs px-2 py-1 rounded ${
                        block.type === "action" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {block.type === "action" ? "Action" : "Conditional"}
                      </span>
                      {block.type === "action" && (
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 capitalize">
                          {block.actionBlockType ? block.actionBlockType.replace(/_/g, " ") : "product"}
                        </span>
                      )}
                    </h3>
                    {block.description && (
                      <p className="text-sm text-muted-foreground">{block.description}</p>
                    )}
                  </div>
                  
                  {block.questions.filter(q => q.title.trim()).map((question, index) => (
                    <Card key={question.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{index + 1}. {question.title}</h4>
                          {question.required && <span className="text-red-500">*</span>}
                        </div>
                        {question.description && (
                          <p className="text-sm text-muted-foreground">{question.description}</p>
                        )}
                        <div className="text-sm text-gray-500">
                          Type: {questionTypes.find(t => t.value === question.type)?.label}
                        </div>
                        {question.options && question.options.length > 0 && (
                          <div className="space-y-1">
                            {question.options.map((option) => (
                              <div key={option.id} className="text-sm">
                                • {option.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ))}

              {blocks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No blocks created yet.</p>
                </div>
              )}
            </div>
          )}

        </CardContent>
      </Card>

      {/* Delete Confirmation Modals */}
      <DeleteConfirmationModal
        isOpen={showDeleteBlockModal}
        onClose={() => {
          setShowDeleteBlockModal(false);
          setBlockToDelete(null);
        }}
        onConfirm={confirmDeleteBlock}
        title="Delete Block"
        description="This action cannot be undone."
        itemName={blockToDelete?.title}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteQuestionModal}
        onClose={() => {
          setShowDeleteQuestionModal(false);
          setQuestionToDelete(null);
        }}
        onConfirm={confirmDeleteQuestion}
        title="Delete Question"
        description="This action cannot be undone."
        itemName={questionToDelete?.question.title}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteOptionModal}
        onClose={() => {
          setShowDeleteOptionModal(false);
          setOptionToDelete(null);
        }}
        onConfirm={confirmDeleteOption}
        title="Delete Option"
        description="This action cannot be undone."
        itemName={optionToDelete?.option.label}
      />
    </div>
  );
}
