"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { QuestionType, QuestionOption } from "@/types";

interface CustomQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[];
  photosAllowed?: boolean;
  filesAllowed?: boolean;
}

interface CustomBlockProps {
  questions?: CustomQuestion[];
  onChange?: (questions: CustomQuestion[]) => void;
  readOnly?: boolean;
}

export function CustomBlock({ questions, onChange, readOnly = false }: CustomBlockProps) {
  const [localQuestions, setLocalQuestions] = useState<CustomQuestion[]>(questions || []);
  const [movedQuestionId, setMovedQuestionId] = useState<string | null>(null);

  const handleQuestionChange = (index: number, updates: Partial<CustomQuestion>) => {
    const updated = localQuestions.map((q, i) => (i === index ? { ...q, ...updates } : q));
    setLocalQuestions(updated);
    onChange?.(updated);
  };

  const addQuestion = () => {
    const newQuestion: CustomQuestion = {
      id: `custom_q_${Date.now()}`,
      type: "text",
      title: "",
      description: "",
      required: false,
      options: [],
    };
    const updated = [...localQuestions, newQuestion];
    setLocalQuestions(updated);
    onChange?.(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = localQuestions.filter((_, i) => i !== index);
    setLocalQuestions(updated);
    onChange?.(updated);
  };

  const moveQuestionUp = (index: number) => {
    if (index === 0) return;
    const questionId = localQuestions[index].id;
    const updated = [...localQuestions];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setLocalQuestions(updated);
    onChange?.(updated);
    setMovedQuestionId(questionId);
    setTimeout(() => setMovedQuestionId(null), 500);
  };

  const moveQuestionDown = (index: number) => {
    if (index === localQuestions.length - 1) return;
    const questionId = localQuestions[index].id;
    const updated = [...localQuestions];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setLocalQuestions(updated);
    onChange?.(updated);
    setMovedQuestionId(questionId);
    setTimeout(() => setMovedQuestionId(null), 500);
  };

  const addOption = (questionIndex: number) => {
    const question = localQuestions[questionIndex];
    if (question.options) {
      const newOption: QuestionOption = {
        id: `opt_${Date.now()}`,
        label: "",
        value: "",
      };
      handleQuestionChange(questionIndex, {
        options: [...question.options, newOption],
      });
    }
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    updates: Partial<QuestionOption>
  ) => {
    const question = localQuestions[questionIndex];
    if (question.options) {
      const updatedOptions = question.options.map((opt, i) =>
        i === optionIndex ? { ...opt, ...updates } : opt
      );
      handleQuestionChange(questionIndex, { options: updatedOptions });
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = localQuestions[questionIndex];
    if (question.options) {
      const updatedOptions = question.options.filter((_, i) => i !== optionIndex);
      handleQuestionChange(questionIndex, { options: updatedOptions });
    }
  };

  const questionTypes: { value: QuestionType; label: string }[] = [
    { value: "text", label: "Text Input" },
    { value: "boolean", label: "Yes/No" },
    { value: "single_choice", label: "Single Choice" },
    { value: "multi_choice", label: "Multiple Choice" },
    { value: "photo", label: "Photo Upload" },
    { value: "number", label: "Number" },
    { value: "barcode", label: "Barcode" },
    { value: "ocr", label: "OCR/Text Recognition" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-sm text-gray-700">Custom Block</h4>
          <p className="text-xs text-gray-500">Add your own custom questions</p>
        </div>
        {!readOnly && (
          <Button onClick={addQuestion} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Question
          </Button>
        )}
      </div>

      {localQuestions.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded">
          No custom questions yet. Click "Add Question" to create one.
        </div>
      )}

      {localQuestions.map((question, index) => (
        <div key={question.id} className={`border-l-4 border-gray-300 pl-4 space-y-3 bg-gray-50/50 p-3 rounded-r transition-all duration-300 ease-in-out ${movedQuestionId === question.id ? 'animate-swap' : ''}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Question {index + 1}</span>
            {!readOnly && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveQuestionUp(index)}
                  disabled={index === 0}
                  title={index === 0 ? "Already at the top" : "Move question up"}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveQuestionDown(index)}
                  disabled={index === localQuestions.length - 1}
                  title={index === localQuestions.length - 1 ? "Already at the bottom" : "Move question down"}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor={`required-${question.id}`} className="text-xs">Required</Label>
            <Switch
              id={`required-${question.id}`}
              checked={question.required}
              onCheckedChange={(checked) =>
                handleQuestionChange(index, { required: checked })
              }
              disabled={readOnly}
            />
          </div>

          <div>
            <Label className="text-xs">Question Type</Label>
            <Select
              value={question.type}
              onValueChange={(value) =>
                handleQuestionChange(index, { type: value as QuestionType })
              }
              disabled={readOnly}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
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
            <Label className="text-xs">Question Title *</Label>
            <Input
              value={question.title}
              onChange={(e) => handleQuestionChange(index, { title: e.target.value })}
              placeholder="e.g., How many products have been checked?"
              className="h-9"
              disabled={readOnly}
              required
            />
          </div>

          <div>
            <Label className="text-xs">Description (Optional)</Label>
            <Input
              value={question.description || ""}
              onChange={(e) =>
                handleQuestionChange(index, { description: e.target.value })
              }
              placeholder="Additional context or instructions"
              className="h-9"
              disabled={readOnly}
            />
          </div>

          {/* Question-level settings */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`photos-allowed-custom-${index}`} className="text-xs">
                Photo(s) Allowed
              </Label>
              <Switch
                id={`photos-allowed-custom-${index}`}
                checked={question.photosAllowed || false}
                onCheckedChange={(checked) => handleQuestionChange(index, { photosAllowed: checked })}
                disabled={readOnly}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`files-allowed-custom-${index}`} className="text-xs">
                File(s) Allowed
              </Label>
              <Switch
                id={`files-allowed-custom-${index}`}
                checked={question.filesAllowed || false}
                onCheckedChange={(checked) => handleQuestionChange(index, { filesAllowed: checked })}
                disabled={readOnly}
              />
            </div>
          </div>

          {/* Options for choice questions */}
          {(question.type === "single_choice" || question.type === "multi_choice") && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Options</Label>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(index)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                )}
              </div>
              {question.options?.map((option, optionIndex) => (
                <div key={option.id} className="flex gap-2 mb-2">
                  <Input
                    placeholder="Option label"
                    value={option.label}
                    onChange={(e) =>
                      updateOption(index, optionIndex, { label: e.target.value })
                    }
                    className="h-9"
                    disabled={readOnly}
                  />
                  <Input
                    placeholder="Value"
                    value={option.value}
                    onChange={(e) =>
                      updateOption(index, optionIndex, { value: e.target.value })
                    }
                    className="h-9"
                    disabled={readOnly}
                  />
                  {!readOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index, optionIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


