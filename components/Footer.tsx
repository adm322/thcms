import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                R
              </span>
              <span className="text-base font-semibold">Rumahku</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Malaysia&apos;s friendly rental marketplace. Find a home
              you&apos;ll love, from KL to Penang to Johor.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Explore</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/listings" className="hover:text-foreground transition-colors">
                  Browse listings
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-foreground transition-colors">
                  List a property
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Popular cities</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Kuala Lumpur</li>
              <li>Penang</li>
              <li>Johor Bahru</li>
              <li>Cyberjaya</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Rumahku. Demo project · Sample data for
          illustration only.
        </div>
      </div>
    </footer>
  );
}
