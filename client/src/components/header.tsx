import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";

const Header = () => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  // Get user initials for avatar
  const userInitials = user?.fullName
    ? user.fullName.split(" ").map(part => part[0]).join("").toUpperCase()
    : "U";
  
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <div className="relative">
                <h1 className="text-2xl font-montserrat font-bold text-[#004BA0]">
                  MONEY<span className="text-[#ED1A37]">BALL</span>
                </h1>
                <span className="absolute -top-1 -right-6 text-xs bg-[#F7C430] text-white px-2 py-0.5 rounded-full transform rotate-12">
                  2025
                </span>
              </div>
            </Link>
          </div>
          
          <nav className="flex items-center space-x-4">
            <Link 
              href="/" 
              className={`nav-item px-3 py-2 ${
                location === "/" 
                  ? "border-b-3 border-secondary text-primary-dark font-medium" 
                  : "text-gray-600 hover:text-primary font-medium"
              }`}
            >
              Matches
            </Link>
            <Link 
              href="/my-bets" 
              className={`nav-item px-3 py-2 ${
                location === "/my-bets" 
                  ? "border-b-3 border-secondary text-primary-dark font-medium" 
                  : "text-gray-600 hover:text-primary font-medium"
              }`}
            >
              My Bets
            </Link>
            <Link 
              href="/leaderboard" 
              className={`nav-item px-3 py-2 ${
                location === "/leaderboard" 
                  ? "border-b-3 border-secondary text-primary-dark font-medium" 
                  : "text-gray-600 hover:text-primary font-medium"
              }`}
            >
              Leaderboard
            </Link>
            {user?.role === "admin" && (
              <Link 
                href="/admin" 
                className={`nav-item px-3 py-2 ${
                  location === "/admin" 
                    ? "border-b-3 border-secondary text-primary-dark font-medium" 
                    : "text-gray-600 hover:text-primary font-medium"
                }`}
              >
                Admin
              </Link>
            )}
            
            <div className="relative ml-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#004BA0] to-[#ED1A37] flex items-center justify-center text-white font-bold">
                      {userInitials}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{logoutMutation.isPending ? "Logging out..." : "Log out"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
