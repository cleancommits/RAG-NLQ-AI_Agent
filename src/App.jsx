import React, { useState, useEffect } from 'react';
import Chatbot from './components/Chatbot';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    console.log('Initializing theme:', savedTheme);
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('Toggling to theme:', newTheme);
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 shadow-md">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📄</span>
            <h1 className="text-xl font-bold">RAG + NLQ POC</h1>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <MoonIcon className="h-6 w-6 text-gray-600" />
            ) : (
              <SunIcon className="h-6 w-6 text-yellow-400" />
            )}
          </button>
        </div>
      </header>
      <main className="pt-16">
        <div className="max-w-4xl mx-auto">
          <Chatbot />
        </div>
      </main>
    </div>
  );
}

export default App;