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
  helperText?: string;
  inputClassName?: string;
  buttonClassName?: string;
  stacked?: boolean;
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

function getHelperColorClassName(status: NewsletterStatus) {
  if (status === "success") {
    return "text-emerald-100";
  }

  if (status === "error") {
    return "text-red-100";
  }

  return "text-cyan-50/90";
}

export function NewsletterSignupForm({
  buttonLabel,
  className = "",
  helperText,
  inputClassName = "",
  buttonClassName = "",
  stacked = false,
}: NewsletterSignupFormProps) {
  const dictionary = useDictionary();
  const initialHelperText =
    helperText || dictionary.newsletterForm.defaultHelper;
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<NewsletterStatus>("idle");
  const [message, setMessage] = useState(initialHelperText);
  const [confirmationUrl, setConfirmationUrl] = useState("");

  const resolvedFormClassName = useMemo(() => {
    if (stacked) {
      return "flex flex-col gap-3";
    }

    return "flex flex-col gap-2 sm:flex-row";
  }, [stacked]);

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
      setMessage(response?.message || dictionary.newsletterForm.successMessage);
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

  const helperColorClassName = getHelperColorClassName(status);

  return (
    <div className={className}>
      <form className={resolvedFormClassName} onSubmit={handleSubmit}>
        <input
          className={`rounded-xl border-0 px-4 py-3 text-sm text-text-main outline-none ring-0 ${inputClassName}`}
          onChange={(event) => setName(event.target.value)}
          placeholder={dictionary.newsletterForm.namePlaceholder}
          type="text"
          value={name}
        />
        <input
          className={`rounded-xl border-0 px-4 py-3 text-sm text-text-main outline-none ring-0 ${inputClassName}`}
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
            : buttonLabel || dictionary.blog.subscribe}
        </Button>
      </form>
      <p className={`mt-2 text-xs ${helperColorClassName}`}>{message}</p>
      {status === "success" && confirmationUrl ? (
        <div className="mt-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3">
          <p className="text-xs text-white/90">
            {dictionary.newsletterForm.confirmNow}
          </p>
          <Link
            className="mt-2 inline-flex text-xs font-semibold text-white underline underline-offset-4"
            href={confirmationUrl}
          >
            {dictionary.newsletterForm.openConfirmationLink}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
