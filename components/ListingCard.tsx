import Image from "next/image";
import Link from "next/link";
import { Listing } from "@/lib/types";
import { formatRent } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function ListingCard({ listing }: { listing: Listing }) {
  const primary = listing.images[0];

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block transition-all hover:-translate-y-0.5"
    >
      <Card className="overflow-hidden border shadow-sm transition-shadow group-hover:shadow-md">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {primary ? (
            <Image
              src={primary}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          <Badge variant="secondary" className="absolute left-3 top-3">
            {listing.propertyType}
          </Badge>
          {!listing.available && (
            <Badge
              variant="secondary"
              className="absolute right-3 top-3 bg-foreground/80 text-background"
            >
              Rented
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <p className="text-lg font-bold">{formatRent(listing.price)}</p>
          <h3 className="mt-1 line-clamp-1 font-semibold group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {listing.address}
          </p>

          <div className="mt-3 flex items-center gap-4 border-t pt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span aria-hidden>🛏️</span> {listing.bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <span aria-hidden>🛁</span> {listing.bathrooms}
            </span>
            <span className="flex items-center gap-1">
              <span aria-hidden>📐</span> {listing.area.toLocaleString()} sqft
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
