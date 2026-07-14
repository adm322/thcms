/**
 * /m/participant/bookings/[id] — Redirect to the canonical mobile class detail page.
 *
 * Both /m/participant/bookings/[id] and /m/participant/class/[id] resolve the same
 * booking detail. This stub keeps old links working by redirecting to the canonical route.
 */

import { redirect } from "next/navigation";

export default async function BookingRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/m/participant/class/${id}`);
}
