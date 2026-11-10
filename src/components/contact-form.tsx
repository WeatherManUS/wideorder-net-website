"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ContactField } from "@/content/home";
import {
  CONTACT_ERROR_MESSAGE,
  CONTACT_SECURITY_MESSAGE,
  CONTACT_SUCCESS_MESSAGE,
  type ContactFieldErrors,
} from "@/lib/contact";

type ContactFormProps = {
  fields: readonly ContactField[];
  messageLabel: string;
  helperText: string;
  exampleText: string;
  privacyText: string;
  submitLabel: string;
};

type SubmissionState = "idle" | "submitting" | "success" | "error";
type ThemeMode = "light" | "dark";

type ContactApiErrorCode =
  | "invalid_request"
  | "validation_error"
  | "security_verification_failed"
  | "service_unavailable"
  | "delivery_failed"
  | "rate_limited"
  | "method_not_allowed";

type ContactApiResponse =
  | { ok: true }
  | {
      ok: false;
      error: ContactApiErrorCode;
      fieldErrors?: ContactFieldErrors;
      message?: string;
    };

type ContactConfigResponse = {
  turnstileSiteKey: string;
};

type TurnstileInstanceId = string | number;

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: ThemeMode;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => TurnstileInstanceId;
  reset: (widgetId?: TurnstileInstanceId) => void;
  remove: (widgetId?: TurnstileInstanceId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const MEDIA_QUERY = "(prefers-color-scheme: dark)";
const CONTACT_CONFIGURATION_MESSAGE = "The contact form is not fully configured right now. Please try again later.";
const CONTACT_RATE_LIMIT_MESSAGE = "Too many attempts were received from this connection. Please wait a little and try again.";

const getResolvedTheme = (): ThemeMode => {
  const explicitTheme = document.documentElement.getAttribute("data-theme");

  if (explicitTheme === "light" || explicitTheme === "option3-light") {
    return "light";
  }
  if (explicitTheme === "dark" || explicitTheme === "option3-dark") {
    return "dark";
  }

  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
};

export function ContactForm({ fields, messageLabel, helperText, exampleText, privacyText, submitLabel }: ContactFormProps) {
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileSiteKey, setTurnstileSiteKey] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<TurnstileInstanceId | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MEDIA_QUERY);

    const syncTheme = () => {
      setTheme(getResolvedTheme());
    };

    syncTheme();

    const observer = new MutationObserver(() => syncTheme());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const handleSystemThemeChange = () => syncTheme();

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const response = await fetch("/api/contact-config", { cache: "no-store" });
        const result = (await response.json()) as ContactConfigResponse;

        if (!cancelled) {
          setTurnstileSiteKey(result.turnstileSiteKey ?? "");
        }
      } catch {
        if (!cancelled) {
          setTurnstileSiteKey("");
        }
      }
    };

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors((current) => {
      if (!(fieldName in current)) {
        return current;
      }

      const next = { ...current };
      delete next[fieldName as keyof ContactFieldErrors];
      return next;
    });
  }, []);

  const resetTurnstile = useCallback(() => {
    if (turnstileWidgetIdRef.current !== null) {
      window.turnstile?.reset(turnstileWidgetIdRef.current);
    }

    setTurnstileToken("");
    clearFieldError("turnstileToken");
  }, [clearFieldError]);

  const renderTurnstile = useCallback(() => {
    if (!turnstileSiteKey || !turnstileContainerRef.current || !window.turnstile) {
      return;
    }

    if (turnstileWidgetIdRef.current !== null) {
      window.turnstile.remove(turnstileWidgetIdRef.current);
      turnstileWidgetIdRef.current = null;
    }

    turnstileContainerRef.current.innerHTML = "";

    turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: turnstileSiteKey,
      theme: getResolvedTheme() ?? theme,
      callback: (token) => {
        setTurnstileToken(token);
        clearFieldError("turnstileToken");
      },
      "expired-callback": () => {
        setTurnstileToken("");
      },
      "error-callback": () => {
        setTurnstileToken("");
        setFieldErrors((current) => ({ ...current, turnstileToken: CONTACT_SECURITY_MESSAGE }));
      },
    });
  }, [clearFieldError, theme, turnstileSiteKey]);

  useEffect(() => {
    renderTurnstile();

    return () => {
      if (turnstileWidgetIdRef.current !== null) {
        window.turnstile?.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [renderTurnstile]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;

    if (!form.reportValidity()) {
      return;
    }

    if (submissionState === "submitting") {
      return;
    }

    if (turnstileSiteKey && !turnstileToken) {
      setSubmissionState("error");
      setStatusMessage(CONTACT_SECURITY_MESSAGE);
      setFieldErrors((current) => ({ ...current, turnstileToken: CONTACT_SECURITY_MESSAGE }));
      return;
    }

    const formData = new FormData(form);

    setSubmissionState("submitting");
    setStatusMessage("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name") ?? "",
          company: formData.get("company") ?? "",
          email: formData.get("email") ?? "",
          phone: formData.get("phone") ?? "",
          message: formData.get("message") ?? "",
          website: formData.get("website") ?? "",
          turnstileToken,
        }),
      });

      const result = (await response.json().catch(() => ({ ok: false, error: "delivery_failed" }))) as ContactApiResponse;

      if (result.ok) {
        formRef.current?.reset();
        resetTurnstile();
        setSubmissionState("success");
        setStatusMessage(CONTACT_SUCCESS_MESSAGE);
        return;
      }

      if (result.error === "validation_error") {
        setSubmissionState("error");
        setStatusMessage("Please correct the highlighted fields and try again.");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      if (result.error === "security_verification_failed") {
        setSubmissionState("error");
        setStatusMessage(CONTACT_SECURITY_MESSAGE);
        setFieldErrors((current) => ({
          ...current,
          turnstileToken: result.fieldErrors?.turnstileToken ?? CONTACT_SECURITY_MESSAGE,
        }));
        resetTurnstile();
        return;
      }

      if (result.error === "service_unavailable") {
        setSubmissionState("error");
        setStatusMessage(result.message ?? CONTACT_CONFIGURATION_MESSAGE);
        return;
      }

      if (result.error === "rate_limited") {
        setSubmissionState("error");
        setStatusMessage(result.message ?? CONTACT_RATE_LIMIT_MESSAGE);
        return;
      }

      setSubmissionState("error");
      setStatusMessage(result.message ?? CONTACT_ERROR_MESSAGE);
    } catch {
      setSubmissionState("error");
      setStatusMessage(CONTACT_ERROR_MESSAGE);
    }
  };

  const getFieldDescribedBy = (fieldName: keyof ContactFieldErrors, baseIds: string[] = []) => {
    const ids = [...baseIds];

    if (fieldErrors[fieldName]) {
      ids.push(`${fieldName}-error`);
    }

    return ids.length > 0 ? ids.join(" ") : undefined;
  };

  return (
    <>
      {turnstileSiteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => renderTurnstile()}
        />
      ) : null}
      <form ref={formRef} className="contact-form" aria-busy={submissionState === "submitting"} onSubmit={handleSubmit}>
        <div className="contact-form__grid">
          {fields.map((field) => (
            <div key={field.name} className="form-field">
              <label className="form-label" htmlFor={field.name}>
                {field.label}
              </label>
              <input
                className="form-input"
                id={field.name}
                name={field.name}
                type={field.type ?? "text"}
                autoComplete={field.autoComplete}
                required={field.required}
                maxLength={field.name === "name" ? 120 : field.name === "company" ? 160 : field.name === "email" ? 254 : 50}
                aria-invalid={fieldErrors[field.name as keyof ContactFieldErrors] ? true : undefined}
                aria-describedby={getFieldDescribedBy(field.name as keyof ContactFieldErrors)}
                onChange={() => clearFieldError(field.name)}
              />
              {fieldErrors[field.name as keyof ContactFieldErrors] ? (
                <p id={`${field.name}-error`} className="form-error">
                  {fieldErrors[field.name as keyof ContactFieldErrors]}
                </p>
              ) : null}
            </div>
          ))}
          <div className="form-field form-field--hidden" aria-hidden="true">
            <input tabIndex={-1} autoComplete="off" id="website" name="website" type="text" />
          </div>
          <div className="form-field form-field--full">
            <label className="form-label" htmlFor="message">
              {messageLabel}
            </label>
            <p id="message-helper" className="form-helper">
              {helperText}
            </p>
            <textarea
              className="form-input form-input--textarea"
              id="message"
              name="message"
              required
              rows={6}
              maxLength={5000}
              placeholder={exampleText}
              aria-invalid={fieldErrors.message ? true : undefined}
              aria-describedby={getFieldDescribedBy("message", ["message-helper", "contact-privacy"])}
              onChange={() => clearFieldError("message")}
            />
            {fieldErrors.message ? (
              <p id="message-error" className="form-error">
                {fieldErrors.message}
              </p>
            ) : null}
          </div>
        </div>
        {turnstileSiteKey || fieldErrors.turnstileToken ? (
          <div className="contact-form__turnstile-wrap">
            <div ref={turnstileContainerRef} className="contact-form__turnstile" />
            {fieldErrors.turnstileToken ? (
              <p id="turnstile-error" className="form-error">
                {fieldErrors.turnstileToken}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="form-actions">
          <div>
            <p id="contact-privacy" className="form-privacy">
              {privacyText}
            </p>
            <p className="form-status" data-state={submissionState} aria-live="polite" aria-atomic="true">
              {submissionState === "submitting" ? "Sending..." : statusMessage}
            </p>
          </div>
          <button className="button button--primary form-submit" type="submit" disabled={submissionState === "submitting"}>
            {submissionState === "submitting" ? "Sending..." : submitLabel}
          </button>
        </div>
      </form>
    </>
  );
}
