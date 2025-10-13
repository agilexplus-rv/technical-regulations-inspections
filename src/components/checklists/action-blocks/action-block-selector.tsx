"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductBlock } from "./product-block";
import { ProductDetailsBlock, type ProductDetailsBlockSettings } from "./product-details-block";
import { EconomicOperatorBlock } from "./economic-operator-block";
import { CustomBlock } from "./custom-block";
import { ActionBlockType } from "./index";
import { Package, FileText, Building2, Pencil } from "lucide-react";

interface ActionBlockSelectorProps {
  blockType?: ActionBlockType;
  questions?: any[];
  blockSettings?: any; // For ProductDetailsBlock settings
  onChange?: (blockType: ActionBlockType, questions: any[], blockSettings?: any) => void;
  onBlockTypeChange?: (blockType: ActionBlockType) => void;
  readOnly?: boolean;
  disableTypeChange?: boolean; // Only disable the type selector, not the questions/settings
  legislations?: Array<{id: string, name: string}>;
  validationErrors?: Record<string, { title?: string; legislationId?: string; articleNumber?: string }>;
  blockId?: string;
}

const actionBlockTypes = [
  {
    value: "product" as ActionBlockType,
    label: "Product",
    description: "Questions about the product itself",
    icon: Package,
  },
  {
    value: "product_details" as ActionBlockType,
    label: "Product Details",
    description: "Detailed product identification (barcode, OCR, etc.)",
    icon: FileText,
  },
  {
    value: "economic_operator" as ActionBlockType,
    label: "Economic Operator",
    description: "Manufacturer, importer, distributor, or others in the supply chain",
    icon: Building2,
  },
  {
    value: "custom" as ActionBlockType,
    label: "Custom",
    description: "Create your own custom questions",
    icon: Pencil,
  },
];

export function ActionBlockSelector({
  blockType = "product",
  questions,
  blockSettings,
  onChange,
  onBlockTypeChange,
  readOnly = false,
  disableTypeChange = false,
  legislations = [],
  validationErrors = {},
  blockId = "",
}: ActionBlockSelectorProps) {
  const [selectedType, setSelectedType] = useState<ActionBlockType>(blockType);
  const [localQuestions, setLocalQuestions] = useState<any[]>(questions || []);
  const [localBlockSettings, setLocalBlockSettings] = useState<any>(blockSettings);

  const handleBlockTypeChange = (newType: ActionBlockType) => {
    setSelectedType(newType);
    // Reset questions when switching types
    setLocalQuestions([]);
    setLocalBlockSettings(undefined);
    onBlockTypeChange?.(newType);
    onChange?.(newType, [], undefined);
  };

  const handleQuestionsChange = (newQuestions: any[], settings?: any) => {
    setLocalQuestions(newQuestions);
    if (settings !== undefined) {
      setLocalBlockSettings(settings);
      onChange?.(selectedType, newQuestions, settings);
    } else {
      onChange?.(selectedType, newQuestions, localBlockSettings);
    }
  };

  const selectedTypeInfo = actionBlockTypes.find((t) => t.value === selectedType);
  const Icon = selectedTypeInfo?.icon || Package;

  return (
    <div className="space-y-4">
      {/* Block Type Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Action Block Type</Label>
        <Select value={selectedType} onValueChange={handleBlockTypeChange} disabled={disableTypeChange || readOnly}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{selectedTypeInfo?.label}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {actionBlockTypes.map((type) => {
              const TypeIcon = type.icon;
              return (
                <SelectItem key={type.value} value={type.value} className="cursor-pointer">
                  <div className="flex items-center gap-2 py-1">
                    <TypeIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">{type.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Render the appropriate block component */}
      <div className="border-t pt-4">
        {selectedType === "product" && (
          <ProductBlock
            questions={localQuestions}
            onChange={handleQuestionsChange}
            readOnly={readOnly}
            legislations={legislations}
            validationErrors={validationErrors}
            blockId={blockId}
          />
        )}
        {selectedType === "product_details" && (
          <ProductDetailsBlock
            questions={localQuestions}
            settings={localBlockSettings}
            onChange={handleQuestionsChange}
            readOnly={readOnly}
            legislations={legislations}
            validationErrors={validationErrors}
            blockId={blockId}
          />
        )}
        {selectedType === "economic_operator" && (
          <EconomicOperatorBlock
            questions={localQuestions}
            onChange={handleQuestionsChange}
            readOnly={readOnly}
            legislations={legislations}
            validationErrors={validationErrors}
            blockId={blockId}
          />
        )}
        {selectedType === "custom" && (
          <CustomBlock
            questions={localQuestions}
            onChange={handleQuestionsChange}
            readOnly={readOnly}
            legislations={legislations}
            validationErrors={validationErrors}
            blockId={blockId}
          />
        )}
      </div>
    </div>
  );
}


