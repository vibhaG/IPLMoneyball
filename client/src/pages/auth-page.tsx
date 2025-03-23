import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registrationSchema,
  loginSchema,
  type InsertUser,
  type LoginData,
} from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  // Login form
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: "user",
    },
  });

  // Handle login form submission
  const handleLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  // Handle registration form submission
  const handleRegister = (data: InsertUser & { confirmPassword: string }) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background-50 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full rounded-none grid grid-cols-2">
            <TabsTrigger
              value="login"
              className="py-4 data-[state=active]:text-primary data-[state=active]:font-bold data-[state=inactive]:text-gray-400 font-montserrat"
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="py-4 data-[state=active]:text-primary data-[state=active]:font-bold data-[state=inactive]:text-gray-400 font-montserrat"
            >
              Register
            </TabsTrigger>
          </TabsList>

          <div className="relative h-1 bg-gradient-to-r from-[#004BA0] via-[#F7C430] to-[#ED1A37]">
            <div className="cricket-ball"></div>
          </div>

          <TabsContent value="login" className="p-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <h2 className="text-3xl font-montserrat font-bold text-[#004BA0]">
                  MONEY<span className="text-[#ED1A37]">BALL</span>
                </h2>
                <span className="absolute -top-2 -right-4 text-xs bg-[#F7C430] text-white px-2 py-0.5 rounded-full transform rotate-12">
                  2025
                </span>
              </div>
            </div>

            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(handleLogin)}
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your username"
                          {...field}
                          className="px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Checkbox
                      id="remember"
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label
                      htmlFor="remember"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Remember me
                    </label>
                  </div>
                  <a
                    href="#"
                    className="text-sm text-primary hover:text-primary-dark"
                  >
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-lg shadow-lg hover:from-primary-dark hover:to-primary transform transition-all duration-300 hover:scale-105"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="register" className="p-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <h2 className="text-3xl font-montserrat font-bold text-[#004BA0]">
                  MONEY<span className="text-[#ED1A37]">BALL</span>
                </h2>
                <span className="absolute -top-2 -right-4 text-xs bg-[#F7C430] text-white px-2 py-0.5 rounded-full transform rotate-12">
                  2025
                </span>
              </div>
            </div>

            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(handleRegister)}
                className="space-y-4"
              >
                <FormField
                  control={registerForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          {...field}
                          className="px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="username"
                          {...field}
                          className="px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center">
                          <RadioGroupItem
                            value="user"
                            id="user"
                            className="h-4 w-4 text-primary focus:ring-primary"
                          />
                          <label
                            htmlFor="user"
                            className="ml-2 block text-sm text-gray-700"
                          >
                            Regular User
                          </label>
                        </div>
                        <div className="flex items-center">
                          <RadioGroupItem
                            value="admin"
                            id="admin"
                            className="h-4 w-4 text-primary focus:ring-primary"
                          />
                          <label
                            htmlFor="admin"
                            className="ml-2 block text-sm text-gray-700"
                          >
                            Admin
                          </label>
                        </div>
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#ED1A37] to-[#BE123C] text-white font-bold rounded-lg shadow-lg hover:from-[#BE123C] hover:to-[#ED1A37] transform transition-all duration-300 hover:scale-105"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending
                    ? "Creating Account..."
                    : "Register"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;
