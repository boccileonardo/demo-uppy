import { useState, useEffect } from 'react';
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
      // Validate token by making a test request to the backend
      validateToken();
    }
  }, []);

  const validateToken = async () => {
    try {
      // Try to make an authenticated request to validate the token
      await apiService.listFiles();
      // If successful, get user info from localStorage or make a user info API call
      const userInfo = localStorage.getItem('user_info');
      if (userInfo) {
        setUser(JSON.parse(userInfo));
      }
    } catch (error) {
      // Token is invalid, clear it
      apiService.clearToken();
      localStorage.removeItem('user_info');
    }
  };

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
      localStorage.setItem('user_info', JSON.stringify(response.user));
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
      localStorage.setItem('user_info', JSON.stringify(response.user));
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const handleLogout = () => {
    apiService.clearToken();
    localStorage.removeItem('user_info');
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