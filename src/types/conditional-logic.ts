import { QuestionType } from "./index";

// Comparator types for different question types
export type TextComparator = "equals" | "not_equals" | "contains" | "starts_with" | "ends_with";
export type NumberComparator = "equals" | "not_equals" | "greater_than" | "greater_than_or_equal" | "less_than" | "less_than_or_equal" | "between";
export type BooleanComparator = "equals";
export type ChoiceComparator = "equals" | "contains_all" | "contains_any";

export type Comparator = TextComparator | NumberComparator | BooleanComparator | ChoiceComparator;

// Logic operator types
export type LogicOperator = "AND" | "OR";

// Single logic statement that compares a question's answer
export interface LogicStatement {
  id: string;
  type: "statement";
  questionId: string; // Reference to the question being evaluated
  questionType: QuestionType; // Type of the question (for determining valid comparators)
  comparator: Comparator;
  value: any; // The value to compare against (string, number, boolean, or array for choices)
  secondValue?: any; // For "between" comparator
  isNegated?: boolean; // If true, wraps the statement in NOT
}

// Group of logic statements or other groups
export interface LogicGroup {
  id: string;
  type: "group";
  operator: LogicOperator; // AND or OR between items in this group
  items: (LogicStatement | LogicGroup)[]; // Can contain statements or nested groups
  isNegated?: boolean; // If true, wraps the entire group in NOT
  nestingLevel: number; // 0 for top level, 1 for first nested level, 2 for second nested level (max)
}

// Root condition structure
export interface Condition {
  id: string;
  operator: LogicOperator; // Top-level operator (AND or OR)
  items: (LogicStatement | LogicGroup)[]; // Can contain statements or groups
}

// New action block structure for conditional content
export interface NewActionBlock {
  id: string;
  type: "action";
  actionBlockType: string;
  title: string;
  description: string;
  questions: any[];
  blockSettings?: any;
}

// New conditional block structure for conditional content
export interface NewConditionalBlock {
  id: string;
  type: "conditional";
  title: string;
  description: string;
  questions: any[];
  conditionalData: ConditionalBlockData;
}

// New question structure for conditional content
export interface NewQuestion {
  id: string;
  type: string;
  title: string;
  description: string;
  required: boolean;
  enforceable: boolean;
  legislationId: string;
  articleNumber: string;
  photosAllowed?: boolean;
  filesAllowed?: boolean;
  options?: any[];
  validation?: any;
  legalRefs?: any[];
}

// Conditional block content - what to execute if condition is true or false
export interface ConditionalContent {
  // Can reference existing blocks/questions (by ID) or contain new ones
  existingBlockIds?: string[];
  existingQuestionIds?: string[];
  newBlocks?: (NewActionBlock | NewConditionalBlock)[]; // New blocks to create if condition matches
  newQuestions?: NewQuestion[]; // New questions to create if condition matches
}

// Complete conditional block structure
export interface ConditionalBlockData {
  id: string;
  title: string;
  description?: string;
  condition: Condition;
  ifTrue: ConditionalContent;
  ifFalse: ConditionalContent;
  testData?: Record<string, any>; // Test values for preview/testing the condition
}

// Helper type to identify all available questions for condition building
export interface AvailableQuestion {
  id: string;
  blockId: string;
  blockTitle: string;
  blockIndex: number;
  title: string;
  type: QuestionType;
  isFromCurrentBlock: boolean; // Can't reference questions from the same block
}

