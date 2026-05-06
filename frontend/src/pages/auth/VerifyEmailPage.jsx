import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../api/auth.api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authAPI.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  const content = {
    verifying: { emoji: '⏳', title: 'Verifying your email...', desc: 'Please wait.' },
    success: { emoji: '✅', title: 'Email Verified!', desc: 'Your email has been verified. You can now access all features.' },
    error: { emoji: '❌', title: 'Verification Failed', desc: 'The link may be invalid or expired. Please request a new verification email.' },
  }[status];

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">{content.emoji}</div>
        <h1 className="text-2xl font-bold mb-2">{content.title}</h1>
        <p className="text-gray-500 mb-6">{content.desc}</p>
        {status !== 'verifying' && (
          <Link to="/" className="btn-primary inline-block">Go to Homepage</Link>
        )}
      </div>
    </div>
  );
}
