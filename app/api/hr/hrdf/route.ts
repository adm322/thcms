import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// HRDF Allowable Cost Matrix (ACM) rates — Malaysia 2025/2026
const HRDF_RATES = {
  // Trainer fees (per hour)
  trainer: {
    internal: 120,      // Internal trainer max RM 120/hr
    external: 350,      // External trainer/consultant max RM 350/hr
    consultant: 500,    // Specialist consultant max RM 500/hr
  },

  // Meals per participant per day
  meals: {
    fullDay: 45,        // Full day (6-8 hours)
    halfDay: 25,        // Half day (3-5 hours)
  },

  // Course materials/consumables per participant per day
  materials: {
    maxPerPaxPerDay: 50,  // RM 50/pax/day
    maxTotal: 5000,       // RM 5,000 total cap
  },

  // Venue/training room per day
  venue: {
    ownPremises: 0,       // No claim if own premises
    externalBasic: 800,   // External basic training room
    hotel: 2000,          // Hotel/conference room
    maxPerDay: 3000,      // Absolute max per day
  },

  // Distance allowance
  distance: {
    carPerKm: 0.70,       // RM 0.70/km personal car
    bikePerKm: 0.50,      // RM 0.50/km motorcycle
    maxKmPerDay: 100,     // Max claimable 100km/day (round trip)
    thresholdKm: 20,      // Free for < 20km from workplace
  },

  // Accommodation (per person per night)
  accommodation: {
    local: 150,           // Within same state max RM 150/night
    outstation: 250,      // Different state max RM 250/night
    maxNights: 3,         // Max 3 nights per training
  },

  // Equipment rental per day
  equipment: {
    maxPerDay: 500,
    maxTotal: 2000,
  },

  // Stationery per participant per day
  stationery: {
    maxPerPaxPerDay: 15,
  },

  // Sundries per participant per day
  sundries: {
    maxPerPaxPerDay: 10,
  },
};

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "HR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "calculate") {
    return calculateClaimable(searchParams);
  }

  return NextResponse.json({ rates: HRDF_RATES });
}

function calculateClaimable(searchParams: URLSearchParams) {
  const participants = Math.max(1, parseInt(searchParams.get("participants") || "10"));
  const durationDays = Math.max(0.5, parseFloat(searchParams.get("days") || "1"));
  const durationHours = parseFloat(searchParams.get("hours") || String(durationDays * 8));
  const isFullDay = durationHours >= 6;
  const trainerType = searchParams.get("trainer") || "external";
  const venueType = searchParams.get("venue") || "externalBasic";
  const distanceKm = Math.max(0, parseInt(searchParams.get("distance") || "0"));
  const hasAccommodation = searchParams.get("accommodation") === "true";
  const accommodationType = searchParams.get("accommodationType") || "local";
  const accommodationNights = Math.min(HRDF_RATES.accommodation.maxNights, parseInt(searchParams.get("nights") || "0"));
  const hasEquipment = searchParams.get("equipment") === "true";
  const equipmentDays = parseInt(searchParams.get("equipmentDays") || "0");

  // ─── Calculations ───

  // 1. Trainer Fees
  const trainerRate = HRDF_RATES.trainer[trainerType as keyof typeof HRDF_RATES.trainer] || HRDF_RATES.trainer.external;
  const trainerFee = Math.round(trainerRate * durationHours);

  // 2. Meals
  const mealRate = isFullDay ? HRDF_RATES.meals.fullDay : HRDF_RATES.meals.halfDay;
  const mealCost = Math.round(mealRate * participants * Math.ceil(durationDays));

  // 3. Course Materials
  const materialCost = Math.round(Math.min(
    HRDF_RATES.materials.maxTotal,
    HRDF_RATES.materials.maxPerPaxPerDay * participants * Math.ceil(durationDays)
  ));

  // 4. Venue
  const venueCost = venueType === "ownPremises" ? 0 :
    Math.round(HRDF_RATES.venue[venueType as keyof typeof HRDF_RATES.venue] * Math.ceil(durationDays));

  // 5. Distance/Mileage
  const effectiveDistance = Math.max(0, distanceKm - HRDF_RATES.distance.thresholdKm);
  const cappedDistance = Math.min(HRDF_RATES.distance.maxKmPerDay, effectiveDistance);
  const distanceCost = Math.round(cappedDistance * HRDF_RATES.distance.carPerKm);

  // 6. Accommodation
  const accommodationRate = HRDF_RATES.accommodation[accommodationType as keyof typeof HRDF_RATES.accommodation] || HRDF_RATES.accommodation.local;
  const accommodationCost = hasAccommodation ? Math.round(accommodationRate * participants * Math.min(accommodationNights, HRDF_RATES.accommodation.maxNights)) : 0;

  // 7. Equipment
  const equipmentCost = hasEquipment ? Math.round(Math.min(HRDF_RATES.equipment.maxTotal, HRDF_RATES.equipment.maxPerDay * equipmentDays)) : 0;

  // 8. Stationery + Sundries
  const stationeryCost = Math.round(HRDF_RATES.stationery.maxPerPaxPerDay * participants * Math.ceil(durationDays));
  const sundriesCost = Math.round(HRDF_RATES.sundries.maxPerPaxPerDay * participants * Math.ceil(durationDays));

  // ─── Totals ───
  const totalClaimable = trainerFee + mealCost + materialCost + venueCost + distanceCost + accommodationCost + equipmentCost + stationeryCost + sundriesCost;
  const costPerPax = Math.round(totalClaimable / participants);

  return NextResponse.json({
    breakdown: {
      trainerFee: { amount: trainerFee, note: `${trainerType} trainer @ RM ${trainerRate}/hr × ${durationHours}h` },
      meals: { amount: mealCost, note: `${isFullDay ? "Full" : "Half"} day @ RM ${mealRate}/pax × ${participants} pax × ${Math.ceil(durationDays)} days` },
      materials: { amount: materialCost, note: `RM ${HRDF_RATES.materials.maxPerPaxPerDay}/pax/day (max RM ${HRDF_RATES.materials.maxTotal})` },
      venue: { amount: venueCost, note: venueType === "ownPremises" ? "Own premises — no claim" : `${venueType} venue @ RM ${HRDF_RATES.venue[venueType as keyof typeof HRDF_RATES.venue]}/day × ${Math.ceil(durationDays)} days` },
      distance: { amount: distanceCost, note: `${effectiveDistance}km claimable (${cappedDistance}km capped) @ RM ${HRDF_RATES.distance.carPerKm}/km` },
      accommodation: { amount: accommodationCost, note: hasAccommodation ? `${accommodationType} @ RM ${accommodationRate}/night × ${participants} pax × ${accommodationNights} nights` : "Not claimed" },
      equipment: { amount: equipmentCost, note: hasEquipment ? `Equipment rental (max RM ${HRDF_RATES.equipment.maxTotal})` : "Not claimed" },
      stationery: { amount: stationeryCost, note: `RM ${HRDF_RATES.stationery.maxPerPaxPerDay}/pax/day` },
      sundries: { amount: sundriesCost, note: `RM ${HRDF_RATES.sundries.maxPerPaxPerDay}/pax/day` },
    },
    totalClaimable,
    costPerPax,
    perDay: Math.round(totalClaimable / Math.ceil(durationDays)),
    participants,
    durationDays,
  });
}
