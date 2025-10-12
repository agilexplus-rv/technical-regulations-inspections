"use client";

import { Card } from "@/components/ui/card";
import { ActionBlockSelector } from "./action-block-selector";
import { ActionBlockType } from "./index";

interface ActionBlockWrapperProps {
  blockType?: ActionBlockType;
  questions?: any[];
  onChange?: (blockType: ActionBlockType, questions: any[]) => void;
  onBlockTypeChange?: (blockType: ActionBlockType) => void;
  readOnly?: boolean;
  showCard?: boolean;
}

/**
 * Wrapper component for action blocks that provides a consistent container
 * and layout. Can be used with or without a Card wrapper.
 */
export function ActionBlockWrapper({
  blockType = "product",
  questions,
  onChange,
  onBlockTypeChange,
  readOnly = false,
  showCard = true,
}: ActionBlockWrapperProps) {
  const content = (
    <ActionBlockSelector
      blockType={blockType}
      questions={questions}
      onChange={onChange}
      onBlockTypeChange={onBlockTypeChange}
      readOnly={readOnly}
    />
  );

  if (showCard) {
    return (
      <Card className="p-4">
        {content}
      </Card>
    );
  }

  return content;
}


