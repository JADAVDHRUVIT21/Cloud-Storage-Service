import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { supabase } from "../services/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(true);

  const createBackendSession = async (supabaseUser) => {
    if (!supabaseUser?.id || !supabaseUser?.email) {
      throw new Error("Invalid social login user.");
    }

    const provider =
      supabaseUser.app_metadata?.provider ||
      "social";

    const fullName =
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      supabaseUser.email.split("@")[0];

    const response = await api.post("/auth/social-login", {
      supabase_user_id: supabaseUser.id,
      full_name: fullName,
      email: supabaseUser.email,
      provider,
    });

    const data = response.data;

    localStorage.setItem(
      "access_token",
      data.access_token
    );

    localStorage.setItem(
      "refresh_token",
      data.refresh_token
    );

    const socialUser = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      full_name: fullName,
      avatar_url:
        supabaseUser.user_metadata?.avatar_url ||
        supabaseUser.user_metadata?.picture ||
        null,
      provider,
    };

    localStorage.setItem(
      "user",
      JSON.stringify(socialUser)
    );

    setUser(socialUser);

    return data;
  };

  // ========== UPDATE USER FUNCTION ==========
  const updateUser = (updatedUserData) => {
    // Merge the updated data with existing user
    const updatedUser = { ...user, ...updatedUserData };
    
    // Update state
    setUser(updatedUser);
    
    // Update localStorage
    localStorage.setItem("user", JSON.stringify(updatedUser));
    
    return updatedUser;
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const backendToken =
          localStorage.getItem("access_token");

        if (backendToken) {
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          await createBackendSession(
            session.user
          );
        }
      } catch (error) {
        console.error(
          "Authentication initialization error:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (
          event === "SIGNED_IN" &&
          session?.user
        ) {
          try {
            await createBackendSession(
              session.user
            );
          } catch (error) {
            console.error(
              "Social login backend error:",
              error
            );
          }
        }

        if (event === "SIGNED_OUT") {
          localStorage.removeItem(
            "supabase_access_token"
          );
          localStorage.removeItem(
            "access_token"
          );
          localStorage.removeItem(
            "refresh_token"
          );
          localStorage.removeItem("user");

          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const response = await api.post(
      "/auth/login",
      {
        email,
        password,
      }
    );

    const data = response.data;

    localStorage.setItem(
      "access_token",
      data.access_token
    );

    localStorage.setItem(
      "refresh_token",
      data.refresh_token
    );

    const savedUser = {
      email,
      provider: "email",
    };

    localStorage.setItem(
      "user",
      JSON.stringify(savedUser)
    );

    setUser(savedUser);

    return data;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error(
        "Supabase logout error:",
        error
      );
    }

    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "refresh_token"
    );

    localStorage.removeItem(
      "supabase_access_token"
    );

    localStorage.removeItem("user");

    setUser(null);
  };

  const isAuthenticated = !!(
    user &&
    localStorage.getItem("access_token")
  );

  const value = {
    user,
    setUser,
    updateUser, // <-- NEW: Add this to the context value
    login,
    logout,
    loading,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}