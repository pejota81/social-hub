# Social Hub

A full-stack web application for managing contacts and user profiles, with OAuth sign-in via Google, Microsoft, and Apple.

## Features

- 🔐 **OAuth Authentication** — Sign in with Google, Microsoft (Entra ID), or Apple
- 👤 **User Profiles** — View and edit your name, bio, phone, and location
- 📇 **Contacts Management** — Create, read, update, and delete contacts
- 🔄 **Contact Sync** — Import and sync contacts from Google Contacts and Microsoft Outlook
- 🗄️ **SQLite Database** — All data stored locally via Prisma ORM

## Tech Stack

- [Next.js 16](https://nextjs.org/) — Full-stack React framework
- [NextAuth.js v5](https://authjs.dev/) — Authentication with OAuth providers
- [Prisma 7](https://www.prisma.io/) — Type-safe ORM
- [SQLite](https://sqlite.org/) via [libsql](https://github.com/tursodatabase/libsql) — Database
- [Tailwind CSS 4](https://tailwindcss.com/) — Utility-first CSS

## Getting Started

### 1. Clone and install dependencies

```bash
git clone https://github.com/pejota81/social-hub.git
cd social-hub
npm install
```

### 2. Configure environment variables

Copy the example environment file and fill in your OAuth credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="file:./prisma/dev.db"

# Generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-here"

# Google OAuth — https://console.cloud.google.com/
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Microsoft OAuth — https://portal.azure.com/
MICROSOFT_CLIENT_ID="..."
MICROSOFT_CLIENT_SECRET="..."
MICROSOFT_TENANT_ID="common"

# Apple OAuth — https://developer.apple.com/
APPLE_CLIENT_ID="..."
APPLE_CLIENT_SECRET="..."
```

### 3. Set up the database

```bash
npx prisma migrate dev
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## OAuth Provider Setup

### Google
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project and enable the **Google People API**
3. Create OAuth 2.0 credentials
4. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI
5. Request scopes: `openid email profile https://www.googleapis.com/auth/contacts.readonly`

### Microsoft (Azure AD)
1. Go to [Azure Portal](https://portal.azure.com/) → App registrations
2. Register a new application
3. Add `http://localhost:3000/api/auth/callback/microsoft-entra-id` as a redirect URI
4. Add API permissions: `User.Read`, `Contacts.Read`

### Apple
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create a Services ID and configure Sign in with Apple
3. Add `http://localhost:3000/api/auth/callback/apple` as a redirect URI

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/profile` | Get current user's profile |
| PATCH | `/api/profile` | Update current user's profile |
| GET | `/api/contacts` | List contacts (with search & pagination) |
| POST | `/api/contacts` | Create a new contact |
| GET | `/api/contacts/:id` | Get a specific contact |
| PATCH | `/api/contacts/:id` | Update a contact |
| DELETE | `/api/contacts/:id` | Delete a contact |
| POST | `/api/contacts/sync` | Sync contacts from Google or Microsoft |

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm test         # Run Jest tests
```
