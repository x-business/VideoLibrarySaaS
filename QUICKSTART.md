# Quick Start Guide (5 Minutes)

This guide gets you from zero to running app in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free)
- A Stripe account (free, test mode)

## Step 1: Install Dependencies (1 minute)

```bash
npm install
```

## Step 2: Set Up Supabase (2 minutes)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Wait for database to provision (~2 minutes)
3. Go to **Project Settings** → **API**
4. Copy your **Project URL** and **anon public** key
5. Go to **SQL Editor**
6. Copy and paste the entire contents of `SETUP_DATABASE.sql`
7. Click **Run**

## Step 3: Set Up Stripe (1 minute)

1. Go to [stripe.com](https://stripe.com) → Create account
2. Switch to **Test Mode** (toggle in top right)
3. Go to **Products** → **Add product**
   - Name: "Monthly Subscription"
   - Price: $10/month (recurring)
   - Save and copy the **Price ID** (starts with `price_`)
4. Go to **Developers** → **API keys**
   - Copy **Publishable key** (starts with `pk_test_`)
   - Copy **Secret key** (starts with `sk_test_`)

## Step 4: Configure Environment (30 seconds)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_placeholder (we'll update this)
STRIPE_PRICE_ID=price_your_price_id_here

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: For `SUPABASE_SERVICE_ROLE_KEY`, go to Supabase Project Settings → API → Copy the `service_role` key.

## Step 5: Set Up Webhook for Local Development (30 seconds)

Open a new terminal and run:

```bash
# Install Stripe CLI if you haven't: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook secret it shows (starts with `whsec_`) and update your `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_the_secret_from_stripe_cli
```

Keep this terminal running!

## Step 6: Start the App (10 seconds)

In your main terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 7: Test the Application

### Create Account & Make Admin

1. Click **Get Started**
2. Sign up with email/password
3. Go to Supabase → **Table Editor** → **profiles**
4. Find your user, change `role` from `user` to `admin`
5. Save

### Test Subscription

1. Refresh your app
2. You'll see **Inactive** subscription
3. Click **Subscribe Now**
4. Use test card: `4242 4242 4242 4242`
5. Any future date, any CVC, any ZIP
6. Complete checkout
7. You'll be redirected back with **Active** status

### Test Video Library

1. With active subscription, add a YouTube video:
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```
2. Add a title (optional)
3. Click **Add Video**
4. Video appears with embedded player
5. Try adding the same URL again - it will be rejected

### Test Admin Panel

1. Click **Admin Panel** button
2. See all users and subscription statuses

## Common Issues

### "Invalid Supabase URL"

Double-check your Supabase URL in `.env` - it should start with `https://`

### Webhook not working

Make sure Stripe CLI is running:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Can't see Admin Panel button

Make sure you changed your role to `admin` in Supabase Table Editor

### Videos not loading

Ensure your subscription status is `active` in the database

## Next Steps

- Read the full [README.md](./README.md) for detailed information
- Check [NOTES.md](./NOTES.md) for implementation details
- Review the code to understand the architecture

## Production Deployment

When deploying to production:

1. Switch Stripe to **Live Mode**
2. Create a webhook in Stripe dashboard pointing to your production URL
3. Update all environment variables with production values
4. Deploy!

See the full README for production checklist.
