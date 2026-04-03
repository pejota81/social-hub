import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      phone: true,
      location: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
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

  const { name, bio, phone, location } = body as Record<string, unknown>;

  if (name !== undefined && typeof name !== "string") {
    return NextResponse.json({ error: "name must be a string" }, { status: 400 });
  }
  if (bio !== undefined && typeof bio !== "string") {
    return NextResponse.json({ error: "bio must be a string" }, { status: 400 });
  }
  if (phone !== undefined && typeof phone !== "string") {
    return NextResponse.json({ error: "phone must be a string" }, { status: 400 });
  }
  if (location !== undefined && typeof location !== "string") {
    return NextResponse.json({ error: "location must be a string" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name: (name as string).trim() }),
      ...(bio !== undefined && { bio: (bio as string).trim() }),
      ...(phone !== undefined && { phone: (phone as string).trim() }),
      ...(location !== undefined && { location: (location as string).trim() }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      phone: true,
      location: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}
