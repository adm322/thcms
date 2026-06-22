"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useListings } from "@/lib/store";
import {
  FURNISHINGS,
  Furnishing,
  Listing,
  ListingInput,
  PROPERTY_TYPES,
  PropertyType,
} from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const DEFAULT_IMAGES =
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80";

export function ListingForm({
  existing,
  mode,
}: {
  existing?: Listing;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const { addListing, updateListing } = useListings();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<ListingInput>(() => ({
    title: existing?.title ?? "",
    description: existing?.description ?? "",
    price: existing?.price ?? 0,
    propertyType: existing?.propertyType ?? "Condominium",
    bedrooms: existing?.bedrooms ?? 1,
    bathrooms: existing?.bathrooms ?? 1,
    area: existing?.area ?? 0,
    furnishing: existing?.furnishing ?? "Fully Furnished",
    city: existing?.city ?? "",
    state: existing?.state ?? "",
    address: existing?.address ?? "",
    images: existing?.images ?? [DEFAULT_IMAGES],
    agent: existing?.agent ?? { name: "", phone: "", agency: "" },
    amenities: existing?.amenities ?? [],
    available: existing?.available ?? true,
  }));

  const [imagesText, setImagesText] = useState(form.images.join("\n"));
  const [amenitiesText, setAmenitiesText] = useState(form.amenities.join(", "));

  function set<K extends keyof ListingInput>(key: K, value: ListingInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    if (!form.price || form.price <= 0) next.price = "Enter a valid monthly rent.";
    if (!form.city.trim()) next.city = "City is required.";
    if (!form.state.trim()) next.state = "State is required.";
    if (!form.address.trim()) next.address = "Address is required.";
    if (!form.area || form.area <= 0) next.area = "Enter the floor area.";
    if (!form.agent.name.trim()) next.agentName = "Agent name is required.";
    if (!form.agent.phone.trim()) next.agentPhone = "Agent phone is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const finalImages = imagesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const finalAmenities = amenitiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: ListingInput = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      address: form.address.trim(),
      images: finalImages.length ? finalImages : [DEFAULT_IMAGES],
      amenities: finalAmenities,
      agent: {
        name: form.agent.name.trim(),
        phone: form.agent.phone.trim(),
        agency: form.agent.agency.trim() || "Independent",
      },
    };

    if (mode === "edit" && existing) {
      updateListing(existing.id, payload);
    } else {
      addListing(payload);
    }
    router.push("/admin");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Basics */}
      <Section title="Basics" subtitle="The essentials shown on the listing card.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Labeled label="Title" error={errors.title} className="sm:col-span-2">
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Modern Sky Apartment at KLCC"
            />
          </Labeled>

          <Labeled label="Monthly rent (RM)" error={errors.price}>
            <Input
              type="number"
              min={0}
              step={100}
              value={form.price || ""}
              onChange={(e) => set("price", Number(e.target.value))}
              placeholder="3500"
            />
          </Labeled>

          <Labeled label="Property type">
            <Select
              value={form.propertyType}
              onValueChange={(v) => set("propertyType", v as PropertyType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Labeled>

          <Labeled label="Bedrooms">
            <Input
              type="number"
              min={0}
              value={form.bedrooms}
              onChange={(e) => set("bedrooms", Number(e.target.value))}
            />
          </Labeled>

          <Labeled label="Bathrooms">
            <Input
              type="number"
              min={0}
              value={form.bathrooms}
              onChange={(e) => set("bathrooms", Number(e.target.value))}
            />
          </Labeled>

          <Labeled label="Floor area (sqft)" error={errors.area}>
            <Input
              type="number"
              min={0}
              value={form.area || ""}
              onChange={(e) => set("area", Number(e.target.value))}
              placeholder="1200"
            />
          </Labeled>

          <Labeled label="Furnishing">
            <Select
              value={form.furnishing}
              onValueChange={(v) => set("furnishing", v as Furnishing)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FURNISHINGS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Labeled>
        </div>
      </Section>

      {/* Location */}
      <Section title="Location" subtitle="Where the property is.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Labeled label="Address" error={errors.address} className="sm:col-span-2">
            <Input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Jalan Ampang, KLCC, 50088 Kuala Lumpur"
            />
          </Labeled>
          <Labeled label="City" error={errors.city}>
            <Input
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Kuala Lumpur"
            />
          </Labeled>
          <Labeled label="State" error={errors.state}>
            <Input
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              placeholder="Wilayah Persekutuan"
            />
          </Labeled>
        </div>
      </Section>

      {/* Description & media */}
      <Section title="Description & media" subtitle="Tell renters about the home.">
        <Labeled label="Description" error={errors.description}>
          <Textarea
            rows={5}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe the layout, views, facilities and nearby landmarks…"
            className="resize-none"
          />
        </Labeled>
        <Labeled
          label="Image URLs (one per line)"
          hint="Paste Unsplash or any public image URL. First image is the cover."
        >
          <Textarea
            rows={4}
            value={imagesText}
            onChange={(e) => setImagesText(e.target.value)}
            className="font-mono text-xs resize-none"
          />
        </Labeled>
        <Labeled
          label="Amenities (comma-separated)"
          hint="e.g. Pool, Gym, Parking"
        >
          <Input
            value={amenitiesText}
            onChange={(e) => setAmenitiesText(e.target.value)}
            placeholder="Swimming Pool, Gymnasium, 24h Security"
          />
        </Labeled>
      </Section>

      {/* Agent */}
      <Section title="Listing agent" subtitle="Who renters should contact.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Labeled label="Agent name" error={errors.agentName}>
            <Input
              value={form.agent.name}
              onChange={(e) =>
                set("agent", { ...form.agent, name: e.target.value })
              }
              placeholder="Nurul Aina"
            />
          </Labeled>
          <Labeled label="Phone" error={errors.agentPhone}>
            <Input
              value={form.agent.phone}
              onChange={(e) =>
                set("agent", { ...form.agent, phone: e.target.value })
              }
              placeholder="+60 12-345 6789"
            />
          </Labeled>
          <Labeled label="Agency">
            <Input
              value={form.agent.agency}
              onChange={(e) =>
                set("agent", { ...form.agent, agency: e.target.value })
              }
              placeholder="KL Prime Realty"
            />
          </Labeled>
        </div>
      </Section>

      {/* Availability */}
      <Section title="Status">
        <label className="flex items-center gap-3">
          <Checkbox
            checked={form.available}
            onCheckedChange={(c) => set("available", Boolean(c))}
          />
          <span className="text-sm">
            Available for rent (shown as bookable on the listing)
          </span>
        </label>
      </Section>

      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin")}
        >
          Cancel
        </Button>
        <Button type="submit">
          {mode === "edit" ? "Save changes" : "Publish listing"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-6">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Labeled({
  label,
  hint,
  error,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && !error && (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      )}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}
