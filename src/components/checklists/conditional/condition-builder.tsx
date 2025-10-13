"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GitBranch, Brackets, Ban } from "lucide-react";
import { 
  Condition, 
  LogicStatement, 
  LogicGroup, 
  LogicOperator, 
  AvailableQuestion,
  Comparator,
  TextComparator,
  NumberComparator,
  BooleanComparator,
  ChoiceComparator
} from "@/types/conditional-logic";

interface ConditionBuilderProps {
  condition?: Condition;
  availableQuestions: AvailableQuestion[];
  onChange?: (condition: Condition) => void;
  onTest?: (testData: Record<string, any>) => { result: boolean; explanation: string };
}

// Helper to get comparators based on question type
const getComparatorsForType = (questionType: string): { value: Comparator; label: string }[] => {
  switch (questionType) {
    case "text":
    case "barcode":
    case "ocr":
      return [
        { value: "equals", label: "Equals" },
        { value: "not_equals", label: "Not Equals" },
        { value: "contains", label: "Contains" },
        { value: "starts_with", label: "Starts With" },
        { value: "ends_with", label: "Ends With" },
      ];
    case "number":
      return [
        { value: "equals", label: "Equals" },
        { value: "not_equals", label: "Not Equals" },
        { value: "greater_than", label: "Greater Than" },
        { value: "greater_than_or_equal", label: "Greater Than or Equal" },
        { value: "less_than", label: "Less Than" },
        { value: "less_than_or_equal", label: "Less Than or Equal" },
        { value: "between", label: "Between" },
      ];
    case "boolean":
      return [
        { value: "equals", label: "Equals" },
      ];
    case "single_choice":
      return [
        { value: "equals", label: "Equals" },
      ];
    case "multi_choice":
      return [
        { value: "contains_all", label: "Contains All" },
        { value: "contains_any", label: "Contains Any" },
      ];
    default:
      return [{ value: "equals", label: "Equals" }];
  }
};

export function ConditionBuilder({ 
  condition, 
  availableQuestions, 
  onChange,
  onTest 
}: ConditionBuilderProps) {
  const [localCondition, setLocalCondition] = useState<Condition>(
    condition || {
      id: `cond_${Date.now()}`,
      operator: "AND",
      items: []
    }
  );
  const [testData, setTestData] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<{ result: boolean; explanation: string } | null>(null);

  const handleConditionChange = (updates: Partial<Condition>) => {
    const updated = { ...localCondition, ...updates };
    setLocalCondition(updated);
    onChange?.(updated);
  };

  const addStatement = (parentId?: string) => {
    const newStatement: LogicStatement = {
      id: `stmt_${Date.now()}`,
      type: "statement",
      questionId: "",
      questionType: "text",
      comparator: "equals",
      value: "",
      isNegated: false,
    };

    if (parentId) {
      // Add to a specific group
      const updatedItems = addItemToGroup(localCondition.items, parentId, newStatement);
      handleConditionChange({ items: updatedItems });
    } else {
      // Add to root level
      handleConditionChange({ items: [...localCondition.items, newStatement] });
    }
  };

  const addGroup = (parentId?: string, nestingLevel: number = 0) => {
    if (nestingLevel >= 2) {
      alert("Maximum nesting level of 2 has been reached");
      return;
    }

    const newGroup: LogicGroup = {
      id: `grp_${Date.now()}`,
      type: "group",
      operator: "AND",
      items: [],
      isNegated: false,
      nestingLevel: nestingLevel,
    };

    if (parentId) {
      // Add to a specific group
      const updatedItems = addItemToGroup(localCondition.items, parentId, newGroup);
      handleConditionChange({ items: updatedItems });
    } else {
      // Add to root level
      handleConditionChange({ items: [...localCondition.items, newGroup] });
    }
  };

  const addItemToGroup = (items: (LogicStatement | LogicGroup)[], groupId: string, newItem: LogicStatement | LogicGroup): (LogicStatement | LogicGroup)[] => {
    return items.map(item => {
      if (item.type === "group" && item.id === groupId) {
        return { ...item, items: [...item.items, newItem] };
      } else if (item.type === "group") {
        return { ...item, items: addItemToGroup(item.items, groupId, newItem) };
      }
      return item;
    });
  };

  const updateStatement = (statementId: string, updates: Partial<LogicStatement>) => {
    const updatedItems = updateItemInTree(localCondition.items, statementId, updates);
    handleConditionChange({ items: updatedItems });
  };

  const updateGroup = (groupId: string, updates: Partial<LogicGroup>) => {
    const updatedItems = updateItemInTree(localCondition.items, groupId, updates);
    handleConditionChange({ items: updatedItems });
  };

  const updateItemInTree = (items: (LogicStatement | LogicGroup)[], itemId: string, updates: any): (LogicStatement | LogicGroup)[] => {
    return items.map(item => {
      if (item.id === itemId) {
        return { ...item, ...updates };
      } else if (item.type === "group") {
        return { ...item, items: updateItemInTree(item.items, itemId, updates) };
      }
      return item;
    });
  };

  const removeItem = (itemId: string) => {
    const updatedItems = removeItemFromTree(localCondition.items, itemId);
    handleConditionChange({ items: updatedItems });
  };

  const removeItemFromTree = (items: (LogicStatement | LogicGroup)[], itemId: string): (LogicStatement | LogicGroup)[] => {
    return items
      .filter(item => item.id !== itemId)
      .map(item => {
        if (item.type === "group") {
          return { ...item, items: removeItemFromTree(item.items, itemId) };
        }
        return item;
      });
  };

  const handleTestCondition = () => {
    if (onTest) {
      const result = onTest(testData);
      setTestResult(result);
      setTimeout(() => setTestResult(null), 10000); // Auto-dismiss after 10 seconds
    }
  };

  const renderStatement = (statement: LogicStatement, depth: number = 0) => {
    const selectedQuestion = availableQuestions.find(q => q.id === statement.questionId);
    const comparators = selectedQuestion ? getComparatorsForType(selectedQuestion.type) : [];

    return (
      <Card key={statement.id} className={`p-3 ${depth > 0 ? 'ml-6' : ''} bg-blue-50 border-blue-200`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Logic Statement</span>
              {statement.isNegated && (
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                  <Ban className="h-3 w-3 mr-1" />
                  NOT
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatement(statement.id, { isNegated: !statement.isNegated })}
                title={statement.isNegated ? "Remove NOT" : "Add NOT"}
              >
                <Ban className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeItem(statement.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Question</Label>
              <Select
                value={statement.questionId}
                onValueChange={(value) => {
                  const question = availableQuestions.find(q => q.id === value);
                  updateStatement(statement.id, { 
                    questionId: value,
                    questionType: question?.type || "text",
                    comparator: "equals",
                    value: ""
                  });
                }}
              >
                <SelectTrigger className="!h-10 !min-h-[40px] !max-h-[40px]">
                  <SelectValue placeholder="Select question" />
                </SelectTrigger>
                <SelectContent>
                  {availableQuestions.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      Block {q.blockIndex + 1}: {q.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Comparator</Label>
              <Select
                value={statement.comparator}
                onValueChange={(value) => updateStatement(statement.id, { comparator: value as Comparator })}
                disabled={!statement.questionId}
              >
                <SelectTrigger className="!h-10 !min-h-[40px] !max-h-[40px]">
                  <SelectValue placeholder="Select comparator" />
                </SelectTrigger>
                <SelectContent>
                  {comparators.map((comp) => (
                    <SelectItem key={comp.value} value={comp.value}>
                      {comp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Value</Label>
              {selectedQuestion?.type === "boolean" ? (
                <Select
                  value={statement.value?.toString()}
                  onValueChange={(value) => updateStatement(statement.id, { value: value === "true" })}
                >
                  <SelectTrigger className="!h-10 !min-h-[40px] !max-h-[40px]">
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={statement.value || ""}
                  onChange={(e) => updateStatement(statement.id, { value: e.target.value })}
                  placeholder="Enter value"
                  className="!h-10 !min-h-[40px] !max-h-[40px]"
                  type={selectedQuestion?.type === "number" ? "number" : "text"}
                />
              )}
            </div>
          </div>

          {statement.comparator === "between" && (
            <div>
              <Label className="text-xs">Second Value (for Between)</Label>
              <Input
                value={statement.secondValue || ""}
                onChange={(e) => updateStatement(statement.id, { secondValue: e.target.value })}
                placeholder="Enter second value"
                className="!h-10 !min-h-[40px] !max-h-[40px]"
                type="number"
              />
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderGroup = (group: LogicGroup, depth: number = 0) => {
    return (
      <Card key={group.id} className={`p-3 ${depth > 0 ? 'ml-6' : ''} bg-purple-50 border-purple-200`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brackets className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Logic Group (Level {group.nestingLevel})</span>
              {group.isNegated && (
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                  <Ban className="h-3 w-3 mr-1" />
                  NOT
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Select
                value={group.operator}
                onValueChange={(value) => updateGroup(group.id, { operator: value as LogicOperator })}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateGroup(group.id, { isNegated: !group.isNegated })}
                title={group.isNegated ? "Remove NOT" : "Add NOT"}
              >
                <Ban className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeItem(group.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {group.items.map(item => 
              item.type === "statement" 
                ? renderStatement(item, depth + 1)
                : renderGroup(item, depth + 1)
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-purple-300">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addStatement(group.id)}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Statement
            </Button>
            {group.nestingLevel < 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => addGroup(group.id, group.nestingLevel + 1)}
                className="flex-1"
              >
                <Brackets className="h-4 w-4 mr-1" />
                Add Nested Group
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Condition Logic</h4>
        <Select
          value={localCondition.operator}
          onValueChange={(value) => handleConditionChange({ operator: value as LogicOperator })}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">AND</SelectItem>
            <SelectItem value="OR">OR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {localCondition.items.map(item => 
          item.type === "statement" 
            ? renderStatement(item)
            : renderGroup(item)
        )}
      </div>

      {localCondition.items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
          <p>No conditions defined yet</p>
          <p className="text-sm mt-1">Add a statement or group to start building your condition</p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={() => addStatement()}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Statement
        </Button>
        <Button
          variant="outline"
          onClick={() => addGroup(undefined, 0)}
          className="flex-1"
        >
          <Brackets className="h-4 w-4 mr-2" />
          Add Group
        </Button>
      </div>

      {/* Test Section */}
      {availableQuestions.length > 0 && localCondition.items.length > 0 && (
        <Card className="p-4 bg-gray-50 border-gray-300">
          <h5 className="font-semibold mb-3">Test Condition</h5>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter test values for the questions used in your condition logic:
            </p>
            
            {/* Collect all question IDs used in statements */}
            {Array.from(new Set(
              getAllQuestionIds(localCondition.items)
            )).map(questionId => {
              const question = availableQuestions.find(q => q.id === questionId);
              if (!question) return null;

              return (
                <div key={questionId}>
                  <Label className="text-xs">{question.title}</Label>
                  {question.type === "boolean" ? (
                    <Select
                      value={testData[questionId]?.toString() || ""}
                      onValueChange={(value) => setTestData({ ...testData, [questionId]: value === "true" })}
                    >
                      <SelectTrigger className="!h-10 !min-h-[40px] !max-h-[40px]">
                        <SelectValue placeholder="Select test value" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={testData[questionId] || ""}
                      onChange={(e) => setTestData({ ...testData, [questionId]: e.target.value })}
                      placeholder="Enter test value"
                      className="!h-10 !min-h-[40px] !max-h-[40px]"
                      type={question.type === "number" ? "number" : "text"}
                    />
                  )}
                </div>
              );
            })}

            <Button
              onClick={handleTestCondition}
              className="w-full"
              disabled={!onTest}
            >
              Test Condition
            </Button>

            {testResult && (
              <div className={`p-3 rounded-md border ${
                testResult.result 
                  ? "bg-green-50 border-green-200 text-green-800" 
                  : "bg-orange-50 border-orange-200 text-orange-800"
              }`}>
                <p className="font-semibold">
                  Result: {testResult.result ? "TRUE - 'If True' section will execute" : "FALSE - 'If False' section will execute"}
                </p>
                <p className="text-sm mt-1">{testResult.explanation}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// Helper function to collect all question IDs used in conditions
function getAllQuestionIds(items: (LogicStatement | LogicGroup)[]): string[] {
  const ids: string[] = [];
  
  items.forEach(item => {
    if (item.type === "statement" && item.questionId) {
      ids.push(item.questionId);
    } else if (item.type === "group") {
      ids.push(...getAllQuestionIds(item.items));
    }
  });
  
  return ids;
}

