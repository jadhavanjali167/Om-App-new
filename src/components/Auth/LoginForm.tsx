import React, { useState } from 'react';
import { FileText, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.tsx';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  const demoCredentials = [
    { email: 'admin@omservices.com', role: 'Main Admin' },
    { email: 'challan@omservices.com', role: 'Challan Staff' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-xl mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Om Services</h1>
          <p className="text-gray-600">Admin Panel Login</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Demo Credentials:</h3>
          <div className="space-y-2">
            {demoCredentials.map((cred, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600">
                <span className="font-medium">{cred.role}:</span>
                <span className="font-mono bg-white px-2 py-1 rounded border">
                  {cred.email} / password123
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}