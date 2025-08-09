import React, { useState, useEffect } from 'react';
import { AuthSection } from './components/AuthSection';
import { FileUploadPortal } from './components/FileUploadPortal';
import { apiService, User } from './services/api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for existing token on app load
  useEffect(() => {
    const token = apiService.getToken();
    if (token) {
      // In a real app, you'd validate the token with the backend
      // For demo purposes, we'll assume it's valid
      setUser({ email: 'cached@user.com', name: 'Cached User' });
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.login(email, password);
      if (response.user.needs_password_setup) {
        // Handle first-time login case
        setIsLoading(false);
        return { needsPasswordSetup: true };
      }
      apiService.setToken(response.access_token);
      setUser(response.user);
      setIsLoading(false);
      return { needsPasswordSetup: false };
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const handleSetPassword = async (email: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.setPassword(email, newPassword);
      apiService.setToken(response.access_token);
      setUser(response.user);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const handleLogout = () => {
    apiService.clearToken();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {!user ? (
        <AuthSection
          onLogin={handleLogin}
          onSetPassword={handleSetPassword}
          isLoading={isLoading}
        />
      ) : (
        <FileUploadPortal user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}