import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, Shield, Cloud, Key, AlertCircle } from 'lucide-react';

interface AuthSectionProps {
  onLogin: (email: string, password: string) => Promise<{ needsPasswordSetup: boolean }>;
  onSetPassword: (email: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
}

export function AuthSection({ onLogin, onSetPassword, isLoading }: AuthSectionProps) {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [passwordSetupForm, setPasswordSetupForm] = useState({ 
    email: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const result = await onLogin(loginForm.email, loginForm.password);
      if (result.needsPasswordSetup) {
        setPasswordSetupForm({ ...passwordSetupForm, email: loginForm.email });
        setIsFirstTimeSetup(true);
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const handlePasswordSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');

    if (passwordSetupForm.newPassword !== passwordSetupForm.confirmPassword) {
      setSetupError('Passwords do not match');
      return;
    }

    if (passwordSetupForm.newPassword.length < 6) {
      setSetupError('Password must be at least 6 characters long');
      return;
    }

    try {
      await onSetPassword(passwordSetupForm.email, passwordSetupForm.newPassword);
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : 'Password setup failed');
    }
  };

  const goBackToLogin = () => {
    setIsFirstTimeSetup(false);
    setPasswordSetupForm({ email: '', newPassword: '', confirmPassword: '' });
    setSetupError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Upload className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl mb-2">SecureUpload</h1>
          <p className="text-gray-600">Secure file storage with Azure Blob Storage</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <Shield className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Secure</p>
          </div>
          <div className="text-center">
            <Upload className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Fast Upload</p>
          </div>
          <div className="text-center">
            <Cloud className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Cloud Storage</p>
          </div>
        </div>

        {/* Auth Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {isFirstTimeSetup ? (
                <>
                  <Key className="w-5 h-5 mr-2" />
                  Set Your Password
                </>
              ) : (
                'Welcome Back'
              )}
            </CardTitle>
            <CardDescription>
              {isFirstTimeSetup 
                ? 'Your account has been created. Please set a secure password to continue.'
                : 'Sign in with your email and password to access your files.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFirstTimeSetup ? (
              /* Password Setup Form */
              <form onSubmit={handlePasswordSetupSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setup-email">Email</Label>
                  <Input
                    id="setup-email"
                    type="email"
                    value={passwordSetupForm.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Create a secure password"
                    value={passwordSetupForm.newPassword}
                    onChange={(e) => setPasswordSetupForm({ 
                      ...passwordSetupForm, 
                      newPassword: e.target.value 
                    })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={passwordSetupForm.confirmPassword}
                    onChange={(e) => setPasswordSetupForm({ 
                      ...passwordSetupForm, 
                      confirmPassword: e.target.value 
                    })}
                    required
                    minLength={6}
                  />
                </div>

                {setupError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{setupError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Setting Password...' : 'Set Password & Continue'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={goBackToLogin}
                    disabled={isLoading}
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            ) : (
              /* Login Form */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                
                {loginError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      {loginError}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-900 mb-1">
                <strong>Account Information</strong>
              </p>
              <p className="text-blue-700">
                Your account has been pre-created by your administrator. 
                If this is your first login, you'll be prompted to set a secure password.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Demo mode - Use any email to simulate the login process
        </p>
      </div>
    </div>
  );
}