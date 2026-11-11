"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { interests, siteConfig, type Interest } from "@/lib/site-config";
import {
  deliverEnquiry,
  prepareEnquiry,
  validateEnquiry,
  type Enquiry,
  type EnquiryErrors,
} from "@/lib/enquiry";
import { Arrow, CopyIcon } from "./icons";
import Link from "next/link";
import { useEnquiry } from "./enquiry-provider";

const descriptions: Record<Interest, string> = {
  ai: "What’s the task, where does the information live, and what would a useful result look like?",
  learning:
    "Which subject interests you, where are you starting, and what would you like help with?",
  hiring:
    "What are you building? Tell us the role, skills, location or time zone, and likely engagement.",
  developer:
    "Tell us about your skills, experience, availability and the kind of work you’re interested in.",
};

export function EnquiryForm() {
  const {
    interest,
    setInterest: onInterest,
    draft: fields,
    setDraft: setFields,
  } = useEnquiry();
  const values: Enquiry = { ...fields, interest };
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);
  const [prepared, setPrepared] = useState("");
  const [manualCopy, setManualCopy] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const preparedField = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    setErrors((current) => ({ ...current, interest: undefined }));
    setStatus("");
    setPrepared("");
  }, [interest]);
  useEffect(() => {
    if (manualCopy && prepared) {
      preparedField.current?.focus();
      preparedField.current?.select();
    }
  }, [manualCopy, prepared]);

  const update = (field: keyof Omit<Enquiry, "interest">, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setStatus("");
    setPrepared("");
    setFailed(false);
  };

  const submit = async (
    event: FormEvent<HTMLFormElement>,
    copyOnly = false,
  ) => {
    event.preventDefault();
    const nextErrors = validateEnquiry(values);
    setErrors(nextErrors);
    setStatus("");
    setFailed(false);
    setManualCopy(false);
    if (Object.keys(nextErrors).length) {
      form.current
        ?.querySelector<HTMLElement>(`[name="${Object.keys(nextErrors)[0]}"]`)
        ?.focus();
      return;
    }
    setBusy(true);
    const message = prepareEnquiry(values);
    try {
      if (siteConfig.enquiryEndpoint && !copyOnly) {
        await deliverEnquiry(siteConfig.enquiryEndpoint, values);
        setStatus(
          "Your enquiry has been delivered. Thank you for sharing what you’d like to build.",
        );
      } else {
        setPrepared(message);
        try {
          if (!navigator.clipboard?.writeText)
            throw new Error("Clipboard unavailable");
          await navigator.clipboard.writeText(message);
          setStatus(
            "Enquiry copied to your clipboard. It hasn’t been sent. You can also select the message below.",
          );
        } catch {
          setManualCopy(true);
          setStatus(
            "Your enquiry is ready below. Automatic copying wasn’t available. Select the message and copy it manually; it hasn’t been sent.",
          );
        }
      }
    } catch (error) {
      setFailed(true);
      setStatus(
        error instanceof Error
          ? error.message
          : "Delivery couldn’t be confirmed. Your details are still here. Please try again or copy your enquiry.",
      );
    } finally {
      setBusy(false);
    }
  };

  const error = (field: keyof Enquiry) =>
    errors[field] ? (
      <span id={`${field}-error`} className="field-error">
        {errors[field]}
      </span>
    ) : null;
  return (
    <form
      ref={form}
      className="enquiry-form"
      noValidate
      onSubmit={submit}
      aria-busy={busy}
    >
      <p className="form-note">
        A few details are enough to start.{" "}
        <span>Fields marked * are required.</span>
      </p>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">Your name *</label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            maxLength={100}
            placeholder="First and last name"
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {error("name")}
        </div>
        <div className="field">
          <label htmlFor="email">Email address *</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@company.com"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {error("email")}
        </div>
        <div className="field field-wide">
          <label htmlFor="interest">What would you like to build? *</label>
          <select
            id="interest"
            name="interest"
            required
            value={values.interest}
            onChange={(e) => onInterest(e.target.value as Interest)}
            aria-invalid={!!errors.interest}
            aria-describedby={errors.interest ? "interest-error" : undefined}
          >
            {interests.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          {error("interest")}
        </div>
        <div className="field field-wide">
          <label htmlFor="description">Tell us a little about it *</label>
          <p className="field-hint" id="description-hint">
            {descriptions[interest]}
          </p>
          <textarea
            id="description"
            name="description"
            rows={4}
            required
            maxLength={3000}
            placeholder="A short description of your goal…"
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            aria-invalid={!!errors.description}
            aria-describedby={`description-hint${errors.description ? " description-error" : ""}`}
          />
          {error("description")}
        </div>
        <div className="field">
          <label htmlFor="company">
            Company <span>(optional)</span>
          </label>
          <input
            id="company"
            name="company"
            autoComplete="organization"
            maxLength={150}
            value={values.company}
            onChange={(e) => update("company", e.target.value)}
            aria-invalid={!!errors.company}
            aria-describedby={errors.company ? "company-error" : undefined}
          />
          {error("company")}
        </div>
        <div className="field">
          <label htmlFor="links">
            Relevant links <span>(optional)</span>
          </label>
          <input
            id="links"
            name="links"
            inputMode="url"
            maxLength={1000}
            placeholder="https://…"
            value={values.links}
            onChange={(e) => update("links", e.target.value)}
            aria-invalid={!!errors.links}
            aria-describedby={errors.links ? "links-error" : undefined}
          />
          {error("links")}
        </div>
      </div>
      <div className="form-submit">
        <button className="button" type="submit" disabled={busy}>
          {busy
            ? siteConfig.enquiryEndpoint
              ? "Sending…"
              : "Preparing…"
            : siteConfig.enquiryEndpoint
              ? "Send enquiry"
              : "Copy enquiry"}
          {siteConfig.enquiryEndpoint ? <Arrow diagonal /> : <CopyIcon />}
        </button>
        <p>
          {siteConfig.enquiryEndpoint
            ? "We’ll use these details to respond to your enquiry."
            : "Copies a message for you to share. Your details stay in this tab; they aren’t sent to BuildMyX."}
        </p>
      </div>
      <p className="form-privacy">
        <Link href="/privacy/">
          How your enquiry details are handled <Arrow diagonal />
        </Link>
      </p>
      {status && (
        <p
          className={failed ? "form-status status-error" : "form-status"}
          role={failed ? "alert" : "status"}
        >
          {status}
        </p>
      )}
      {failed && (
        <button
          className="text-link"
          type="button"
          disabled={busy}
          onClick={(event) =>
            void submit(event as unknown as FormEvent<HTMLFormElement>, true)
          }
        >
          Copy enquiry instead <CopyIcon />
        </button>
      )}
      {prepared && (
        <div className="prepared-message">
          <label htmlFor="prepared-message">Your prepared enquiry</label>
          <textarea
            ref={preparedField}
            id="prepared-message"
            readOnly
            rows={9}
            value={prepared}
            onFocus={(event) => event.currentTarget.select()}
          />
          <p>
            Copy this message into your preferred email or messaging app. It has
            not been delivered to BuildMyX.
          </p>
        </div>
      )}
    </form>
  );
}
