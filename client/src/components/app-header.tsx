import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Settings, LogOut, User, ChevronDown, Users, Calendar, Home } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

interface AppHeaderProps {
  isMonitoring?: boolean;
}

export function AppHeader({ isMonitoring = false }: AppHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [location, setLocation] = useLocation();

  const handleSettingsClick = () => {
    setIsSettingsOpen(!isSettingsOpen);
    // Navigate to settings page
    setLocation("/settings");
  };

  const handleProfileClick = () => {
    // Navigate to profile page
    setLocation("/teacher-profile");
  };

  const handleLogout = () => {
    // Add logout logic here
    console.log("Logout clicked");
    // You can add actual logout functionality
  };

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Students", href: "/students", icon: Users },
    { name: "Attendance", href: "/attendance", icon: Calendar },
  ];

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Main Header */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-slate-900">Class Sensi</h1>
            {isMonitoring && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-success/10 border border-success/30 rounded-full">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-success">Monitoring Active</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSettingsClick}
              className="hover:bg-slate-100"
            >
              <Settings className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-slate-100">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/teacher-avatar.jpg" alt="Teacher" />
                    <AvatarFallback>TC</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="border-t border-slate-200">
          <nav className="flex space-x-8">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => setLocation(item.href)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}