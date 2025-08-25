import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Settings, LogOut } from "lucide-react";

interface AppHeaderProps {
  isMonitoring?: boolean;
}

export function AppHeader({ isMonitoring = false }: AppHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
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
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/teacher-avatar.jpg" alt="Teacher" />
              <AvatarFallback>TC</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}