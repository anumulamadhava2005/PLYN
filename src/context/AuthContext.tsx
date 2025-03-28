import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, phoneNumber?: string, age?: number, gender?: string, isMerchant?: boolean) => Promise<{ user: User | null; session: Session | null; } | undefined>;
  signOut: () => Promise<void>;
  userProfile: { 
    username: string; 
    phoneNumber?: string; 
    age?: number; 
    gender?: string;
    isMerchant?: boolean;
  } | null;
  isMerchant: boolean;
  merchantLogin: (email: string, password: string) => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ 
    username: string; 
    phoneNumber?: string; 
    age?: number; 
    gender?: string;
    isMerchant?: boolean;
  } | null>(null);
  const [isMerchant, setIsMerchant] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("AuthContext mounted, setting up auth state change listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id);
        } else {
          setUserProfile(null);
          setIsMerchant(false);
        }

        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "You've been signed out successfully.",
          });
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession ? "Session found" : "No session");
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        await fetchUserProfile(currentSession.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for ID:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('username, phone_number, age, gender, is_merchant')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (!data) {
        console.error('No profile found for user:', userId);
        return;
      }

      console.log("User profile data:", data);
      const isMerchantStatus = data.is_merchant || false;
      
      setUserProfile({
        username: data.username,
        phoneNumber: data.phone_number,
        age: data.age,
        gender: data.gender,
        isMerchant: isMerchantStatus
      });
      
      setIsMerchant(isMerchantStatus);
      console.log("Set isMerchant state to:", isMerchantStatus);
      
      if (isMerchantStatus) {
        const { data: merchantData, error: merchantError } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (!merchantError && merchantData) {
          console.log('Merchant data found:', merchantData);
        } else {
          console.log('No merchant data found or error:', merchantError);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in for:", email);
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }
      
      console.log("Sign in successful:", data.user?.id);
    } catch (error: any) {
      console.error("Sign in error details:", error);
      toast({
        title: "Sign in failed",
        description: error.message || "An error occurred during sign in.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const merchantLogin = async (email: string, password: string) => {
    try {
      console.log("Attempting merchant login for:", email);
      
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Merchant login error:", error);
        throw error;
      }
      
      console.log("Sign in successful, checking merchant status for ID:", data.user?.id);
      
      if (!data.user) {
        throw new Error("Login failed. User data not available.");
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_merchant, username, phone_number, age, gender')
        .eq('id', data.user.id)
        .maybeSingle();
        
      if (profileError) {
        console.error("Error fetching profile data:", profileError);
        throw new Error("Could not verify merchant status. Please try again.");
      }
      
      if (!profileData) {
        console.error("No profile found for user:", data.user.id);
        throw new Error("User profile not found. Please contact support.");
      }
      
      if (!profileData.is_merchant) {
        console.error("Non-merchant attempted to log in as merchant");
        await supabase.auth.signOut();
        throw new Error("This account is not registered as a merchant. Please sign up as a merchant or use the regular login.");
      }
      
      console.log("Setting merchant status to true for user:", data.user.id);
      setUserProfile({
        username: profileData.username,
        phoneNumber: profileData.phone_number,
        age: profileData.age,
        gender: profileData.gender,
        isMerchant: true
      });
      
      setIsMerchant(true);
      
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
        
      if (merchantError) {
        console.error("Error fetching merchant profile:", merchantError);
      } else if (!merchantData) {
        console.error("No merchant data found for user:", data.user.id);
      } else {
        console.log("Merchant data successfully fetched:", merchantData);
      }
      
      toast({
        title: "Welcome back, Merchant!",
        description: "You've successfully signed in to your merchant account.",
      });
      
      return data;
      
    } catch (error: any) {
      console.error("Merchant login error details:", error);
      toast({
        title: "Merchant login failed",
        description: error.message || "An error occurred during login.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    username: string, 
    phoneNumber?: string, 
    age?: number, 
    gender?: string,
    isMerchant: boolean = false
  ) => {
    try {
      console.log("Starting signup process");
      console.log("Checking if username exists:", username);
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username);
        
      if (checkError) {
        console.error("Error checking username:", checkError);
        throw checkError;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        console.error("Username already exists");
        throw new Error("Username already exists. Please choose a different username.");
      }
      
      const uniqueUsername = username;
      
      console.log("Signing up user with email:", email);
      console.log("Is merchant flag:", isMerchant);
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: uniqueUsername,
            phone_number: phoneNumber,
            age,
            gender,
            is_merchant: isMerchant,
          },
        },
      });

      if (error) {
        console.error("Sign up error:", error);
        throw error;
      }
      
      console.log("Sign up successful:", data);
      
      toast({
        title: "Account created",
        description: "Your account has been created successfully!",
      });
      
      return data;
    } catch (error: any) {
      console.error("Sign up error details:", error);
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("Attempting to sign out...");
      
      // Clear all auth state after successful signOut from Supabase
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setIsMerchant(false);
      
      // Force clear any localStorage items that might be persisting the session
      window.localStorage.removeItem('supabase.auth.token');
      
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
      
      // Important: Call supabase signOut first before clearing state
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Supabase sign out error:", error);
        throw error;
      }
      
      console.log("Sign out successful");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: error.message || "An error occurred during sign out.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      userProfile, 
      isMerchant,
      merchantLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
