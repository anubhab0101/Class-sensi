import { Link, useLocation } from "wouter";
import { Bell } from "lucide-react";

export function AppHeader() {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/" },
    { name: "Students", href: "/students" },
    { name: "Attendance", href: "/attendance" },
    { name: "Teacher Profile", href: "/teacher-profile" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">ClassWatch</h1>
            </div>
            <nav className="hidden md:ml-10 md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    location === item.href
                      ? "text-primary border-b-2 border-primary"
                      : "text-slate-500 hover:text-slate-700"
                  } pb-4 text-sm font-medium`}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="text-slate-400 hover:text-slate-500"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2">
              <img 
                className="h-8 w-8 rounded-full" 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=32&h=32" 
                alt="Teacher profile"
                data-testid="img-profile"
              />
              <span className="text-sm font-medium" data-testid="text-teacher-name">Dr. Smith</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
