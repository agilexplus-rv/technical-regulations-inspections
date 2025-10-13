"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConditionBuilder } from "./condition-builder";
import { ConditionalContent } from "./conditional-content";
import { evaluateCondition } from "@/lib/utils/condition-evaluator";
import { 
  ConditionalBlockData, 
  Condition, 
  ConditionalContent as ConditionalContentType,
  AvailableQuestion 
} from "@/types/conditional-logic";

interface ConditionalBlockEditorProps {
  blockData?: ConditionalBlockData;
  availableQuestions: AvailableQuestion[];
  availableBlocks: Array<{ id: string; title: string; type: string; actionBlockType?: string }>;
  movedBlocks: Array<{ id: string; title: string; type: string; actionBlockType?: string; questions: any[] }>;
  movedQuestions: Array<{ id: string; blockId: string; title: string; type: string }>;
  currentBlockId: string; // ID of the current conditional block being edited
  onChange?: (blockData: ConditionalBlockData) => void;
  onMoveExistingBlock?: (blockId: string, destination: "ifTrue" | "ifFalse") => void;
  onMoveExistingQuestion?: (questionId: string, destination: "ifTrue" | "ifFalse") => void;
  onRestoreBlock?: (blockId: string) => void;
  onRestoreQuestion?: (questionId: string) => void;
  readOnly?: boolean;
}

export function ConditionalBlockEditor({
  blockData,
  availableQuestions,
  availableBlocks,
  movedBlocks,
  movedQuestions,
  currentBlockId,
  onChange,
  onMoveExistingBlock,
  onMoveExistingQuestion,
  onRestoreBlock,
  onRestoreQuestion,
  readOnly = false
}: ConditionalBlockEditorProps) {
  const [localBlockData, setLocalBlockData] = useState<ConditionalBlockData>(
    blockData || {
      id: currentBlockId,
      title: "Conditional Block",
      description: "",
      condition: {
        id: `cond_${Date.now()}`,
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
  );

  // Filter out questions from blocks that come after the current conditional block
  // and questions from the current block itself
  const filteredQuestions = availableQuestions.filter(q => 
    !q.isFromCurrentBlock && q.blockId !== currentBlockId
  );

  // Filter out the current block and any blocks that are already referenced
  const filteredBlocks = availableBlocks.filter(b => 
    b.id !== currentBlockId &&
    !(localBlockData.ifTrue.existingBlockIds || []).includes(b.id) &&
    !(localBlockData.ifFalse.existingBlockIds || []).includes(b.id)
  );

  const handleBlockDataChange = (updates: Partial<ConditionalBlockData>) => {
    const updated = { ...localBlockData, ...updates };
    setLocalBlockData(updated);
    onChange?.(updated);
  };

  const handleConditionChange = (condition: Condition) => {
    handleBlockDataChange({ condition });
  };

  const handleIfTrueChange = (content: ConditionalContentType) => {
    handleBlockDataChange({ ifTrue: content });
  };

  const handleIfFalseChange = (content: ConditionalContentType) => {
    handleBlockDataChange({ ifFalse: content });
  };

  const handleTest = (testData: Record<string, any>): { result: boolean; explanation: string } => {
    handleBlockDataChange({ testData });
    return evaluateCondition(localBlockData.condition, testData, filteredQuestions);
  };

  return (
    <div className="space-y-6">
      {/* Condition Section */}
      <Card className="p-4 bg-blue-50 border-blue-300">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="font-semibold text-lg">Condition</h4>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Define the logical condition that determines which section executes. 
            The condition evaluates based on answers to previous questions.
          </p>

          <Separator />

          <ConditionBuilder
            condition={localBlockData.condition}
            availableQuestions={filteredQuestions}
            onChange={handleConditionChange}
            onTest={handleTest}
          />
        </div>
      </Card>

      {/* If True Section */}
      <Card className="p-4 bg-white border-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="font-semibold text-lg">If True Section</h4>
          </div>

          <p className="text-sm text-muted-foreground">
            Define what blocks or questions to execute when the condition evaluates to TRUE.
          </p>

          <Separator />

          <ConditionalContent
            content={localBlockData.ifTrue}
            label="If True"
            availableBlocks={filteredBlocks}
            availableQuestions={filteredQuestions}
            movedBlocks={movedBlocks.filter(b => localBlockData.ifTrue.existingBlockIds?.includes(b.id))}
            movedQuestions={movedQuestions.filter(q => localBlockData.ifTrue.existingQuestionIds?.includes(q.id))}
            onChange={handleIfTrueChange}
            onMoveExistingBlock={(blockId) => onMoveExistingBlock?.(blockId, "ifTrue")}
            onMoveExistingQuestion={(questionId) => onMoveExistingQuestion?.(questionId, "ifTrue")}
            onRestoreBlock={onRestoreBlock}
            onRestoreQuestion={onRestoreQuestion}
            readOnly={readOnly}
          />
        </div>
      </Card>

      {/* If False Section */}
      <Card className="p-4 bg-white border-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="font-semibold text-lg">If False Section</h4>
          </div>

          <p className="text-sm text-muted-foreground">
            Define what blocks or questions to execute when the condition evaluates to FALSE.
          </p>

          <Separator />

          <ConditionalContent
            content={localBlockData.ifFalse}
            label="If False"
            availableBlocks={filteredBlocks}
            availableQuestions={filteredQuestions}
            movedBlocks={movedBlocks.filter(b => localBlockData.ifFalse.existingBlockIds?.includes(b.id))}
            movedQuestions={movedQuestions.filter(q => localBlockData.ifFalse.existingQuestionIds?.includes(q.id))}
            onChange={handleIfFalseChange}
            onMoveExistingBlock={(blockId) => onMoveExistingBlock?.(blockId, "ifFalse")}
            onMoveExistingQuestion={(questionId) => onMoveExistingQuestion?.(questionId, "ifFalse")}
            onRestoreBlock={onRestoreBlock}
            onRestoreQuestion={onRestoreQuestion}
            readOnly={readOnly}
          />
        </div>
      </Card>
    </div>
  );
}

