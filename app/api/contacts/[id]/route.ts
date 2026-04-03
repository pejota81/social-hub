import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const contact = await prisma.contact.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json(contact);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.contact.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
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

  if (firstName !== undefined && (typeof firstName !== "string" || !firstName.trim())) {
    return NextResponse.json(
      { error: "firstName must be a non-empty string" },
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

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...(firstName !== undefined && { firstName: (firstName as string).trim() }),
      ...(lastName !== undefined && { lastName: (lastName as string).trim() }),
      ...(email !== undefined && { email: (email as string).trim() }),
      ...(phone !== undefined && { phone: (phone as string).trim() }),
      ...(company !== undefined && { company: (company as string).trim() }),
      ...(jobTitle !== undefined && { jobTitle: (jobTitle as string).trim() }),
      ...(notes !== undefined && { notes: (notes as string).trim() }),
    },
  });

  return NextResponse.json(contact);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.contact.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  await prisma.contact.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
