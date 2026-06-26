import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const { employees } = (body || {}) as { employees: string[][] };

  if (!employees || !Array.isArray(employees)) {
    return NextResponse.json({ error: "employees array is required" }, { status: 400 });
  }

  let imported = 0;
  let errors = 0;

  const validEmployees = [];

  for (const row of employees) {
    const [name, icNumber, email, department, position] = row;
    if (!name) { errors++; continue; }

    validEmployees.push({
      companyId: session.companyId,
      name,
      icNumber: icNumber || null,
      email: email || null,
      department: department || null,
      position: position || null,
      employmentType: "PERMANENT",
      status: "ACTIVE",
    });
  }

  if (validEmployees.length > 0) {
    try {
      const result = await prisma.employee.createMany({
        data: validEmployees,
      });
      imported += result.count;
    } catch {
      errors += validEmployees.length;
    }
  }

  return NextResponse.json({ imported, errors });
}
