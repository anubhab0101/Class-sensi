import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, Edit, Save, X, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Student, AttendanceRecord, Class } from "@shared/schema";

interface AttendanceTableProps {
  classId?: string;
  className?: string;
}

interface EditAttendanceData {
  status: string;
  timePresent: number;
  lastSeen?: Date;
}

export function AttendanceTable({ classId, className = "CS-101" }: AttendanceTableProps) {
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditAttendanceData>({
    status: 'absent',
    timePresent: 0
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { toast } = useToast();

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

  // Fetch class information for duration and threshold
  const { data: classInfo } = useQuery<Class>({
    queryKey: ['/api/classes', classId],
    queryFn: async () => {
      if (!classId) return null;
      const res = await fetch(`/api/classes/${classId}`);
      if (!res.ok) throw new Error('Failed to fetch class');
      return res.json();
    },
    enabled: !!classId
  });

  // Update attendance record mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AttendanceRecord> }) => {
      const response = await fetch(`/api/attendance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update attendance');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      toast({
        title: "Attendance Updated",
        description: "Student attendance record has been updated successfully.",
        variant: "default"
      });
      setEditingRecord(null);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update attendance record. Please try again.",
        variant: "destructive"
      });
    }
  });

  const isLoading = studentsLoading || attendanceLoading;

  const getStudentAttendance = (studentId: string) => {
    return attendanceRecords.find(record => record.studentId === studentId);
  };

  const handleEditClick = (studentId: string) => {
    const attendance = getStudentAttendance(studentId);
    if (attendance) {
      setEditData({
        status: attendance.status || 'absent',
        timePresent: attendance.timePresent || 0,
        lastSeen: attendance.lastSeen ? new Date(attendance.lastSeen) : undefined
      });
      setEditingRecord(studentId);
    }
  };

  const handleSaveEdit = (studentId: string) => {
    const attendance = getStudentAttendance(studentId);
    if (attendance) {
      updateAttendanceMutation.mutate({
        id: attendance.id,
        updates: editData
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditData({ status: 'absent', timePresent: 0 });
  };

  // Filter students based on search and status
  const filteredStudents = students.filter(student => {
    const attendance = getStudentAttendance(student.id);
    const timePresent = attendance?.timePresent || 0;
    const status = attendance?.status || 'absent';
    
    // Calculate actual status based on class settings
    let actualStatus = 'absent';
    if (classInfo?.duration && classInfo?.attendanceThreshold !== undefined && classInfo?.attendanceThreshold !== null) {
      const attendancePercentage = (timePresent / classInfo.duration) * 100;
      if (attendancePercentage >= classInfo.attendanceThreshold) {
        actualStatus = 'present';
      } else if (timePresent > 0 && attendancePercentage >= 25) {
        actualStatus = 'late';
      }
    }

    // Search filter
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "all" || actualStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    if (!classInfo) {
      toast({
        title: "Export Failed",
        description: "No class information available for export.",
        variant: "destructive"
      });
      return;
    }

    const csvData = [
      ['Student Name', 'Student ID', 'Status', 'Time Present (mins)', 'Last Seen', 'Class', 'Date'],
      ...filteredStudents.map(student => {
        const attendance = getStudentAttendance(student.id);
        const timePresent = attendance?.timePresent || 0;
        const status = attendance?.status || 'absent';
        const lastSeen = attendance?.lastSeen ? new Date(attendance.lastSeen).toLocaleString() : 'Never';
        
        return [
          student.name,
          student.studentId,
          status,
          timePresent.toString(),
          lastSeen,
          className,
          new Date().toLocaleDateString()
        ];
      })
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${className}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Attendance data exported to CSV for ${className}`,
      variant: "default"
    });
  };

  const getStatusBadge = (status: string, timePresent: number, classDuration?: number, attendanceThreshold?: number) => {
    // If we have class duration and attendance threshold, calculate based on actual attendance
    if (classDuration && attendanceThreshold !== undefined) {
      const attendancePercentage = (timePresent / classDuration) * 100;
      
      if (attendancePercentage >= attendanceThreshold) {
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Present</Badge>;
      } else if (timePresent > 0 && attendancePercentage >= 25) {
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Late</Badge>;
      } else {
        return <Badge className="bg-danger/10 text-danger hover:bg-danger/20">Absent</Badge>;
      }
    }
    
    // Fallback logic if no class duration available
    if (timePresent > 0) {
      if (timePresent >= 45) { // Assume 45+ minutes means present for most of class
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Present</Badge>;
      } else if (timePresent >= 15) { // 15+ minutes means late
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Late</Badge>;
      }
    }
    
    // If no time present, show absent
    return <Badge className="bg-danger/10 text-danger hover:bg-danger/20">Absent</Badge>;
  };

  const getWarningBadge = (timePresent: number, hasWarnings: boolean, lastSeen?: Date | null) => {
    if (hasWarnings) {
      return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Mobile</Badge>;
    }
    
    // Check if student was recently detected (within last 5 minutes)
    if (lastSeen) {
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
      if (diffMinutes > 5) {
        return <Badge className="bg-danger/10 text-danger hover:bg-danger/20">Not Detected</Badge>;
      }
    }
    
    if (timePresent === 0) {
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
                {filteredStudents.length} Students
              </span>
              {classInfo && (
                <>
                  <span className="text-sm text-slate-400">|</span>
                  <span className="text-sm text-slate-600">
                    Threshold: {classInfo.attendanceThreshold}%
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                data-testid="button-filter"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToCSV}
                data-testid="button-export-csv"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        {isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search-students" className="text-sm font-medium text-slate-700">
                  Search Students
                </Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    id="search-students"
                    placeholder="Search by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status-filter" className="text-sm font-medium text-slate-700">
                  Status Filter
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}
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
            {filteredStudents.map((student) => {
              const attendance = getStudentAttendance(student.id);
              const timePresent = attendance?.timePresent || 0;
              const status = attendance?.status || 'absent';
              // Check if student has any active behavior warnings
              const hasWarnings = false; // This should be fetched from behavior warnings API
              
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
                    {getStatusBadge(status, timePresent, classInfo?.duration || undefined, classInfo?.attendanceThreshold || undefined)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900" data-testid={`time-present-${student.studentId}`}>
                    {formatTimePresent(timePresent)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" data-testid={`warnings-${student.studentId}`}>
                    {getWarningBadge(timePresent, hasWarnings, attendance?.lastSeen)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" data-testid={`last-seen-${student.studentId}`}>
                    {formatLastSeen(attendance?.lastSeen)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditClick(student.id)}
                          data-testid={`button-edit-${student.studentId}`}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Edit Attendance - {student.name}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">
                              Status
                            </Label>
                            <Select 
                              value={editData.status} 
                              onValueChange={(value) => setEditData({...editData, status: value})}
                            >
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="late">Late</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="timePresent" className="text-right">
                              Time Present
                            </Label>
                            <Input
                              id="timePresent"
                              type="number"
                              value={editData.timePresent}
                              onChange={(e) => setEditData({...editData, timePresent: parseInt(e.target.value) || 0})}
                              className="col-span-3"
                              placeholder="Minutes"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={handleCancelEdit}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                          <Button onClick={() => handleSaveEdit(student.id)}>
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
