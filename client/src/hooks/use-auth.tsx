import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, AuthenticatedUser, InsertUser, LoginData } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AuthenticatedUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<AuthenticatedUser, Error, InsertUser>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser,
  } = useQuery<AuthenticatedUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 0,
    gcTime: 0,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const loginRes = await apiRequest("POST", "/api/login", credentials);
      return await loginRes.json() as AuthenticatedUser;
    },
    onSuccess: async (userData: AuthenticatedUser) => {
      // Set the user data in cache
      queryClient.setQueryData(["/api/user"], userData);
      
      // Show success message
      toast({
        title: "Login successful",
        description: `Welcome, ${userData.fullName}!`,
      });

      // Refetch user data to ensure session is established
      try {
        const { data: refreshedUser } = await refetchUser();
        if (refreshedUser) {
          // Only navigate if we can confirm the session is established
          navigate("/");
          // Then invalidate other queries
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        }
      } catch (error) {
        console.error("Failed to verify session:", error);
        queryClient.setQueryData(["/api/user"], null);
        toast({
          title: "Session Error",
          description: "Failed to establish session. Please try logging in again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      // Clear any stale user data
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json() as AuthenticatedUser;
    },
    onSuccess: async (userData: AuthenticatedUser) => {
      // Set the user data in cache
      queryClient.setQueryData(["/api/user"], userData);
      
      toast({
        title: "Registration successful",
        description: `Welcome to IPL Bet, ${userData.fullName}!`,
      });

      // Refetch user data to ensure session is established
      try {
        const { data: refreshedUser } = await refetchUser();
        if (refreshedUser) {
          // Only navigate if we can confirm the session is established
          navigate("/");
          // Then invalidate other queries
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        }
      } catch (error) {
        console.error("Failed to verify session:", error);
        queryClient.setQueryData(["/api/user"], null);
        toast({
          title: "Session Error",
          description: "Failed to establish session. Please try registering again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      // Clear any stale user data
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
