import { useState, useEffect } from 'react';
import { AuthSection } from './components/AuthSection';
import { FileUploadPortal } from './components/FileUploadPortal';
import { apiService } from './services/api';
import { useLoading } from './hooks';
import { storage } from './utils/helpers';
import { AUTH } from './config/constants';
import type { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const { isLoading, withLoading } = useLoading();

  // Check for existing token on app load
  useEffect(() => {
    const token = apiService.getToken();
    if (token) {
      // Validate token by making a test request to the backend
      validateToken();
    }
  }, []);

  const validateToken = async () => {
    try {
      // Try to make an authenticated request to validate the token
      await apiService.listFiles();
      // If successful, get user info from localStorage or make a user info API call
      const userInfo = storage.getObject<User>(AUTH.USER_INFO_KEY);
      if (userInfo) {
        setUser(userInfo);
      }
    } catch (error) {
      // Token is invalid, clear it
      apiService.clearToken();
      storage.remove(AUTH.USER_INFO_KEY);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    return withLoading(async () => {
      const response = await apiService.login(email, password);
      if (response.user.needs_password_setup) {
        return { needsPasswordSetup: true };
      }
      apiService.setToken(response.access_token);
      setUser(response.user);
      storage.setObject(AUTH.USER_INFO_KEY, response.user);
      return { needsPasswordSetup: false };
    });
  };

  const handleSetPassword = async (email: string, newPassword: string) => {
    return withLoading(async () => {
      const response = await apiService.setPassword(email, newPassword);
      apiService.setToken(response.access_token);
      setUser(response.user);
      storage.setObject(AUTH.USER_INFO_KEY, response.user);
    });
  };

  const handleLogout = () => {
    apiService.clearToken();
    storage.remove(AUTH.USER_INFO_KEY);
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