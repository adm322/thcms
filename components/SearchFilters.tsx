"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PROPERTY_TYPES, PropertyType } from "@/lib/types";

export interface FilterState {
  keyword: string;
  city: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
}

export const DEFAULT_FILTERS: FilterState = {
  keyword: "",
  city: "",
  propertyType: "",
  minPrice: "",
  maxPrice: "",
  bedrooms: "",
};

interface SearchFiltersProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  cities: string[];
}

const bedroomOptions = ["1", "2", "3", "4", "5+"];

export function SearchFilters({
  filters,
  onChange,
  onReset,
  cities,
}: SearchFiltersProps) {
  function set(key: keyof FilterState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Reset
        </Button>
      </div>

      {/* Keyword */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Keyword</label>
        <Input
          value={filters.keyword}
          onChange={(e) => set("keyword", e.target.value)}
          placeholder="Title, area, amenities…"
        />
      </div>

      {/* City */}
      <div className="space-y-2">
        <label className="text-sm font-medium">City</label>
        <Select
          value={filters.city}
          onValueChange={(v) => set("city", !v || v === "all" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Property type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Property type</label>
        <Select
          value={filters.propertyType}
          onValueChange={(v) => set("propertyType", !v || v === "all" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {PROPERTY_TYPES.map((t: PropertyType) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price range */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Price range (RM)</label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            step={100}
            value={filters.minPrice}
            onChange={(e) => set("minPrice", e.target.value)}
            placeholder="Min"
          />
          <Input
            type="number"
            min={0}
            step={100}
            value={filters.maxPrice}
            onChange={(e) => set("maxPrice", e.target.value)}
            placeholder="Max"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Bedrooms</label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={filters.bedrooms === "" ? "default" : "outline"}
            size="sm"
            onClick={() => set("bedrooms", "")}
          >
            Any
          </Button>
          {bedroomOptions.map((b) => (
            <Button
              key={b}
              type="button"
              variant={filters.bedrooms === b ? "default" : "outline"}
              size="sm"
              onClick={() => set("bedrooms", b)}
            >
              {b}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
