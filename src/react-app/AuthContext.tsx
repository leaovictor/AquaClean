// src/react-app/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Caminho corrigido
import type { Session, User } from '@supabase/supabase-js';

interface Profile {
  role?: string;
}

export interface CurrentUser extends User {
  profile?: Profile;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthContext: useEffect started");
    const getInitialSession = async () => {
      try {
        console.log("AuthContext: getInitialSession try");
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session?.user) {
          console.log("AuthContext: User found in session, fetching profile");
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          setCurrentUser({ ...session.user, profile });
        } else {
          console.log("AuthContext: No user in session");
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("AuthContext: Error getting initial session:", error);
        setCurrentUser(null);
      } finally {
        console.log("AuthContext: getInitialSession finally, setting loading to false");
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("AuthContext: onAuthStateChange triggered", _event);
      try {
        setSession(session);

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          setCurrentUser({ ...session.user, profile });
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("AuthContext: Error in onAuthStateChange:", error);
        setCurrentUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    session,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};
