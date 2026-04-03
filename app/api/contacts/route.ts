import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  const where = {
    userId: session.user.id,
    ...(search && {
      OR: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ],
    }),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      skip,
      take: limit,
    }),
    prisma.contact.count({ where }),
  ]);

  return NextResponse.json({ contacts, total, page, limit });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { firstName, lastName, email, phone, company, jobTitle, notes } =
    body as Record<string, unknown>;

  if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
    return NextResponse.json(
      { error: "First name is required" },
      { status: 400 }
    );
  }

  for (const [field, value] of Object.entries({
    lastName,
    email,
    phone,
    company,
    jobTitle,
    notes,
  })) {
    if (value !== undefined && typeof value !== "string") {
      return NextResponse.json(
        { error: `${field} must be a string` },
        { status: 400 }
      );
    }
  }

  const contact = await prisma.contact.create({
    data: {
      userId: session.user.id,
      firstName: (firstName as string).trim(),
      lastName: typeof lastName === "string" ? lastName.trim() : undefined,
      email: typeof email === "string" ? email.trim() : undefined,
      phone: typeof phone === "string" ? phone.trim() : undefined,
      company: typeof company === "string" ? company.trim() : undefined,
      jobTitle: typeof jobTitle === "string" ? jobTitle.trim() : undefined,
      notes: typeof notes === "string" ? notes.trim() : undefined,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
