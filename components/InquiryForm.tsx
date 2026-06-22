"use client";

import { useState } from "react";
import { useListings } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface InquiryFormProps {
  listingId?: string;
  listingTitle?: string;
  heading?: string;
}

export function InquiryForm({
  listingId,
  listingTitle,
  heading = "Enquire about this property",
}: InquiryFormProps) {
  const { addInquiry } = useListings();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(
    listingTitle
      ? `Hi, I'm interested in "${listingTitle}". Is it available for viewing?`
      : ""
  );
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email.";
    if (!phone.trim()) next.phone = "Please enter your phone number.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    addInquiry({
      listingId,
      listingTitle,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      message: message.trim(),
    });
    setSubmitted(true);
    setName("");
    setEmail("");
    setPhone("");
    setMessage(
      listingTitle
        ? `Hi, I'm interested in "${listingTitle}". Is it available for viewing?`
        : ""
    );
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
          ✓
        </div>
        <h3 className="mt-3 font-semibold text-emerald-900">Inquiry sent!</h3>
        <p className="mt-1 text-sm text-emerald-700">
          The agent will get back to you shortly.
        </p>
        <Button
          variant="link"
          onClick={() => setSubmitted(false)}
          className="mt-2 text-emerald-700"
        >
          Send another inquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <h3 className="text-base font-semibold">{heading}</h3>

      <Field label="Full name" error={errors.name}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
        />
      </Field>

      <Field label="Email" error={errors.email}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
        />
      </Field>

      <Field label="Phone" error={errors.phone}>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+60 12-345 6789"
        />
      </Field>

      <Field label="Message">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Your message"
          className="resize-none"
        />
      </Field>

      <Button type="submit" className="w-full">
        Send inquiry
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}
