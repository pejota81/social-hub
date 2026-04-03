import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface GoogleContact {
  resourceName: string;
  names?: Array<{ givenName?: string; familyName?: string }>;
  emailAddresses?: Array<{ value?: string }>;
  phoneNumbers?: Array<{ value?: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
  photos?: Array<{ url?: string }>;
}

interface MicrosoftContact {
  id: string;
  givenName?: string;
  surname?: string;
  emailAddresses?: Array<{ address?: string }>;
  mobilePhone?: string;
  companyName?: string;
  jobTitle?: string;
}

async function syncGoogleContacts(userId: string, accessToken: string) {
  const res = await fetch(
    "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations,photos&pageSize=1000",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    throw new Error(`Google Contacts API error: ${res.status}`);
  }

  const data = await res.json();
  const connections: GoogleContact[] = data.connections ?? [];

  let created = 0;
  let updated = 0;

  for (const person of connections) {
    const firstName = person.names?.[0]?.givenName ?? "Unknown";
    const lastName = person.names?.[0]?.familyName;
    const email = person.emailAddresses?.[0]?.value;
    const phone = person.phoneNumbers?.[0]?.value;
    const company = person.organizations?.[0]?.name;
    const jobTitle = person.organizations?.[0]?.title;
    const avatarUrl = person.photos?.[0]?.url;
    const sourceProviderId = person.resourceName;

    const existing = await prisma.contact.findUnique({
      where: {
        userId_sourceProvider_sourceProviderId: {
          userId,
          sourceProvider: "google",
          sourceProviderId,
        },
      },
    });

    if (existing) {
      await prisma.contact.update({
        where: { id: existing.id },
        data: { firstName, lastName, email, phone, company, jobTitle, avatarUrl },
      });
      updated++;
    } else {
      await prisma.contact.create({
        data: {
          userId,
          firstName,
          lastName,
          email,
          phone,
          company,
          jobTitle,
          avatarUrl,
          sourceProvider: "google",
          sourceProviderId,
        },
      });
      created++;
    }
  }

  return { created, updated, total: connections.length };
}

async function syncMicrosoftContacts(userId: string, accessToken: string) {
  const res = await fetch(
    "https://graph.microsoft.com/v1.0/me/contacts?$select=id,givenName,surname,emailAddresses,mobilePhone,companyName,jobTitle&$top=999",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    throw new Error(`Microsoft Contacts API error: ${res.status}`);
  }

  const data = await res.json();
  const msContacts: MicrosoftContact[] = data.value ?? [];

  let created = 0;
  let updated = 0;

  for (const person of msContacts) {
    const firstName = person.givenName ?? "Unknown";
    const lastName = person.surname;
    const email = person.emailAddresses?.[0]?.address;
    const phone = person.mobilePhone;
    const company = person.companyName;
    const jobTitle = person.jobTitle;
    const sourceProviderId = person.id;

    const existing = await prisma.contact.findUnique({
      where: {
        userId_sourceProvider_sourceProviderId: {
          userId,
          sourceProvider: "microsoft",
          sourceProviderId,
        },
      },
    });

    if (existing) {
      await prisma.contact.update({
        where: { id: existing.id },
        data: { firstName, lastName, email, phone, company, jobTitle },
      });
      updated++;
    } else {
      await prisma.contact.create({
        data: {
          userId,
          firstName,
          lastName,
          email,
          phone,
          company,
          jobTitle,
          sourceProvider: "microsoft",
          sourceProviderId,
        },
      });
      created++;
    }
  }

  return { created, updated, total: msContacts.length };
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

  const { provider } = body as Record<string, unknown>;

  if (!provider || typeof provider !== "string" || !["google", "microsoft"].includes(provider)) {
    return NextResponse.json(
      { error: "Invalid provider. Use 'google' or 'microsoft'" },
      { status: 400 }
    );
  }

  const providerName =
    provider === "google" ? "google" : "microsoft-entra-id";

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: providerName },
  });

  if (!account?.access_token) {
    return NextResponse.json(
      {
        error: `No ${provider} account linked or no access token available. Please sign in with ${provider}.`,
      },
      { status: 400 }
    );
  }

  try {
    let result;
    if (provider === "google") {
      result = await syncGoogleContacts(
        session.user.id,
        account.access_token
      );
    } else {
      result = await syncMicrosoftContacts(
        session.user.id,
        account.access_token
      );
    }

    return NextResponse.json({
      success: true,
      provider,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to sync contacts: ${message}` },
      { status: 500 }
    );
  }
}
