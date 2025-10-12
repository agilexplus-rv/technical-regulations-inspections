'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MFAVerificationForm } from '@/components/auth/mfa-verification-form';

export default function MFAVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const userId = searchParams.get('userId');
  const userEmail = searchParams.get('email');

  useEffect(() => {
    // Check if we have the required parameters
    if (!userId || !userEmail) {
      // Redirect to login if missing required parameters
      router.push('/auth/login');
      return;
    }
    
    setIsLoading(false);
  }, [userId, userEmail, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <MFAVerificationForm 
          userId={userId!} 
          userEmail={userEmail!} 
        />
      </div>
    </div>
  );
}
