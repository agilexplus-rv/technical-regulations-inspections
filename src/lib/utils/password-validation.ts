/**
 * Password validation utility for enforcing strong password policies
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number; // 0-100 password strength score
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

// Default password requirements
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Validates password against strong password policy
 * @param password - The password to validate
 * @param requirements - Password requirements (optional, uses defaults if not provided)
 * @returns PasswordValidationResult with validation status and details
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  } else {
    score += 20; // Length contributes to score
  }

  // Uppercase check
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else if (requirements.requireUppercase) {
    score += 20;
  }

  // Lowercase check
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else if (requirements.requireLowercase) {
    score += 20;
  }

  // Number check
  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  } else if (requirements.requireNumbers) {
    score += 20;
  }

  // Special character check
  if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;':\",./<>?)");
  } else if (requirements.requireSpecialChars) {
    score += 20;
  }

  // Additional security checks
  if (password.length > requirements.minLength) {
    score += Math.min(10, (password.length - requirements.minLength) * 2); // Bonus for longer passwords
  }

  // Check for common patterns (weak passwords)
  if (isCommonPassword(password)) {
    errors.push("Password is too common and easily guessable");
    score = Math.max(0, score - 30);
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push("Password should not contain more than 2 consecutive identical characters");
    score = Math.max(0, score - 10);
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(100, Math.max(0, score)),
  };
}

/**
 * Checks if password is a common/weak password
 * @param password - The password to check
 * @returns true if password is common/weak
 */
function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', 'password123', '123456', '123456789', 'qwerty', 'abc123',
    'password1', 'admin', 'letmein', 'welcome', 'monkey', '1234567890',
    'dragon', 'master', 'hello', 'login', 'princess', 'rockyou',
    'shadow', 'sunshine', 'superman', 'trustno1', 'password12'
  ];

  const lowerPassword = password.toLowerCase();
  return commonPasswords.some(common => lowerPassword.includes(common));
}

/**
 * Gets password strength description based on score
 * @param score - Password strength score (0-100)
 * @returns Human-readable strength description
 */
export function getPasswordStrengthDescription(score: number): string {
  if (score < 30) return "Very Weak";
  if (score < 50) return "Weak";
  if (score < 70) return "Fair";
  if (score < 85) return "Good";
  return "Strong";
}

/**
 * Gets password strength color for UI
 * @param score - Password strength score (0-100)
 * @returns Tailwind CSS color class
 */
export function getPasswordStrengthColor(score: number): string {
  if (score < 30) return "text-red-500";
  if (score < 50) return "text-orange-500";
  if (score < 70) return "text-yellow-500";
  if (score < 85) return "text-blue-500";
  return "text-green-500";
}

/**
 * Validates password on the server side (for API routes)
 * @param password - The password to validate
 * @param requirements - Password requirements (optional)
 * @throws Error if password is invalid
 */
export function validatePasswordServerSide(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): void {
  const result = validatePassword(password, requirements);
  
  if (!result.isValid) {
    throw new Error(`Password validation failed: ${result.errors.join(', ')}`);
  }
}

/**
 * Password validation hook for React components
 * Returns real-time validation as user types
 */
export function usePasswordValidation(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
) {
  const validation = validatePassword(password, requirements);
  
  return {
    ...validation,
    strengthDescription: getPasswordStrengthDescription(validation.score),
    strengthColor: getPasswordStrengthColor(validation.score),
    hasLength: password.length >= requirements.minLength,
    hasUppercase: !requirements.requireUppercase || /[A-Z]/.test(password),
    hasLowercase: !requirements.requireLowercase || /[a-z]/.test(password),
    hasNumbers: !requirements.requireNumbers || /\d/.test(password),
    hasSpecialChars: !requirements.requireSpecialChars || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}
