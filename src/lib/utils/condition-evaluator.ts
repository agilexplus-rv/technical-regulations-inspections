import { 
  Condition, 
  LogicStatement, 
  LogicGroup, 
  LogicOperator,
  AvailableQuestion
} from "@/types/conditional-logic";

/**
 * Evaluates a condition based on provided test data
 * @param condition The condition to evaluate
 * @param testData Map of questionId to answer value
 * @param availableQuestions List of questions for looking up titles
 * @returns Object with result (boolean) and explanation (string)
 */
export function evaluateCondition(
  condition: Condition, 
  testData: Record<string, any>,
  availableQuestions: AvailableQuestion[] = []
): { result: boolean; explanation: string } {
  if (condition.items.length === 0) {
    return { result: true, explanation: "No conditions set. Defaults to TRUE." };
  }

  const explanations: string[] = [];
  const results = condition.items.map(item => {
    const itemResult = evaluateItem(item, testData, explanations, availableQuestions);
    return itemResult;
  });

  const finalResult = condition.operator === "AND" 
    ? results.every(r => r) 
    : results.some(r => r);

  const operatorText = condition.operator === "AND" ? "All conditions must be true" : "At least one condition must be true";
  const explanation = `${operatorText}:\n\n${explanations.join('\n\n')}\n\n✓ Overall Result: ${finalResult ? "TRUE" : "FALSE"}`;

  return { result: finalResult, explanation };
}

function evaluateItem(
  item: LogicStatement | LogicGroup, 
  testData: Record<string, any>,
  explanations: string[],
  availableQuestions: AvailableQuestion[]
): boolean {
  if (item.type === "statement") {
    return evaluateStatement(item, testData, explanations, availableQuestions);
  } else {
    return evaluateGroup(item, testData, explanations, availableQuestions);
  }
}

function evaluateStatement(
  statement: LogicStatement, 
  testData: Record<string, any>,
  explanations: string[],
  availableQuestions: AvailableQuestion[]
): boolean {
  const questionValue = testData[statement.questionId];
  const question = availableQuestions.find(q => q.id === statement.questionId);
  const questionTitle = question?.title || "Unknown Question";
  
  let result = false;
  let comparatorText = "";

  // Handle different comparators
  switch (statement.comparator) {
    case "equals":
      result = questionValue == statement.value;
      comparatorText = "equals";
      break;
    case "not_equals":
      result = questionValue != statement.value;
      comparatorText = "does not equal";
      break;
    case "contains":
      result = String(questionValue || "").includes(String(statement.value));
      comparatorText = "contains";
      break;
    case "starts_with":
      result = String(questionValue || "").startsWith(String(statement.value));
      comparatorText = "starts with";
      break;
    case "ends_with":
      result = String(questionValue || "").endsWith(String(statement.value));
      comparatorText = "ends with";
      break;
    case "greater_than":
      result = Number(questionValue) > Number(statement.value);
      comparatorText = "is greater than";
      break;
    case "greater_than_or_equal":
      result = Number(questionValue) >= Number(statement.value);
      comparatorText = "is greater than or equal to";
      break;
    case "less_than":
      result = Number(questionValue) < Number(statement.value);
      comparatorText = "is less than";
      break;
    case "less_than_or_equal":
      result = Number(questionValue) <= Number(statement.value);
      comparatorText = "is less than or equal to";
      break;
    case "between":
      result = Number(questionValue) >= Number(statement.value) && 
               Number(questionValue) <= Number(statement.secondValue);
      comparatorText = `is between ${statement.value} and ${statement.secondValue}`;
      break;
    case "contains_all":
      // For multi-choice: check if answer contains all selected values
      const allValues = Array.isArray(statement.value) ? statement.value : [statement.value];
      const answerValues = Array.isArray(questionValue) ? questionValue : [questionValue];
      result = allValues.every(v => answerValues.includes(v));
      comparatorText = "contains all of";
      break;
    case "contains_any":
      // For multi-choice: check if answer contains any of the selected values
      const anyValues = Array.isArray(statement.value) ? statement.value : [statement.value];
      const answerVals = Array.isArray(questionValue) ? questionValue : [questionValue];
      result = anyValues.some(v => answerVals.includes(v));
      comparatorText = "contains any of";
      break;
    default:
      result = false;
      comparatorText = statement.comparator;
  }

  // Apply NOT if negated
  const originalResult = result;
  if (statement.isNegated) {
    result = !result;
  }

  // Create human-readable explanation
  const valueDisplay = statement.comparator === "between" 
    ? "" // Already included in comparatorText
    : `"${statement.value}"`;
  
  const checkMark = result ? "✓" : "✗";
  const notText = statement.isNegated ? "NOT " : "";
  
  explanations.push(
    `${checkMark} ${notText}"${questionTitle}" ${comparatorText} ${valueDisplay}\n   Your answer: "${questionValue || '(empty)'}"\n   Result: ${result ? "TRUE" : "FALSE"}${statement.isNegated ? ` (was ${originalResult}, inverted by NOT)` : ""}`
  );

  return result;
}

function evaluateGroup(
  group: LogicGroup, 
  testData: Record<string, any>,
  explanations: string[],
  availableQuestions: AvailableQuestion[]
): boolean {
  const groupExplanations: string[] = [];
  const results = group.items.map(item => evaluateItem(item, testData, groupExplanations, availableQuestions));

  let result = group.operator === "AND" 
    ? results.every(r => r) 
    : results.some(r => r);

  // Apply NOT if negated
  const originalResult = result;
  if (group.isNegated) {
    result = !result;
  }

  const checkMark = result ? "✓" : "✗";
  const operatorText = group.operator === "AND" ? "All of these must be true" : "At least one of these must be true";
  const notText = group.isNegated ? "NOT " : "";
  
  explanations.push(
    `${checkMark} ${notText}Group (${operatorText}):\n${groupExplanations.map(e => '   ' + e).join('\n')}\n   Group Result: ${result ? "TRUE" : "FALSE"}${group.isNegated ? ` (was ${originalResult}, inverted by NOT)` : ""}`
  );

  return result;
}

