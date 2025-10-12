'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers-simple';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MFAVerificationFormProps {
  userId: string;
  userEmail: string;
}

export function MFAVerificationForm({ userId, userEmail }: MFAVerificationFormProps) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      // User is already authenticated, redirect to dashboard
      switch (user.role) {
        case "inspector":
          router.push("/dashboard/inspector");
          break;
        case "officer":
        case "manager":
        case "admin":
          router.push("/dashboard");
          break;
        default:
          router.push("/dashboard/inspector");
      }
    }
  }, [user, router]);

  // Check if we have session data stored (indicates we're in MFA flow)
  useEffect(() => {
    const sessionDataStr = sessionStorage.getItem('mfa-session-data');
    if (!sessionDataStr) {
      console.log('No MFA session data found, redirecting to login');
      router.push('/auth/login');
    }
  }, [router]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsExpired(true);
    }
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          otp: otp.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Success - MFA verification completed
      console.log('MFA verification successful');
      
      // After successful MFA verification, we need to establish the session
      const sessionDataStr = sessionStorage.getItem('mfa-session-data');
      if (sessionDataStr) {
        try {
          const sessionData = JSON.parse(sessionDataStr);
          
          // Create a proper Supabase session object
          const supabaseSession = {
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
            expires_at: sessionData.expires_at,
            token_type: 'bearer',
            user: data.user
          };
          
          // Store the session in localStorage using Supabase's format
          localStorage.setItem('sb-muzpbudurlatuznkrgtx-auth-token', JSON.stringify(supabaseSession));
          
          // Clear the temporary session data
          sessionStorage.removeItem('mfa-session-data');
          
          console.log('Session established after MFA verification');
          
          // Now redirect to the appropriate dashboard
          if (data.user) {
            switch (data.user.role) {
              case "inspector":
                window.location.href = "/dashboard/inspector";
                break;
              case "officer":
              case "manager":
              case "admin":
                window.location.href = "/dashboard";
                break;
              default:
                window.location.href = "/dashboard/inspector";
            }
          } else {
            window.location.href = "/dashboard";
          }
        } catch (error) {
          console.error('Error establishing session:', error);
          // Fallback: reload the page
          window.location.reload();
        }
      } else {
        console.error('No session data found');
        // Fallback: reload the page
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setOtp(''); // Clear the OTP field on error
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setIsResending(true);

    console.log('Resend MFA: Sending request with:', { userId, userEmail });

    try {
      const response = await fetch('/api/auth/mfa/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      // Success - new code sent
      setSuccess('New verification code sent to your email');
      
      // Reset the timer to 2 minutes
      setTimeLeft(120);
      setIsExpired(false);
      
      // Clear any existing OTP
      setOtp('');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/auth/login');
  };

  if (isExpired) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-600">Code Expired</CardTitle>
          <CardDescription>
            Your verification code has expired. Please try logging in again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleBackToLogin}
            className="w-full"
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Verify Your Identity</CardTitle>
        <CardDescription>
          We've sent a 6-digit verification code to<br />
          <strong>{userEmail}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-widest"
              disabled={isVerifying}
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
              {success}
            </div>
          )}

          <div className="text-center text-sm text-gray-600">
            Code expires in: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>

          <div className="space-y-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isVerifying || otp.length !== 6}
            >
              {isVerifying ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isVerifying || isResending}
                className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
              >
                {isResending ? 'Sending new code...' : "Didn't receive the code? Try again"}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t">
          <div className="text-center">
            <button
              type="button"
              onClick={handleBackToLogin}
              disabled={isVerifying || isResending}
              className="text-sm text-gray-600 hover:text-gray-800 underline disabled:opacity-50"
            >
              Back to Login
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
