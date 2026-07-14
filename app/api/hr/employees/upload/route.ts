import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { employees } = body || {};

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
    } catch (err) {
      console.error(`Employee bulk import failed for ${validEmployees.length} records:`, err);
      errors += validEmployees.length;
    }
  }

  return NextResponse.json({ imported, errors });
}
