import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/hr/employees
 *
 * Adds an employee to the HR's own company roster.
 * Body: { name, email?, phone?, icNumber?, department?, position?, dateJoined?, employmentType? }
 * Returns the created employee (no User account — purely roster entry).
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: unknown; email?: unknown; phone?: unknown; icNumber?: unknown;
    department?: unknown; position?: unknown; dateJoined?: unknown;
    employmentType?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name           = typeof body.name === "string" ? body.name.trim() : "";
  const email          = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
  const phone          = typeof body.phone === "string" ? body.phone.trim() : null;
  const icNumber       = typeof body.icNumber === "string" ? body.icNumber.trim() : null;
  const department     = typeof body.department === "string" ? body.department.trim() : null;
  const position       = typeof body.position === "string" ? body.position.trim() : null;
  const dateJoinedRaw  = typeof body.dateJoined === "string" ? body.dateJoined : null;
  const dateJoined     = dateJoinedRaw ? new Date(dateJoinedRaw) : null;
  const employmentType = typeof body.employmentType === "string"
    && ["PERMANENT", "CONTRACT", "PART_TIME", "INTERN", "PROBATION"].includes(body.employmentType)
    ? body.employmentType
    : "PERMANENT";

  if (name.length < 2) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (phone && !/^\+?[\d\s\-()]{7,20}$/.test(phone)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }
  if (dateJoined && Number.isNaN(dateJoined.getTime())) {
    return NextResponse.json({ error: "Invalid dateJoined" }, { status: 400 });
  }

  try {
    const employee = await prisma.employee.create({
      data: {
        companyId:      session.companyId,
        name,
        email:          email || null,
        phone:          phone || null,
        icNumber:       icNumber || null,
        department:     department || null,
        position:       position || null,
        dateJoined:     dateJoined,
        employmentType,
        status:         "ACTIVE",
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("[hr/employees] Failed to create employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const skip = (page - 1) * limit;

  try {
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: { companyId: session.companyId },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.employee.count({
        where: { companyId: session.companyId },
      }),
    ]);

    return NextResponse.json({
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[hr/employees] Failed to fetch employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}
