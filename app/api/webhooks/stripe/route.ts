import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    console.log('Received webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.metadata?.userId && session.subscription) {
          await prisma.user.update({
            where: { id: session.metadata.userId },
            data: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: 'active',
            },
          });
          console.log('User subscription activated:', session.metadata.userId);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const status = subscription.status === 'active' ? 'active' : 'inactive';
        
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { subscriptionStatus: status },
        });
        
        console.log('Subscription status updated:', subscription.id, status);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { subscriptionStatus: 'inactive' },
        });
        
        console.log('Subscription cancelled:', subscription.id);
        break;
      }

            case 'invoice.payment_succeeded': {
              const invoice = event.data.object as Stripe.Invoice;
              
              if ((invoice as any).subscription) {
                const subscriptionId = typeof (invoice as any).subscription === 'string' 
                  ? (invoice as any).subscription 
                  : (invoice as any).subscription.id;
                
                await prisma.user.updateMany({
                  where: { stripeSubscriptionId: subscriptionId },
                  data: { subscriptionStatus: 'active' },
                });
                console.log('Payment succeeded for subscription:', subscriptionId);
              }
              break;
            }

            case 'invoice.payment_failed': {
              const invoice = event.data.object as Stripe.Invoice;
              
              if ((invoice as any).subscription) {
                const subscriptionId = typeof (invoice as any).subscription === 'string' 
                  ? (invoice as any).subscription 
                  : (invoice as any).subscription.id;
                
                await prisma.user.updateMany({
                  where: { stripeSubscriptionId: subscriptionId },
                  data: { subscriptionStatus: 'past_due' },
                });
                console.log('Payment failed for subscription:', subscriptionId);
              }
              break;
            }

      default:
        console.log('Unhandled event type:', event.type);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
