# Quick Start Guide (5 Minutes)

This guide gets you from zero to running app in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- A Stripe account (free, test mode)

## Step 1: Install Dependencies (1 minute)

```bash
npm install
```

## Step 2: Set Up Database (1 minute)

```bash
# Generate Prisma client
npx prisma generate

# Create and migrate database
npx prisma db push

# Seed with initial data (admin user)
npm run db:seed
```

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

## Step 4: Configure Environment (30 seconds)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in:

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

## Step 5: Run the Application (30 seconds)

```bash
npm run dev
```

Visit `http://localhost:3000` and you're ready to go!

## Test Credentials

After running the seed script, you can use these test accounts:

- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`

## Testing Subscriptions

Use Stripe's test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

## View Database

To view your SQLite database:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can browse and edit your data.

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

## Next Steps

- Explore the admin panel at `/admin` (admin credentials required)
- Test the subscription flow
- Add your own videos to the library
- Customize the UI and features