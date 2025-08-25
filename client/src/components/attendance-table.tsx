import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import type { Student, AttendanceRecord } from "@shared/schema";

interface AttendanceTableProps {
  classId?: string;
  className?: string;
}

export function AttendanceTable({ classId, className = "CS-101" }: AttendanceTableProps) {
  // Fetch students
  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/students']
  });

  // Fetch attendance records for current class
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance', { classId: classId || '' }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (classId) params.set('classId', classId);
      const res = await fetch(`/api/attendance${params.toString() ? `?${params.toString()}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch attendance');
      return res.json();
    }
  });

  const isLoading = studentsLoading || attendanceLoading;

  const getStudentAttendance = (studentId: string) => {
    return attendanceRecords.find(record => record.studentId === studentId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Present</Badge>;
      case 'late':
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Late</Badge>;
      case 'absent':
        return <Badge className="bg-danger/10 text-danger hover:bg-danger/20">Absent</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getWarningBadge = (timePresent: number, hasWarnings: boolean) => {
    if (hasWarnings) {
      return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Mobile</Badge>;
    }
    if (timePresent < 30) {
      return <Badge className="bg-danger/10 text-danger hover:bg-danger/20">Not Detected</Badge>;
    }
    return <span className="text-sm text-slate-500">None</span>;
  };

  const formatTimePresent = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes} mins`;
  };

  const formatLastSeen = (lastSeen?: Date | null) => {
    if (!lastSeen) return 'Never';
    
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffMinutes === 0) return 'Now';
    if (diffMinutes === 1) return '1 min ago';
    if (diffMinutes < 60) return `${diffMinutes} mins ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Student Attendance</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600" data-testid="text-class-name">Class: {className}</span>
              <span className="text-sm text-slate-400">|</span>
              <span className="text-sm text-slate-600" data-testid="text-student-count">
                {students.length} Students
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              data-testid="button-filter"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Time Present
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Warnings
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Last Seen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {students.map((student) => {
              const attendance = getStudentAttendance(student.id);
              const timePresent = attendance?.timePresent || 0;
              const status = attendance?.status || 'absent';
              const hasWarnings = status === 'present' && Math.random() > 0.7; // Mock warning logic
              
              return (
                <tr key={student.id} data-testid={`student-row-${student.studentId}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img 
                        className="h-10 w-10 rounded-full" 
                        src={student.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`}
                        alt={`${student.name} photo`}
                        data-testid={`img-student-${student.studentId}`}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900" data-testid={`text-student-name-${student.studentId}`}>
                          {student.name}
                        </div>
                        <div className="text-sm text-slate-500" data-testid={`text-student-id-${student.studentId}`}>
                          ID: {student.studentId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" data-testid={`status-${student.studentId}`}>
                    {getStatusBadge(status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900" data-testid={`time-present-${student.studentId}`}>
                    {formatTimePresent(timePresent)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" data-testid={`warnings-${student.studentId}`}>
                    {getWarningBadge(timePresent, hasWarnings)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" data-testid={`last-seen-${student.studentId}`}>
                    {formatLastSeen(attendance?.lastSeen)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      data-testid={`button-edit-${student.studentId}`}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
