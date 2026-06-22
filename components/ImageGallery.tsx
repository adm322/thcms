"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ImageGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        No images available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted">
        <Image
          key={active}
          src={images[active]}
          alt={`${alt} — image ${active + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto scroll-thin pb-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                i === active
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
