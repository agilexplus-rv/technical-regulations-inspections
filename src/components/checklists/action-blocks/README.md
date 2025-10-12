# Action Block Components

This directory contains modular action block components for the checklist builder. These components can be used standalone or nested within Conditional Blocks.

## Available Action Block Types

### 1. Product Block (`ProductBlock`)
Questions about the product itself.

**Default Questions:**
- Product Name (text, required)
- Product Model/Type (text, required)
- Product Category (single choice, required)
- CE marking presence (boolean, required)
- Product Photo (photo, required)

**Color Theme:** Blue

### 2. Product Details Block (`ProductDetailsBlock`)
Detailed product identification data.

**Default Questions:**
- Product Barcode/EAN (barcode)
- Product Label Text Recognition (OCR)
- Batch/Lot Number (text)
- Serial Number (text)
- Product Label Photo (photo)
- Country of Origin (text)

**Color Theme:** Purple

### 3. Economic Operator Block (`EconomicOperatorBlock`)
Questions about manufacturer, importer, distributor, or others in the supply chain.

**Default Questions:**
- Economic Operator Type (single choice: manufacturer/importer/distributor/authorized rep, required)
- Operator Name (text, required)
- Business Address (text, required)
- Country (text, required)
- Contact Email (text)
- Contact Phone (text)
- Company Registration Number (text)
- Operator information visibility (boolean, required)
- Operator Information Photo (photo)

**Color Theme:** Amber

### 4. Custom Block (`CustomBlock`)
Create your own custom questions from scratch.

**Default Questions:** None (starts empty)

**Color Theme:** Gray

## Usage

### Basic Usage with ActionBlockSelector

```tsx
import { ActionBlockSelector } from "@/components/checklists/action-blocks";

function MyComponent() {
  const [blockType, setBlockType] = useState("product");
  const [questions, setQuestions] = useState([]);

  const handleChange = (type, questions) => {
    setBlockType(type);
    setQuestions(questions);
  };

  return (
    <ActionBlockSelector
      blockType={blockType}
      questions={questions}
      onChange={handleChange}
    />
  );
}
```

### Using Individual Block Components

```tsx
import { ProductBlock } from "@/components/checklists/action-blocks";

function MyComponent() {
  const [questions, setQuestions] = useState([]);

  return (
    <ProductBlock
      questions={questions}
      onChange={setQuestions}
    />
  );
}
```

### Read-Only Mode

```tsx
<ActionBlockSelector
  blockType="product"
  questions={existingQuestions}
  readOnly={true}
/>
```

### In Conditional Blocks

These components are designed to be nestable within Conditional Blocks:

```tsx
// Inside a Conditional Block's "then" clause
{conditionMet && (
  <ActionBlockSelector
    blockType="product_details"
    questions={conditionalQuestions}
    onChange={handleConditionalChange}
  />
)}
```

## Component Props

### ActionBlockSelector

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `blockType` | `ActionBlockType` | `"product"` | The type of action block to display |
| `questions` | `any[]` | `[]` | Array of question objects |
| `onChange` | `(blockType, questions) => void` | - | Callback when block type or questions change |
| `onBlockTypeChange` | `(blockType) => void` | - | Callback when only block type changes |
| `readOnly` | `boolean` | `false` | If true, disables editing |

### Individual Block Components (ProductBlock, ProductDetailsBlock, EconomicOperatorBlock, CustomBlock)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `questions` | `Question[]` | default questions | Array of question objects |
| `onChange` | `(questions) => void` | - | Callback when questions change |
| `readOnly` | `boolean` | `false` | If true, disables editing |

## Question Object Structure

```typescript
interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[];
}

type QuestionType = 
  | "text" 
  | "boolean" 
  | "single_choice" 
  | "multi_choice" 
  | "photo" 
  | "number" 
  | "barcode" 
  | "ocr";

interface QuestionOption {
  id: string;
  label: string;
  value: string;
}
```

## Styling

Each block type has its own color theme for visual distinction:

- **Product**: Blue border and background (`border-blue-300`, `bg-blue-50/50`)
- **Product Details**: Purple border and background (`border-purple-300`, `bg-purple-50/50`)
- **Economic Operator**: Amber border and background (`border-amber-300`, `bg-amber-50/50`)
- **Custom**: Gray border and background (`border-gray-300`, `bg-gray-50/50`)

## Integration with Checklist Builder

To integrate with the main checklist builder, update the block structure to include an `actionBlockType` field:

```typescript
interface QuestionBlock {
  id: string;
  type: "action" | "conditional";
  actionBlockType?: ActionBlockType; // For action blocks
  title: string;
  description?: string;
  questions: QuestionFormData[];
}
```

Then in the checklist builder, render the appropriate action block based on the `actionBlockType` field when `type === "action"`.


