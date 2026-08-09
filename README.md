# Jemaw - Bill Splitting Application

A modern bill-splitting application built with Next.js, similar to Splitwise. Track shared expenses, split bills, and settle debts with friends and groups.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with Server Actions
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Better Auth
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Email**: Resend with React Email templates
- **Validation**: Zod

## Features

- **Jemaws (Groups)**: Create and manage expense-sharing groups
- **Bills**: Track shared expenses with category classification
- **Settlements**: Record debt payments between members
- **Approval Workflows**: Bills and settlements require approval before affecting balances
- **Email Notifications**: Automatic notifications for pending approvals
- **Balance Tracking**: Real-time balance updates per group

## Core Business Logic

### Workflow 1: Adding a Bill

1. A user creates a bill with amount, description, category, and split participants
2. Bill is created with `pending` status - balances remain unchanged
3. **Approval Rule**: At least one participant (excluding the payer) must approve
4. Once approved, balances are updated:
   - Payer gets a positive (+) balance for the amount owed to them
   - Split participants get negative (-) balances for their share

### Workflow 2: Adding a Settlement

1. A user who owes money submits a settlement claim
2. Settlement is created with `pending` status - balances remain unchanged
3. **Approval Rule**: Only the payment receiver can approve
4. Once approved, balances are updated:
   - Payer's negative balance is reduced
   - Receiver's positive balance is reduced

### Immutability Rule

Once any Bill or Settlement reaches `approved` status, it becomes 100% immutable. Any attempt to modify or delete an approved record will throw an error.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account
- Resend account (for emails)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local
```

### Environment Variables

Configure your `.env.local`:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-minimum-32-characters"
BETTER_AUTH_URL="http://localhost:3000"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Resend (Email)
RESEND_API_KEY="re_your_resend_api_key"
EMAIL_FROM="Jemaw <noreply@yourdomain.com>"

# Cloudinary (server-side signed image uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Database Setup

```bash
# Generate migrations from schema
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# Or run migrations (production)
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── actions/           # Server Actions
│   ├── bills.ts       # Bill CRUD and approval logic
│   ├── settlements.ts # Settlement CRUD and approval logic
│   └── jemaws.ts      # Group management and invitations
├── app/
│   ├── api/auth/      # Better Auth API routes
│   └── ...            # App routes
├── components/
│   └── ui/            # shadcn/ui components
├── db/
│   ├── index.ts       # Database connection
│   └── schema.ts      # Drizzle ORM schema
├── emails/            # React Email templates
│   ├── jemaw-invitation.tsx
│   └── pending-approval.tsx
└── lib/
    ├── auth.ts        # Better Auth configuration
    ├── auth-client.ts # Client-side auth hooks
    ├── email.ts       # Email sending utilities
    ├── session.ts     # Server session helpers
    └── utils.ts       # Utility functions
```

## Database Schema

### Tables

- `users` - User accounts (Better Auth compatible)
- `sessions` - User sessions
- `accounts` - OAuth accounts
- `verifications` - Email verification tokens
- `jemaws` - Groups/circles for splitting bills
- `jemaw_members` - Group membership with balance tracking
- `jemaw_invitations` - Pending group invitations
- `bills` - Expense records
- `bill_splits` - How bills are divided among users
- `settlements` - Debt payment records

## API Reference

### Server Actions

#### Bills

```typescript
// Create a new bill
createBill({
  jemawId: string,
  description: string,
  amount: string,
  category: BillCategory,
  splitUserIds: string[]
})

// Approve a pending bill
approveBill({ billId: string })

// Reject a pending bill
rejectBill({ billId: string })

// Get all bills for a group
getBillsByJemaw(jemawId: string)

// Get pending bills requiring user's approval
getPendingBillsForUser()
```

#### Settlements

```typescript
// Create a settlement claim
createSettlement({
  jemawId: string,
  receiverId: string,
  amount: string,
  description?: string
})

// Approve a settlement (receiver only)
approveSettlement({ settlementId: string })

// Reject a settlement (receiver only)
rejectSettlement({ settlementId: string })

// Get all settlements for a group
getSettlementsByJemaw(jemawId: string)

// Get pending settlements requiring user's approval
getPendingSettlementsForUser()
```

#### Jemaws (Groups)

```typescript
// Create a new group
createJemaw({
  name: string,
  description?: string
})

// Invite a member by email
inviteMember({
  jemawId: string,
  email: string
})

// Accept an invitation
acceptInvitation({ token: string })

// Get user's groups
getMyJemaws()

// Get group details
getJemawById(jemawId: string)
```

## Bill Categories

- breakfast
- lunch
- dinner
- groceries
- transportation
- utilities
- rent
- entertainment
- vacation
- shopping
- healthcare
- other

## License

MIT
