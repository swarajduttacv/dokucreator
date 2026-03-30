import React, { useState } from 'react';
import * as storage from '../services/storageService';
import { User } from '../types';
import { LogoIcon } from './Icons';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password.trim()) {
        setError("Username and password cannot be empty.");
        return;
    }
    setIsLoading(true);
    try {
      const user = isLogin 
        ? await storage.login(username, password) 
        : await storage.signUp(username, password);
      onAuthSuccess(user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background dark:bg-dark-background p-4">
      <div className="max-w-md w-full bg-brand-surface dark:bg-dark-surface rounded-xl shadow-2xl p-8 border border-brand-subtle dark:border-dark-subtle">
        <div className="text-center mb-8">
            <LogoIcon className="h-12 w-12 text-brand-primary dark:text-dark-primary mx-auto"/>
            <h1 className="text-3xl font-bold text-brand-secondary dark:text-dark-secondary tracking-tight mt-2">
              Welcome to DokuCreator
            </h1>
            <p className="text-xs text-brand-text/50 dark:text-dark-text/50">by ~Swaraj</p>
          <p className="text-brand-text/70 dark:text-dark-text/70 mt-2">
            {isLogin ? 'Sign in to continue to your dashboard' : 'Create an account to get started'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-brand-text/80 dark:text-dark-text/80">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full p-3 bg-brand-background/50 dark:bg-dark-background/50 border border-brand-subtle dark:border-dark-subtle rounded-md focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-primary focus:border-brand-primary dark:focus:border-dark-primary transition-colors text-brand-text dark:text-dark-text"
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-brand-text/80 dark:text-dark-text/80">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full p-3 bg-brand-background/50 dark:bg-dark-background/50 border border-brand-subtle dark:border-dark-subtle rounded-md focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-primary focus:border-brand-primary dark:focus:border-dark-primary transition-colors text-brand-text dark:text-dark-text"
              disabled={isLoading}
              required
            />
          </div>
           {error && <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white dark:text-dark-text bg-brand-primary dark:bg-dark-primary hover:bg-brand-secondary dark:hover:bg-dark-subtle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-dark-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Sign Up'
              )}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-brand-text/70 dark:text-dark-text/70">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="font-medium text-brand-secondary dark:text-dark-secondary hover:text-brand-primary dark:hover:text-dark-primary ml-1" disabled={isLoading}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;