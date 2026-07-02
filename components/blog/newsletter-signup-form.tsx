"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDictionary } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { trackNewsletterSubscribe } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type NewsletterSignupFormProps = {
  buttonLabel?: string;
  className?: string;
  formClassName?: string;
  helperText?: string;
  inputClassName?: string;
  buttonClassName?: string;
  stacked?: boolean;
  tone?: "gradient" | "surface";
};

type NewsletterStatus = "idle" | "success" | "error";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (
    typeof error !== "object" ||
    error === null ||
    !("response" in error) ||
    typeof error.response !== "object" ||
    error.response === null ||
    !("data" in error.response) ||
    typeof error.response.data !== "object" ||
    error.response.data === null ||
    !("message" in error.response.data) ||
    typeof error.response.data.message !== "string"
  ) {
    return fallbackMessage;
  }

  return error.response.data.message;
}

function getHelperColorClassName(
  status: NewsletterStatus,
  tone: NewsletterSignupFormProps["tone"],
) {
  if (status === "success") {
    return tone === "surface" ? "text-emerald-600" : "text-emerald-100";
  }

  if (status === "error") {
    return tone === "surface" ? "text-red-600" : "text-red-100";
  }

  return tone === "surface" ? "theme-muted" : "text-cyan-50/90";
}

export function NewsletterSignupForm({
  buttonLabel,
  className = "",
  formClassName,
  helperText,
  inputClassName = "",
  buttonClassName = "",
  stacked = false,
  tone = "gradient",
}: Readonly<NewsletterSignupFormProps>) {
  const dictionary = useDictionary();
  const initialHelperText =
    helperText ?? dictionary.newsletterForm.defaultHelper;
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<NewsletterStatus>("idle");
  const [message, setMessage] = useState(initialHelperText);
  const [confirmationUrl, setConfirmationUrl] = useState("");

  const resolvedFormClassName = useMemo(() => {
    if (formClassName) {
      return formClassName;
    }

    if (stacked) {
      return "flex flex-col gap-3";
    }

    return "flex flex-col gap-2 sm:flex-row";
  }, [formClassName, stacked]);

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setStatus("error");
      setMessage(dictionary.newsletterForm.missingEmail);
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("idle");
      setMessage(dictionary.newsletterForm.submittingMessage);

      const response = await apiClient.post<{
        message?: string;
        data?: {
          confirmationToken?: string | null;
        };
      }>("/api/v1/subscribers", {
        email: email.trim(),
        name: name.trim() || undefined,
      });

      const nextConfirmationUrl = response?.data?.confirmationToken
        ? `/newsletter/confirm?token=${encodeURIComponent(response.data.confirmationToken)}`
        : "";

      setStatus("success");
      setMessage(response?.message ?? dictionary.newsletterForm.successMessage);
      setConfirmationUrl(nextConfirmationUrl);
      trackNewsletterSubscribe("newsletter_form");
      setEmail("");
      setName("");
    } catch (error: unknown) {
      const fallbackMessage = dictionary.newsletterForm.errorMessage;
      const errorMessage = getErrorMessage(error, fallbackMessage);

      setStatus("error");
      setMessage(errorMessage);
      setConfirmationUrl("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const helperColorClassName = getHelperColorClassName(status, tone);

  return (
    <div className={className}>
      <form className={resolvedFormClassName} onSubmit={handleSubmit}>
        <input
          className={cn(
            "min-w-0 rounded-xl border border-transparent bg-white px-4 py-3 text-sm text-text-main outline-none ring-0 transition-colors placeholder:text-text-sub focus:border-primary/40",
            inputClassName,
          )}
          onChange={(event) => setName(event.target.value)}
          placeholder={dictionary.newsletterForm.namePlaceholder}
          type="text"
          value={name}
        />
        <input
          className={cn(
            "min-w-0 rounded-xl border border-transparent bg-white px-4 py-3 text-sm text-text-main outline-none ring-0 transition-colors placeholder:text-text-sub focus:border-primary/40",
            inputClassName,
          )}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={dictionary.newsletterForm.emailPlaceholder}
          required
          type="email"
          value={email}
        />
        <Button
          className={cn("rounded-xl px-6", buttonClassName)}
          disabled={isSubmitting}
          loading={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? dictionary.newsletterForm.submitting
            : (buttonLabel ?? dictionary.blog.subscribe)}
        </Button>
      </form>
      <p className={`mt-2 text-xs ${helperColorClassName}`}>{message}</p>
      {status === "success" && confirmationUrl ? (
        <div
          className={cn(
            "mt-3 rounded-xl border px-4 py-3",
            tone === "surface"
              ? "border-primary/15 bg-primary/5"
              : "border-white/15 bg-white/10",
          )}
        >
          <p
            className={cn(
              "text-xs",
              tone === "surface"
                ? "text-[color:var(--text-muted-theme)]"
                : "text-white/90",
            )}
          >
            {dictionary.newsletterForm.confirmNow}
          </p>
          <Link
            className={cn(
              "mt-2 inline-flex text-xs font-semibold underline underline-offset-4",
              tone === "surface" ? "text-primary" : "text-white",
            )}
            href={confirmationUrl}
          >
            {dictionary.newsletterForm.openConfirmationLink}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
