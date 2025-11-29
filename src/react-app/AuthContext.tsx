// src/react-app/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Caminho corrigido
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '@/shared/types';

export interface CurrentUser extends User {
  profile?: UserProfile;
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
      // Create a promise that rejects after 5 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session initialization timed out')), 5000)
      );

      try {
        console.log("AuthContext: getInitialSession try");

        // Race between session fetch and timeout
        await Promise.race([
          (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);

            if (session?.user) {
              console.log("AuthContext: User found in session, fetching profile");
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, role, subscription_status')
                .eq('id', session.user.id)
                .single();

              setCurrentUser({ ...session.user, profile: profile || undefined });
            } else {
              console.log("AuthContext: No user in session");
              setCurrentUser(null);
            }
          })(),
          timeoutPromise
        ]);
      } catch (error) {
        console.error("AuthContext: Error getting initial session:", error);
        // If timeout or error, we assume no user or let them log in again
        setCurrentUser(null);
        setSession(null);
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
          console.log("AuthContext: User found in session, fetching profile for:", session.user.id);

          let profile = null;
          try {
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timed out')), 5000)
            );

            // Race the fetch against the timeout
            const data = await Promise.race([
              (async () => {
                const { data, error } = await supabase
                  .from('profiles')
                  .select('id, role, subscription_status')
                  .eq('id', session.user.id)
                  .single();
                if (error) throw error;
                return data;
              })(),
              timeoutPromise
            ]) as any; // Type casting for simplicity in this context

            profile = data;
          } catch (err) {
            console.error("AuthContext: Exception or timeout fetching profile:", err);
          }

          console.log("AuthContext: Setting currentUser (with or without profile)");
          // Set current user even if profile is missing, to avoid login loop
          setCurrentUser({ ...session.user, profile: profile || undefined });
        } else {
          console.log("AuthContext: No user in session (onAuthStateChange)");
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("AuthContext: Error in onAuthStateChange:", error);
        // Only reset if session is truly invalid
        if (!session) {
          setCurrentUser(null);
        }
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
