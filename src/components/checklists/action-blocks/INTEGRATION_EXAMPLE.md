# Integration Example: Adding Action Block Types to Checklist Builder

This document shows how to integrate the action block components into the existing checklist builder.

## Step 1: Update the Block Interface

First, update the `QuestionBlock` interface in `checklist-builder.tsx` to include the action block type:

```typescript
interface QuestionBlock {
  id: string;
  type: "action" | "conditional";
  actionBlockType?: ActionBlockType; // Add this field
  title: string;
  description?: string;
  questions: QuestionFormData[];
}
```

## Step 2: Import the Components

Add the import at the top of `checklist-builder.tsx`:

```typescript
import { ActionBlockSelector, ActionBlockType } from "./action-blocks";
```

## Step 3: Update the addBlock Function

Modify the `addBlock` function to set a default action block type:

```typescript
const addBlock = (type: BlockType) => {
  const newBlock: QuestionBlock = {
    id: `block${Date.now()}`,
    type,
    actionBlockType: type === "action" ? "product" : undefined, // Add this
    title: type === "action" ? "Action Block" : "Conditional Block",
    description: type === "action" ? "Questions that require immediate action" : "Questions that depend on conditions",
    questions: [],
  };
  setBlocks([...blocks, newBlock]);
};
```

## Step 4: Replace the Action Block Questions UI

In the block rendering section (around line 531), replace the questions rendering for action blocks with the ActionBlockSelector:

### Before (for action blocks):
```typescript
{block.questions.map((question, questionIndex) => (
  // ... question rendering code
))}
```

### After (for action blocks):
```typescript
{block.type === "action" ? (
  <ActionBlockSelector
    blockType={block.actionBlockType || "product"}
    questions={block.questions}
    onChange={(blockType, questions) => {
      updateBlock(block.id, { 
        actionBlockType: blockType, 
        questions: questions 
      });
    }}
  />
) : (
  // Keep the existing questions rendering for conditional blocks
  block.questions.map((question, questionIndex) => (
    // ... existing question rendering code
  ))
)}
```

## Step 5: Update the Block Title/Description Section

Add a selector for the action block type in the block header section:

```typescript
{/* Block Title/Description Edit */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {block.type === "action" && (
    <div>
      <Label>Action Block Type</Label>
      <Select
        value={block.actionBlockType || "product"}
        onValueChange={(value) => 
          updateBlock(block.id, { actionBlockType: value as ActionBlockType })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="product">Product</SelectItem>
          <SelectItem value="product_details">Product Details</SelectItem>
          <SelectItem value="economic_operator">Economic Operator</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )}
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
```

## Step 6: Update the Preview Mode

Update the preview rendering to show the action block type:

```typescript
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
        {block.type === "action" && block.actionBlockType && (
          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
            {block.actionBlockType.replace(/_/g, " ")}
          </span>
        )}
      </h3>
      {/* ... rest of preview code */}
    </div>
  </div>
))}
```

## Complete Example Snippet

Here's a complete example of how the block rendering might look:

```typescript
{blocks.map((block) => (
  <Card key={block.id} className="p-4">
    <div className="space-y-4">
      {/* Block Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-blue-600" />
          <div>
            <h4 className="font-medium flex items-center gap-2">
              {block.title}
              <span className={`text-xs px-2 py-1 rounded ${
                block.type === "action" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-blue-100 text-blue-800"
              }`}>
                {block.type === "action" ? "Action" : "Conditional"}
              </span>
            </h4>
            <p className="text-sm text-muted-foreground">{block.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {block.type === "conditional" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => addQuestion(block.id)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Question
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => removeBlock(block.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Block Configuration */}
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

      {/* Questions/Content */}
      {block.type === "action" ? (
        <div className="border-t pt-4">
          <ActionBlockSelector
            blockType={block.actionBlockType || "product"}
            questions={block.questions}
            onChange={(blockType, questions) => {
              updateBlock(block.id, { 
                actionBlockType: blockType, 
                questions: questions 
              });
            }}
          />
        </div>
      ) : (
        // Conditional block questions (keep existing implementation)
        <div>
          {block.questions.map((question, questionIndex) => (
            // ... existing conditional block question rendering
          ))}
        </div>
      )}
    </div>
  </Card>
))}
```

## Using Action Blocks in Conditional Blocks

To nest action blocks inside conditional blocks (for the "if condition is true" scenario):

```typescript
// Inside a conditional block's configuration
<div className="border-l-4 border-green-200 pl-4 py-2">
  <h5 className="font-medium text-sm mb-2">If condition is TRUE, show:</h5>
  <ActionBlockSelector
    blockType="product_details"
    questions={conditionalBlock.trueQuestions}
    onChange={(blockType, questions) => {
      updateBlock(block.id, { 
        trueActionBlockType: blockType,
        trueQuestions: questions 
      });
    }}
  />
</div>
```

## Benefits of This Approach

1. **Reusability**: Action block components can be used in both action blocks and conditional blocks
2. **Consistency**: Each action block type has predefined questions that ensure consistency
3. **Flexibility**: Users can still customize questions within each block type
4. **Visual Distinction**: Each block type has its own color theme for easy identification
5. **Modularity**: New action block types can be easily added by creating new components


