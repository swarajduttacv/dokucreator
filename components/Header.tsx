import React from 'react';
import { User } from '../types';
import { LogoIcon, UserIcon, LogoutIcon, SunIcon, MoonIcon } from './Icons';

interface HeaderProps {
    user: User;
    onLogout: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, theme, toggleTheme }) => {
    return (
        <header className="flex flex-wrap items-center justify-between gap-y-4 pb-6 border-b border-brand-subtle dark:border-dark-subtle">
          <div className="flex items-start space-x-3">
            <LogoIcon className="h-12 w-12 text-brand-primary dark:text-dark-primary flex-shrink-0"/>
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-brand-secondary dark:text-dark-secondary tracking-tight">
                DokuCreator
                </h1>
                <p className="text-xs text-brand-text/60 dark:text-dark-text/60">by ~Swaraj</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <div className="flex items-center space-x-2 bg-brand-background/50 dark:bg-dark-background py-1.5 px-3 rounded-full border border-brand-subtle dark:border-dark-subtle">
                <UserIcon className="h-5 w-5 text-brand-secondary dark:text-dark-secondary" />
                <span className="font-semibold text-brand-text dark:text-dark-text text-sm hidden sm:block">{user.username}</span>
            </div>
            <button
                onClick={toggleTheme}
                className="flex items-center justify-center h-9 w-9 rounded-full text-gray-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-dark-primary hover:bg-brand-background/50 dark:hover:bg-dark-surface transition-colors"
                title="Toggle theme"
            >
                {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
            </button>
            <button 
                onClick={onLogout} 
                className="flex items-center justify-center h-9 w-9 rounded-full text-gray-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-dark-primary hover:bg-brand-background/50 dark:hover:bg-dark-surface transition-colors"
                title="Logout"
            >
                <LogoutIcon className="h-6 w-6" />
            </button>
          </div>
        </header>
    );
};

export default Header;