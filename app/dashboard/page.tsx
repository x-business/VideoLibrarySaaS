'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogOut, User } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscriptionStatus, setSubscriptionStatus] = useState<'inactive' | 'active' | 'past_due'>('inactive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/sign-in');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchUserSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (searchParams.get('success')) {
      setSuccess('Subscription activated successfully!');
      setSubscriptionStatus('active');
    }
    if (searchParams.get('canceled')) {
      setError('Subscription was canceled');
    }
  }, [searchParams]);

  const fetchUserSubscription = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/user/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data.subscriptionStatus || 'inactive');
      }
    } catch (err) {
      console.error('Failed to fetch subscription status');
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_placeholder',
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      setError('Failed to initiate checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span className="capitalize">{user.role.toLowerCase()}</span>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Subscription Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>
              Manage your subscription and access premium features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Status</p>
                <p className={`text-lg font-semibold ${
                  subscriptionStatus === 'active' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
                </p>
              </div>
              {subscriptionStatus === 'inactive' && (
                <Button 
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Video Library</CardTitle>
              <CardDescription>
                Upload and manage your video content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionStatus === 'active' ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Your video library is ready! Upload videos to get started.
                  </p>
                  <Button className="w-full">
                    Add Video
                  </Button>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Subscribe to access the video library feature.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                View your video performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionStatus === 'active' ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Analytics dashboard coming soon!
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    View Analytics
                  </Button>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Subscribe to access analytics features.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Panel Link */}
        {user.role === 'ADMIN' && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Admin Panel</CardTitle>
              <CardDescription>
                Manage users and system settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push('/admin')}
                className="w-full"
              >
                Go to Admin Panel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}