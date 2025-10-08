# SaaS Video Library Demo

A production-ready SaaS application demonstrating authentication, subscription management, and a protected video library. Built with Next.js, Prisma, SQLite, NextAuth, and Stripe.

## Features

- **Authentication**: Secure email/password authentication using NextAuth with Prisma
- **Role-Based Access Control**: User and admin roles with proper authorization
- **Stripe Integration**: Test mode subscription handling with webhook verification
- **Protected Routes**: Dashboard accessible only to authenticated users with active subscriptions
- **Admin Panel**: Admin-only page to view all users and subscription statuses
- **Video Library**: YouTube URL management with server-side validation and duplicate prevention
- **Security Hardened**: Webhook signature verification, secret management, and comprehensive error handling
- **Local Database**: SQLite database with Prisma ORM for easy development and deployment

## Tech Stack

- **Framework**: Next.js 13 (App Router) with TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth with credentials provider
- **Payments**: Stripe (Test Mode)
- **Styling**: Tailwind CSS + shadcn/ui components

## Quick Start (Under 5 Minutes)

### Prerequisites

- Node.js 18+ installed
- A Stripe account in test mode (free)

### 1. Clone and Install

```bash
git clone <repository-url>
cd <project-directory>
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_ID=price_your_price_id_here

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Create and migrate database
npx prisma db push

# Seed with initial data (admin user)
npm run db:seed
```

### 4. Set Up Stripe

1. Go to [stripe.com](https://stripe.com) and create an account
2. Switch to **Test Mode** (toggle in top right)
3. Go to **Products** → **Add product**
   - Name: "Monthly Subscription"
   - Price: $10/month (recurring)
   - Save and copy the **Price ID** (starts with `price_`)
4. Go to **Developers** → **API keys**
   - Copy **Publishable key** (starts with `pk_test_`)
   - Copy **Secret key** (starts with `sk_test_`)
5. Go to **Developers** → **Webhooks**
   - Add endpoint: `http://localhost:3000/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the **Webhook secret** (starts with `whsec_`)

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` and you're ready to go!

## Default Credentials

After running the seed script, you can use these test accounts:

- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`

## Testing Subscriptions

Use Stripe's test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

## Database Management

### View Database with Prisma Studio

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can:
- View all tables and data
- Edit records
- Add new records
- Browse relationships

### Reset Database

```bash
# Delete database file
rm prisma/dev.db

# Recreate and seed
npx prisma db push
npm run db:seed
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts    # NextAuth configuration
│   │   │   ├── register/route.ts         # User registration
│   │   │   └── check-user/route.ts       # User existence check
│   │   ├── admin/users/route.ts          # Admin user management
│   │   ├── user/subscription/route.ts    # User subscription status
│   │   ├── create-checkout-session/route.ts # Stripe checkout
│   │   └── webhooks/stripe/route.ts      # Stripe webhook handler
│   ├── auth/
│   │   ├── sign-in/page.tsx              # Sign in page
│   │   └── sign-up/page.tsx              # Sign up page
│   ├── admin/page.tsx                    # Admin dashboard
│   ├── dashboard/page.tsx                # User dashboard
│   └── layout.tsx                        # Root layout with providers
├── components/
│   ├── providers.tsx                     # NextAuth SessionProvider wrapper
│   └── ui/                               # shadcn/ui components
├── lib/
│   ├── auth.ts                           # NextAuth configuration
│   ├── prisma.ts                         # Prisma client instance
│   ├── contexts/auth-context.tsx         # Authentication context
│   └── types.ts                          # TypeScript type definitions
├── prisma/
│   ├── schema.prisma                     # Database schema
│   └── seed.ts                           # Database seeding script
└── types/
    └── next-auth.d.ts                    # NextAuth type extensions
```

## Key Features Explained

### Authentication Flow

1. User signs up with email/password
2. Password is hashed with bcryptjs
3. User record created in SQLite database
4. NextAuth manages JWT sessions
5. Protected routes check authentication status

### Subscription Flow

1. User clicks "Subscribe Now" on dashboard
2. Stripe checkout session created with user's customer ID
3. User completes payment with test card
4. Stripe sends webhook to `/api/webhooks/stripe`
5. Webhook handler updates user's subscription status
6. Dashboard shows active subscription status

### Admin Panel

- Only accessible to users with `ADMIN` role
- Shows all users with their subscription status
- Displays system statistics
- Uses server-side authentication checks

## Development

### Adding New Features

1. **Database Changes**: Update `prisma/schema.prisma`, then run `npx prisma db push`
2. **API Routes**: Add new routes in `app/api/`
3. **Authentication**: Use `getServerSession(authOptions)` for server-side auth
4. **Client Auth**: Use `useAuth()` hook for client-side auth

### Environment Variables

All sensitive data is stored in `.env`:
- Database connection string
- NextAuth secret
- Stripe API keys
- Webhook secrets

Never commit `.env` to version control!

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms

The app works on any platform that supports:
- Node.js 18+
- SQLite database
- Environment variables

## Troubleshooting

### Common Issues

1. **Database not found**: Run `npx prisma db push`
2. **Authentication errors**: Check `NEXTAUTH_SECRET` is set
3. **Stripe webhook failures**: Verify webhook secret and endpoint URL
4. **Subscription not updating**: Check webhook events are selected

### Getting Help

- Check the browser console for client-side errors
- Check server logs for API errors
- Use Prisma Studio to inspect database state
- Verify Stripe webhook delivery in Stripe dashboard

## License

MIT License - feel free to use this as a starting point for your own SaaS applications!