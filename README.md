# SaaS Video Library Demo

A production-ready SaaS application demonstrating authentication, subscription management, and a protected video library. Built with Next.js, Supabase, and Stripe.

## Features

- **Authentication**: Secure email/password authentication using Supabase Auth
- **Role-Based Access Control**: User and admin roles with proper authorization
- **Stripe Integration**: Test mode subscription handling with webhook verification
- **Protected Routes**: Dashboard accessible only to authenticated users with active subscriptions
- **Admin Panel**: Admin-only page to view all users and subscription statuses
- **Video Library**: YouTube URL management with server-side validation and duplicate prevention
- **Security Hardened**: Webhook signature verification, secret management, and comprehensive error handling

## Tech Stack

- **Framework**: Next.js 13 (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Payments**: Stripe (Test Mode)
- **Styling**: Tailwind CSS + shadcn/ui components

## Quick Start (Under 5 Minutes)

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Stripe account in test mode (free)

### 1. Clone and Install

```bash
git clone <repository-url>
cd <project-directory>
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned (2-3 minutes)
3. Go to **Project Settings** > **API**
4. Copy your `Project URL` and `anon public` key

#### Set Up Database Schema

Go to **SQL Editor** in your Supabase dashboard and run this SQL:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user',
  subscription_status text NOT NULL DEFAULT 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  youtube_url text UNIQUE NOT NULL,
  title text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM profiles WHERE id = auth.uid()) AND
    subscription_status = (SELECT subscription_status FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Videos policies
CREATE POLICY "Users can view own videos"
  ON videos FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Active subscribers can insert videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND subscription_status = 'active'
    )
  );

CREATE POLICY "Users can delete own videos"
  ON videos FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role, subscription_status)
  VALUES (NEW.id, NEW.email, 'user', 'inactive');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Create Admin User

After running the schema, create your admin user:

1. Sign up through the app (it will create a regular user)
2. Go to **Table Editor** > **profiles** in Supabase
3. Find your user and change the `role` from `'user'` to `'admin'`

### 3. Set Up Stripe

1. Go to [stripe.com](https://stripe.com) and create an account
2. Switch to **Test Mode** (toggle in dashboard)
3. Go to **Developers** > **API keys**
4. Copy your **Publishable key** and **Secret key**

#### Create a Product and Price

1. Go to **Products** > **Add product**
2. Enter a name (e.g., "Monthly Subscription")
3. Choose **Recurring** pricing
4. Set price (e.g., $10/month)
5. Click **Save product**
6. Copy the **Price ID** (starts with `price_`)

#### Set Up Webhook

1. Go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Enter URL: `http://localhost:3000/api/webhooks/stripe` (for local testing, use Stripe CLI)
4. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy the **Signing secret** (starts with `whsec_`)

**For local development**, use Stripe CLI:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret it provides
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing the Application

### 1. Authentication

1. Click **Get Started** or **Sign Up**
2. Create an account with email/password
3. You'll be redirected to the dashboard

### 2. Subscription Flow

1. In the dashboard, your subscription status will show as **Inactive**
2. Click **Subscribe Now**
3. You'll be redirected to Stripe Checkout (test mode)
4. Use test card: `4242 4242 4242 4242`
5. Any future expiry date, any CVC, any ZIP
6. Complete checkout
7. You'll be redirected back with **Active** subscription status

### 3. Video Library

1. With an active subscription, you can add YouTube videos
2. Enter a valid YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
3. Optionally add a title
4. Click **Add Video**
5. The video will appear in your library with an embedded player
6. Try adding the same URL again - it will be rejected as a duplicate
7. Try adding an invalid URL - it will be rejected

### 4. Admin Panel

1. Make sure you've set your user's role to `'admin'` in Supabase
2. An **Admin Panel** button will appear in the dashboard
3. Click it to view all users and their subscription statuses

## Architecture & Security

### Authentication

- Email/password authentication via Supabase Auth
- Session persists across page refreshes
- Protected routes redirect to sign-in if not authenticated
- Auth state managed via React Context

### Authorization

- **Row Level Security (RLS)** enforced at database level
- Users can only access their own data
- Admin role checked server-side for admin routes
- Subscription status verified before video operations

### Subscription Management

- Stripe Checkout handles payment collection
- Webhook events update subscription status in database
- **Webhook signature verification** prevents unauthorized updates
- Subscription status persists and syncs across sessions

### Video Library

- **Server-side URL validation** ensures only valid YouTube URLs
- **Duplicate detection** at database level with unique constraint
- **Active subscription required** enforced via RLS policy
- Videos embedded using YouTube iframe API

### Security Hardening

1. **Route Protection**: Middleware and client-side checks prevent unauthorized access
2. **Admin Gating**: Role verification both client and server-side
3. **Webhook Security**: Stripe signature verification before processing
4. **Secret Hygiene**: All secrets in `.env`, never logged or exposed
5. **Error Sanitization**: Generic error messages to users, detailed logs server-side
6. **RLS Policies**: Database-level security prevents unauthorized data access

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── create-checkout-session/  # Stripe checkout endpoint
│   │   ├── videos/                   # Video CRUD operations
│   │   └── webhooks/
│   │       └── stripe/               # Stripe webhook handler
│   ├── auth/
│   │   ├── sign-in/                  # Sign in page
│   │   └── sign-up/                  # Sign up page
│   ├── admin/                        # Admin-only dashboard
│   ├── dashboard/                    # Protected user dashboard
│   └── layout.tsx                    # Root layout with AuthProvider
├── components/ui/                    # shadcn/ui components
├── lib/
│   ├── contexts/
│   │   └── auth-context.tsx          # Auth state management
│   ├── supabase/
│   │   ├── client.ts                 # Client-side Supabase client
│   │   └── server.ts                 # Server-side Supabase admin client
│   ├── types.ts                      # TypeScript type definitions
│   └── utils.ts                      # Utility functions
└── middleware.ts                     # Next.js middleware for route protection
```

## API Endpoints

### POST /api/create-checkout-session

Creates a Stripe Checkout session for subscription.

**Request:**
```json
{
  "priceId": "price_...",
  "userId": "uuid",
  "userEmail": "user@example.com"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### POST /api/webhooks/stripe

Handles Stripe webhook events. Verifies signature and updates subscription status.

**Events handled:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### GET /api/videos

Fetches user's videos. Requires authentication.

**Headers:**
```
Authorization: Bearer <access_token>
```

### POST /api/videos

Adds a new video. Requires active subscription.

**Request:**
```json
{
  "youtube_url": "https://www.youtube.com/watch?v=...",
  "title": "Optional title"
}
```

### DELETE /api/videos?id=<video_id>

Deletes a video. User must own the video.

## Development Notes

### Database Migrations

All schema changes should be tracked. The initial schema is documented in this README. For production, consider using a migration tool.

### Testing Stripe Webhooks Locally

Use Stripe CLI to forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Update your `.env` with the webhook secret provided by the CLI.

### Test Cards

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Auth**: 4000 0025 0000 3155

More test cards: [Stripe Testing Docs](https://stripe.com/docs/testing)

## Troubleshooting

### "Invalid Supabase URL" Error

Ensure your `.env` has valid Supabase credentials from your project settings.

### Webhook Not Updating Subscription

1. Check webhook is configured in Stripe dashboard
2. Verify webhook secret in `.env` matches Stripe
3. For local dev, use Stripe CLI to forward webhooks
4. Check server logs for webhook errors

### Videos Not Showing

1. Ensure subscription status is "active" in database
2. Check RLS policies are created correctly
3. Verify video URLs are valid YouTube URLs
4. Check browser console for errors

### Admin Page Shows 403

Make sure your user's `role` in the `profiles` table is set to `'admin'`.

## Production Deployment

### Environment Variables

Update `NEXT_PUBLIC_APP_URL` to your production domain.

### Stripe Webhook

1. Create a new webhook endpoint in Stripe dashboard (production mode)
2. Point it to `https://yourdomain.com/api/webhooks/stripe`
3. Update `STRIPE_WEBHOOK_SECRET` with the new signing secret

### Security Checklist

- [ ] All secrets are environment variables
- [ ] Stripe is in live mode with real webhook secret
- [ ] Supabase RLS policies are enabled
- [ ] Admin user created and role verified
- [ ] SSL/HTTPS enabled
- [ ] Error logging configured (e.g., Sentry)

## Trade-offs & Decisions

### Why Supabase over Prisma + SQLite?

- Built-in authentication saves development time
- Row Level Security provides database-level security
- Real-time capabilities for future features
- Managed hosting reduces operational overhead

### Why Client-Side Auth Context?

- Simpler state management for small app
- Works well with Next.js App Router
- Easier to understand for demo purposes
- Can migrate to server-side session management if needed

### Why Server-Side API Routes for Videos?

- Enforces subscription check server-side
- Enables proper authentication verification
- Prevents client-side bypass attempts
- Centralizes business logic

### Potential Improvements

1. **Server Actions**: Could replace API routes for simpler code
2. **Server-Side Session**: More secure than client-side token management
3. **Email Verification**: Currently disabled for demo simplicity
4. **Rate Limiting**: Should be added for production
5. **Caching**: Add Redis for session and data caching
6. **Video Metadata**: Fetch video title/thumbnail from YouTube API
7. **Pagination**: Add for large video collections
8. **Search & Filter**: Enhance video library with search

## License

MIT
