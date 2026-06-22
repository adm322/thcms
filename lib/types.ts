export type PropertyType =
  | "Condominium"
  | "Apartment"
  | "Terrace House"
  | "Bungalow"
  | "Townhouse"
  | "Soho";

export type Furnishing = "Fully Furnished" | "Partly Furnished" | "Unfurnished";

export const PROPERTY_TYPES: PropertyType[] = [
  "Condominium",
  "Apartment",
  "Terrace House",
  "Bungalow",
  "Townhouse",
  "Soho",
];

export const FURNISHINGS: Furnishing[] = [
  "Fully Furnished",
  "Partly Furnished",
  "Unfurnished",
];

export interface Agent {
  name: string;
  phone: string;
  agency: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  /** Monthly rent in MYR */
  price: number;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  /** Floor area in square feet */
  area: number;
  furnishing: Furnishing;
  city: string;
  state: string;
  address: string;
  images: string[];
  agent: Agent;
  amenities: string[];
  available: boolean;
  createdAt: string; // ISO date
}

export interface Inquiry {
  id: string;
  listingId?: string;
  listingTitle?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  date: string; // ISO date
}

/** Shape used by create/edit form, before id/createdAt is assigned */
export type ListingInput = Omit<Listing, "id" | "createdAt">;
