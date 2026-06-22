import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Activity Catalog ────────────────────────────────────
interface Activity {
  id: string;
  name: string;
  category: "Adventure" | "Indoor" | "Creative" | "Social" | "Problem Solving";
  description: string;
  durationHours: number;
  difficulty: 1 | 2 | 3 | 4 | 5; // 1=easy, 5=extreme
  minAge: number;
  maxAge: number;
  recommendedAges: string; // e.g. "25-45"
  minPax: number;
  maxPax: number;
  pricePerPax: number;
  locationType: "indoor" | "outdoor" | "both";
  icon: string;
  tags: string[];
}

const ACTIVITIES: Activity[] = [
  { id: "obstacle", name: "Obstacle Course Challenge", category: "Adventure", description: "Military-style obstacle course testing endurance, teamwork, and problem-solving under pressure.", durationHours: 4, difficulty: 4, minAge: 18, maxAge: 50, recommendedAges: "20-40", minPax: 10, maxPax: 40, pricePerPax: 180, locationType: "outdoor", icon: "🏃", tags: ["physical", "competitive", "teamwork"] },
  { id: "rafting", name: "White Water Rafting Expedition", category: "Adventure", description: "Navigate Class II-III rapids as a team. Includes safety briefing, equipment, and professional guides.", durationHours: 6, difficulty: 4, minAge: 16, maxAge: 55, recommendedAges: "18-45", minPax: 6, maxPax: 30, pricePerPax: 250, locationType: "outdoor", icon: "🚣", tags: ["physical", "adrenaline", "trust"] },
  { id: "hiking", name: "Nature Trail & Summit Challenge", category: "Adventure", description: "Guided jungle trek with team checkpoints. Moderate terrain suitable for most fitness levels.", durationHours: 5, difficulty: 3, minAge: 12, maxAge: 65, recommendedAges: "16-55", minPax: 8, maxPax: 40, pricePerPax: 120, locationType: "outdoor", icon: "🥾", tags: ["nature", "moderate", "inclusive"] },
  { id: "escape", name: "Escape Room Showdown", category: "Problem Solving", description: "Multiple themed escape rooms. Teams compete to solve puzzles and 'escape' fastest.", durationHours: 3, difficulty: 2, minAge: 12, maxAge: 70, recommendedAges: "All ages", minPax: 4, maxPax: 50, pricePerPax: 95, locationType: "indoor", icon: "🔐", tags: ["mental", "collaborative", "accessible"] },
  { id: "lego", name: "LEGO® Serious Play Workshop", category: "Creative", description: "Facilitated workshop using LEGO bricks to explore strategy, communication, and creative problem-solving.", durationHours: 4, difficulty: 1, minAge: 18, maxAge: 70, recommendedAges: "All adults", minPax: 6, maxPax: 30, pricePerPax: 200, locationType: "indoor", icon: "🧱", tags: ["creative", "strategic", "inclusive"] },
  { id: "cooking", name: "MasterChef Team Cook-Off", category: "Social", description: "Teams compete in a professional kitchen. Includes chef instructor, ingredients, and tasting judging.", durationHours: 4, difficulty: 1, minAge: 16, maxAge: 75, recommendedAges: "All ages", minPax: 8, maxPax: 40, pricePerPax: 160, locationType: "indoor", icon: "👨‍🍳", tags: ["social", "creative", "inclusive"] },
  { id: "paintball", name: "Tactical Paintball Battle", category: "Adventure", description: "Strategic team paintball with multiple game modes: capture the flag, elimination, VIP protection.", durationHours: 4, difficulty: 3, minAge: 16, maxAge: 55, recommendedAges: "18-50", minPax: 10, maxPax: 40, pricePerPax: 150, locationType: "outdoor", icon: "🔫", tags: ["physical", "strategy", "competitive"] },
  { id: "beach", name: "Beach Olympics & BBQ", category: "Social", description: "Fun beach games (volleyball, frisbee, tug-of-war) followed by BBQ dinner by the sea.", durationHours: 6, difficulty: 2, minAge: 10, maxAge: 70, recommendedAges: "All ages", minPax: 15, maxPax: 80, pricePerPax: 135, locationType: "outdoor", icon: "🏖️", tags: ["social", "fun", "inclusive", "food"] },
  { id: "csr", name: "CSR Community Build", category: "Creative", description: "Build homes, plant trees, or renovate community spaces. Meaningful team building with social impact.", durationHours: 8, difficulty: 3, minAge: 16, maxAge: 70, recommendedAges: "18-65", minPax: 15, maxPax: 60, pricePerPax: 100, locationType: "outdoor", icon: "🏗️", tags: ["meaningful", "community", "inclusive"] },
  { id: "drama", name: "Improv Theatre & Sketch Comedy", category: "Creative", description: "Professional actors guide your team through improv exercises, ending with a hilarious team performance.", durationHours: 3, difficulty: 1, minAge: 18, maxAge: 70, recommendedAges: "All adults", minPax: 8, maxPax: 30, pricePerPax: 140, locationType: "indoor", icon: "🎭", tags: ["creative", "fun", "inclusive", "communication"] },
  { id: "drone", name: "Drone Racing & Tech Challenge", category: "Problem Solving", description: "Build and race drones through obstacle courses. Combines STEM skills with exciting competition.", durationHours: 5, difficulty: 2, minAge: 14, maxAge: 65, recommendedAges: "16-50", minPax: 8, maxPax: 24, pricePerPax: 280, locationType: "both", icon: "🚁", tags: ["tech", "competitive", "modern"] },
  { id: "survival", name: "Wilderness Survival Skills", category: "Adventure", description: "Learn bushcraft, fire-making, shelter building, and navigation. Ultimate outdoor team bonding.", durationHours: 8, difficulty: 4, minAge: 16, maxAge: 60, recommendedAges: "18-50", minPax: 8, maxPax: 25, pricePerPax: 220, locationType: "outdoor", icon: "🏕️", tags: ["outdoor", "skills", "adventure"] },
];

// ─── Venue Catalog ──────────────────────────────────────
interface Venue {
  id: string;
  name: string;
  address: string;
  state: string;
  lat: number;
  lng: number;
  type: "resort" | "hotel" | "outdoor_centre" | "conference";
  hasAccommodation: boolean;
  accommodationRate: number; // per pax per night
  maxCapacity: number;
  features: string[];
}

const VENUES: Venue[] = [
  { id: "portdickson", name: "Avillion Port Dickson", address: "Batu 3, Jalan Pantai, Port Dickson", state: "Negeri Sembilan", lat: 2.5228, lng: 101.7957, type: "resort", hasAccommodation: true, accommodationRate: 180, maxCapacity: 200, features: ["Beachfront", "Pool", "Team building facilities", "6 meeting rooms"] },
  { id: "genting", name: "Resorts World Genting", address: "Genting Highlands, Pahang", state: "Pahang", lat: 3.4244, lng: 101.7950, type: "resort", hasAccommodation: true, accommodationRate: 250, maxCapacity: 500, features: ["Cool climate", "Indoor theme park", "Convention centre", "Multiple F&B outlets"] },
  { id: "fraser", name: "The Pines at Fraser's Hill", address: "Jalan Lady Guillemard, Fraser's Hill", state: "Pahang", lat: 3.7119, lng: 101.7365, type: "resort", hasAccommodation: true, accommodationRate: 200, maxCapacity: 120, features: ["Cool highland climate", "Nature trails", "Golf course", "Conference rooms"] },
  { id: "cyberjaya", name: "Cyberview Resort & Spa", address: "Persiaran Multimedia, Cyberjaya", state: "Selangor", lat: 2.9188, lng: 101.6530, type: "resort", hasAccommodation: true, accommodationRate: 220, maxCapacity: 150, features: ["Spa", "Pool", "Tennis courts", "4 meeting rooms"] },
  { id: "shahalam", name: "Taman Botani Negara Shah Alam", address: "Bukit Cahaya Seri Alam, Shah Alam", state: "Selangor", lat: 3.0958, lng: 101.5107, type: "outdoor_centre", hasAccommodation: false, accommodationRate: 0, maxCapacity: 300, features: ["300+ acres park", "Cycling trails", "SkyTrek adventure", "Camping ground"] },
  { id: "frrm", name: "Forest Research Institute Malaysia (FRIM)", address: "Jalan FRIM, Kepong, Selangor", state: "Selangor", lat: 3.2363, lng: 101.6339, type: "outdoor_centre", hasAccommodation: false, accommodationRate: 0, maxCapacity: 150, features: ["Canopy walkway", "Waterfalls", "Nature trails", "Research facilities"] },
  { id: "klcc", name: "KLCC Convention Centre", address: "Kuala Lumpur City Centre", state: "Kuala Lumpur", lat: 3.1535, lng: 101.7135, type: "conference", hasAccommodation: false, accommodationRate: 0, maxCapacity: 1000, features: ["Central location", "5-star facilities", "Skybridge view", "Multiple halls"] },
  { id: "penang", name: "Hard Rock Hotel Penang", address: "Batu Ferringhi Beach, Penang", state: "Penang", lat: 5.4740, lng: 100.2470, type: "hotel", hasAccommodation: true, accommodationRate: 260, maxCapacity: 200, features: ["Beachfront", "Pool", "Live music venue", "Team activities"] },
  { id: "langkawi", name: "Berjaya Langkawi Resort", address: "Burau Bay, Langkawi", state: "Kedah", lat: 6.3500, lng: 99.7500, type: "resort", hasAccommodation: true, accommodationRate: 300, maxCapacity: 250, features: ["Rainforest setting", "Private beach", "Jungle trekking", "Water sports"] },
  { id: "johor", name: "Legoland Malaysia Resort", address: "Nusajaya, Johor", state: "Johor", lat: 1.4250, lng: 103.6300, type: "resort", hasAccommodation: true, accommodationRate: 280, maxCapacity: 300, features: ["Theme park", "Water park", "Team packages", "Hotel attached"] },
];

// ─── API Endpoint ───────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "HR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const list = searchParams.get("list") === "true";

  // List HR's own submissions
  if (list) {
    const submissions = await prisma.teamBuildingRequest.findMany({
      where: { hrId: session.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json(submissions);
  }

  // Return full catalog
  return NextResponse.json({
    activities: ACTIVITIES,
    venues: VENUES,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action } = body;

  // ─── Analyze team suitability ────────────────────────
  if (action === "analyze") {
    const { activityId, employees } = body;
    const activity = ACTIVITIES.find(a => a.id === activityId);
    if (!activity) return NextResponse.json({ error: "Activity not found" }, { status: 400 });

    // Fetch actual employee ages if employee IDs provided
    let ages: number[] = [];
    if (employees && Array.isArray(employees)) {
      // Use provided employee data (age, department)
      ages = employees.map((e: any) => e.age).filter(Boolean);
    } else {
      // Fetch from company employees
      const emps = await prisma.employee.findMany({
        where: { companyId: session.companyId },
        select: { name: true, dateJoined: true },
      });
      // Approximate age from dateJoined (assume joined at ~25 years old)
      ages = emps.map(e => {
        if (!e.dateJoined) return 30;
        const joined = new Date(e.dateJoined);
        const yearsSince = (new Date().getFullYear() - joined.getFullYear());
        return 25 + yearsSince;
      });
    }

    if (ages.length === 0) {
      return NextResponse.json({ error: "No employee data available" }, { status: 400 });
    }

    const avgAge = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    const ageRange = `${minAge}-${maxAge}`;
    
    // Suitability scoring
    const ageInRange = avgAge >= activity.minAge && avgAge <= activity.maxAge;
    const allCanJoin = minAge >= activity.minAge && maxAge <= activity.maxAge;
    const percentCanJoin = Math.round(ages.filter(a => a >= activity.minAge && a <= activity.maxAge).length / ages.length * 100);
    
    const riskFactors: string[] = [];
    if (activity.difficulty >= 4 && avgAge > 45) riskFactors.push("High-difficulty activity for mature team — consider medium-intensity alternative");
    if (activity.difficulty >= 4 && maxAge > 55) riskFactors.push(`${maxAge - activity.maxAge}+ year-old participants above recommended age`);
    if (!allCanJoin) riskFactors.push(`${100 - percentCanJoin}% of team outside recommended age range`);
    if (activity.difficulty >= 3 && avgAge > 50) riskFactors.push("Team average age may find this physically challenging");
    
    const score = ageInRange ? (allCanJoin ? 95 : Math.min(90, 50 + percentCanJoin / 2)) : Math.min(40, percentCanJoin);
    
    return NextResponse.json({
      activity,
      teamAnalysis: {
        employeeCount: ages.length,
        avgAge,
        ageRange,
        minAge,
        maxAge,
        percentCanJoin,
        allCanJoin,
        suitabilityScore: score,
        rating: score >= 85 ? "Excellent Fit" : score >= 65 ? "Good Fit" : score >= 45 ? "Moderate Fit" : "Low Suitability",
        riskFactors,
      },
    });
  }

  // ─── Calculate costs ──────────────────────────────────
  if (action === "calculate") {
    const { activityId, venueId, participants, accommodation, days } = body;
    const activity = ACTIVITIES.find(a => a.id === activityId);
    const venue = VENUES.find(v => v.id === venueId);
    if (!activity || !venue) return NextResponse.json({ error: "Invalid activity or venue" }, { status: 400 });

    const pax = Math.max(activity.minPax, Math.min(activity.maxPax, participants || activity.minPax));
    const activityCost = activity.pricePerPax * pax;
    const accommodationCost = (accommodation && venue.hasAccommodation) ? venue.accommodationRate * pax * (days || 1) : 0;
    const totalCost = activityCost + accommodationCost;

    // HRDF Estimate
    const hrdfTrainerFee = 150 * activity.durationHours;
    const hrdfMeals = 45 * pax * Math.ceil(activity.durationHours / 8);
    const hrdfMaterials = 50 * pax;
    const hrdfVenue = venue.type === "conference" ? 2000 : venue.type === "resort" ? 1500 : 800;
    const hrdfClaimable = hrdfTrainerFee + hrdfMeals + hrdfMaterials + hrdfVenue;

    return NextResponse.json({
      activity,
      venue,
      costs: { activityCost, accommodationCost, totalCost, perPax: Math.round(totalCost / pax), pax },
      hrdf: { trainerFee: hrdfTrainerFee, meals: hrdfMeals, materials: hrdfMaterials, venue: hrdfVenue, totalClaimable: hrdfClaimable },
    });
  }

  // ─── Submit request for admin approval ─────────────────
  if (action === "submit") {
    const { eventName, hqLocation, teamSize, avgAge, ageMin, ageMax,
      activityId, activityName, activityCategory,
      venueId, venueName, venueAddress,
      startDate, isConsecutive, batchCount,
      activityCost, accommodationCost, totalCost, hrdfClaimable } = body;

    if (!activityId || !venueId || !startDate) {
      return NextResponse.json({ error: "activityId, venueId, startDate required" }, { status: 400 });
    }

    const req = await prisma.teamBuildingRequest.create({
      data: {
        hrId: session.id!,
        companyId: session.companyId!,
        eventName: eventName || null,
        hqLocation: hqLocation || "",
        teamSize: teamSize || 0,
        avgAge: avgAge || 0,
        ageMin: ageMin || 0,
        ageMax: ageMax || 0,
        activityId, activityName: activityName || "", activityCategory: activityCategory || "",
        venueId, venueName: venueName || "", venueAddress: venueAddress || "",
        startDate: new Date(startDate),
        isConsecutive: isConsecutive || false,
        batchCount: batchCount || 1,
        activityCost: activityCost || 0,
        accommodationCost: accommodationCost || 0,
        totalCost: totalCost || 0,
        hrdfClaimable: hrdfClaimable || 0,
        status: "SUBMITTED",
      },
    });

    return NextResponse.json(req, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
