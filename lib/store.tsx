"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Inquiry, Listing, ListingInput } from "./types";
import { SEED_LISTINGS } from "./seedData";

const LISTINGS_KEY = "realestate_listings";
const INQUIRIES_KEY = "realestate_inquiries";

interface ListingsContextValue {
  listings: Listing[];
  inquiries: Inquiry[];
  hydrated: boolean;
  getListing: (id: string) => Listing | undefined;
  addListing: (input: ListingInput) => Listing;
  updateListing: (id: string, input: ListingInput) => void;
  deleteListing: (id: string) => void;
  addInquiry: (inquiry: Omit<Inquiry, "id" | "date">) => void;
  resetToSeed: () => void;
}

const ListingsContext = createContext<ListingsContextValue | null>(null);

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readJson<Listing[]>(LISTINGS_KEY);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      setListings(stored);
    } else {
      setListings(SEED_LISTINGS);
      writeJson(LISTINGS_KEY, SEED_LISTINGS);
    }
    setInquiries(readJson<Inquiry[]>(INQUIRIES_KEY) ?? []);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeJson(LISTINGS_KEY, listings);
  }, [listings, hydrated]);

  useEffect(() => {
    if (hydrated) writeJson(INQUIRIES_KEY, inquiries);
  }, [inquiries, hydrated]);

  const getListing = useCallback(
    (id: string) => listings.find((l) => l.id === id),
    [listings]
  );

  const addListing = useCallback((input: ListingInput): Listing => {
    const listing: Listing = {
      ...input,
      id: makeId("lst"),
      createdAt: new Date().toISOString(),
    };
    setListings((prev) => [listing, ...prev]);
    return listing;
  }, []);

  const updateListing = useCallback(
    (id: string, input: ListingInput) => {
      setListings((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, ...input, id, createdAt: l.createdAt } : l
        )
      );
    },
    []
  );

  const deleteListing = useCallback((id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const addInquiry = useCallback(
    (inquiry: Omit<Inquiry, "id" | "date">) => {
      const full: Inquiry = {
        ...inquiry,
        id: makeId("inq"),
        date: new Date().toISOString(),
      };
      setInquiries((prev) => [full, ...prev]);
    },
    []
  );

  const resetToSeed = useCallback(() => {
    setListings(SEED_LISTINGS);
  }, []);

  const value = useMemo<ListingsContextValue>(
    () => ({
      listings,
      inquiries,
      hydrated,
      getListing,
      addListing,
      updateListing,
      deleteListing,
      addInquiry,
      resetToSeed,
    }),
    [
      listings,
      inquiries,
      hydrated,
      getListing,
      addListing,
      updateListing,
      deleteListing,
      addInquiry,
      resetToSeed,
    ]
  );

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
}

export function useListings(): ListingsContextValue {
  const ctx = useContext(ListingsContext);
  if (!ctx) {
    throw new Error("useListings must be used within a <ListingsProvider>");
  }
  return ctx;
}
