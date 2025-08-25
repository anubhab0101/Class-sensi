import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";

export function AppHeader() {
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['/api/teachers'],
    queryFn: async () => {
      const response = await fetch('/api/teachers');
      if (!response.ok) throw new Error('Failed to fetch teachers');
      return response.json();
    }
  });
  const teacher = teachers[0];
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/" },
    { name: "Students", href: "/students" },
    { name: "Attendance", href: "/attendance" },
  ];

  if (isLoading) {
    return (
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">ClassWatch</h1>
            </div>
            <div className="text-slate-400">Loading...</div>
          </div>
        </div>
      </header>
    );
  }

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
          <div className="flex items-center space-x-4 relative">
            <button 
              className="text-slate-400 hover:text-slate-500"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
            </button>

            <div className="group relative flex items-center space-x-2 cursor-pointer">
              <img 
                className="h-8 w-8 rounded-full" 
                src={teacher?.photoUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(teacher?.name || "Teacher") + "&background=random"}
                alt="Teacher profile"
                data-testid="img-profile"
              />
              <span className="text-sm font-medium" data-testid="text-teacher-name">{teacher?.name || "Teacher"}</span>

              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg z-50 p-4" style={{minWidth: 240}}>
                <div className="flex items-center space-x-4 mb-2">
                  <img
                    src={teacher?.photoUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(teacher?.name || "Teacher") + "&background=random"}
                    alt="Teacher profile"
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                    data-testid="img-teacher-current-photo"
                  />
                  <div>
                    <h3 className="text-lg font-semibold" data-testid="text-teacher-name">{teacher?.name || "Teacher"}</h3>
                    <p className="text-slate-600 text-sm" data-testid="text-teacher-email">{teacher?.email || ""}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500">Profile created: {teacher?.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : "-"}</div>
                <div className="mt-3">
                  <a href="/teacher-profile" className="text-primary hover:underline text-sm">Edit Profile</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}