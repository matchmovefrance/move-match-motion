import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface SessionContextType {
  sessionId: string;
  isSessionReady: boolean;
  getSessionKey: (key: string) => string;
  setSessionData: (key: string, data: any) => void;
  getSessionData: <T>(key: string, defaultValue?: T) => T | null;
  clearSessionData: (key?: string) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [isSessionReady, setIsSessionReady] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Génère un ID de session unique par onglet/navigateur
    const generateSessionId = () => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const userAgent = navigator.userAgent.slice(-10).replace(/[^a-zA-Z0-9]/g, '');
      return `session_${timestamp}_${random}_${userAgent}`;
    };

    // Vérifie si on a déjà un sessionId pour cet onglet
    let currentSessionId = sessionStorage.getItem('app_session_id');
    
    if (!currentSessionId) {
      currentSessionId = generateSessionId();
      sessionStorage.setItem('app_session_id', currentSessionId);
      console.log('🆔 New session created:', currentSessionId);
    } else {
      console.log('🆔 Existing session found:', currentSessionId);
    }

    setSessionId(currentSessionId);
    setIsSessionReady(true);
  }, []);

  // Nettoie les données de session quand l'utilisateur change
  useEffect(() => {
    if (user && sessionId) {
      console.log('👤 User session active:', user.email, 'Session:', sessionId.slice(-8));
    }
  }, [user, sessionId]);

  const getSessionKey = (key: string) => {
    const userPrefix = user?.id ? `user_${user.id.slice(-8)}_` : 'anon_';
    return `${userPrefix}${sessionId}_${key}`;
  };

  const setSessionData = (key: string, data: any) => {
    const sessionKey = getSessionKey(key);
    try {
      localStorage.setItem(sessionKey, JSON.stringify(data));
      console.log('💾 Session data saved:', key, 'for session:', sessionId.slice(-8));
    } catch (error) {
      console.error('❌ Error saving session data:', error);
    }
  };

  const getSessionData = <T,>(key: string, defaultValue?: T): T | null => {
    const sessionKey = getSessionKey(key);
    try {
      const data = localStorage.getItem(sessionKey);
      return data ? JSON.parse(data) : (defaultValue ?? null);
    } catch (error) {
      console.error('❌ Error reading session data:', error);
      return defaultValue ?? null;
    }
  };

  const clearSessionData = (key?: string) => {
    if (key) {
      const sessionKey = getSessionKey(key);
      localStorage.removeItem(sessionKey);
      console.log('🗑️ Session data cleared:', key);
    } else {
      // Nettoie toutes les données de cette session
      const prefix = getSessionKey('');
      Object.keys(localStorage).forEach(storageKey => {
        if (storageKey.startsWith(prefix.slice(0, -1))) {
          localStorage.removeItem(storageKey);
        }
      });
      console.log('🗑️ All session data cleared for session:', sessionId.slice(-8));
    }
  };

  const value = {
    sessionId,
    isSessionReady,
    getSessionKey,
    setSessionData,
    getSessionData,
    clearSessionData
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};