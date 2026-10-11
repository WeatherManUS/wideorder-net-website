export type ContactFieldName = "name" | "company" | "email" | "phone" | "message" | "turnstileToken";

export type ContactSubmission = {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  website: string;
  turnstileToken: string;
};

export type ContactFieldErrors = Partial<Record<ContactFieldName, string>>;

export const CONTACT_SUCCESS_MESSAGE = "Thank you. Your message has been sent.";
export const CONTACT_ERROR_MESSAGE = "We couldn't send your message. Please try again.";
export const CONTACT_SECURITY_MESSAGE = "We couldn't verify your submission. Please try again.";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const limits = {
  name: 120,
  company: 160,
  email: 254,
  phone: 50,
  message: 5000,
} as const;

const getString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function validateContactSubmission(payload: unknown): {
  data: ContactSubmission | null;
  fieldErrors: ContactFieldErrors;
} {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      data: null,
      fieldErrors: {
        name: "Enter your name.",
        email: "Enter your email address.",
        message: "Enter a short description of what's taking your time.",
      },
    };
  }

  const record = payload as Record<string, unknown>;
  const data: ContactSubmission = {
    name: getString(record.name),
    company: getString(record.company),
    email: getString(record.email),
    phone: getString(record.phone),
    message: getString(record.message),
    website: getString(record.website),
    turnstileToken: getString(record.turnstileToken),
  };

  const fieldErrors: ContactFieldErrors = {};

  if (data.name.length < 1 || data.name.length > limits.name) {
    fieldErrors.name = "Enter a name between 1 and 120 characters.";
  }

  if (data.company.length > limits.company) {
    fieldErrors.company = "Company must be 160 characters or fewer.";
  }

  if (data.email.length < 1) {
    fieldErrors.email = "Enter your email address.";
  } else if (data.email.length > limits.email || !EMAIL_PATTERN.test(data.email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (data.phone.length > limits.phone) {
    fieldErrors.phone = "Phone must be 50 characters or fewer.";
  }

  if (data.message.length < 1) {
    fieldErrors.message = "Enter a short description of what's taking your time.";
  } else if (data.message.length > limits.message) {
    fieldErrors.message = "Message must be 5000 characters or fewer.";
  }

  return {
    data: Object.keys(fieldErrors).length > 0 ? null : data,
    fieldErrors,
  };
}
