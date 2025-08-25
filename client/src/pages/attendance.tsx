import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { AttendanceTable } from "@/components/attendance-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, FileText, TrendingUp } from "lucide-react";
import type { Class, AttendanceRecord } from "@shared/schema";

export default function Attendance() {
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  // Fetch classes
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes']
  });

  // Fetch attendance records
  const { data: attendanceRecords = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance', { classId: selectedClassId || '' }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedClassId) params.set('classId', selectedClassId);
      const res = await fetch(`/api/attendance${params.toString() ? `?${params.toString()}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch attendance');
      return res.json();
    }
  });

  const selectedClass = classes.find(c => c.id === selectedClassId) || classes[0];

  // Calculate statistics based on actual attendance data
  const calculateAttendanceStats = () => {
    if (!selectedClass) return { presentCount: 0, lateCount: 0, absentCount: 0, attendanceRate: 0 };
    
    const classDuration = selectedClass.duration || 60; // Default to 60 minutes
    const threshold = selectedClass.attendanceThreshold || 75; // Default to 75%
    
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    
    attendanceRecords.forEach(record => {
      const timePresent = record.timePresent || 0;
      const attendancePercentage = (timePresent / classDuration) * 100;
      
      if (attendancePercentage >= threshold) {
        presentCount++;
      } else if (attendancePercentage >= 25) {
        lateCount++;
      } else {
        absentCount++;
      }
    });
    
    const totalStudents = attendanceRecords.length;
    const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
    
    return { presentCount, lateCount, absentCount, attendanceRate };
  };

  const { presentCount, lateCount, absentCount, attendanceRate } = calculateAttendanceStats();
  const totalStudents = attendanceRecords.length;

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
  };

  const handleExportAttendance = () => {
    // In a real implementation, this would generate and download a CSV/PDF report
    console.log('Exporting attendance data...');
  };

  const handleGenerateReport = () => {
    // In a real implementation, this would generate a detailed attendance report
    console.log('Generating attendance report...');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Attendance Reports</h1>
            <p className="text-slate-600">View and manage student attendance records</p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Select value={selectedClassId} onValueChange={handleClassChange}>
              <SelectTrigger className="w-[200px]" data-testid="select-class">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline"
              onClick={handleExportAttendance}
              data-testid="button-export"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            
            <Button 
              onClick={handleGenerateReport}
              data-testid="button-generate-report"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">Present</p>
                  <p className="text-2xl font-bold text-success" data-testid="text-present-count">
                    {presentCount}
                  </p>
                </div>
                <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">Late</p>
                  <p className="text-2xl font-bold text-warning" data-testid="text-late-count">
                    {lateCount}
                  </p>
                </div>
                <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">Absent</p>
                  <p className="text-2xl font-bold text-danger" data-testid="text-absent-count">
                    {absentCount}
                  </p>
                </div>
                <div className="w-8 h-8 bg-danger/10 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-danger" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-primary" data-testid="text-attendance-rate">
                    {attendanceRate}%
                  </p>
                </div>
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Class Information */}
        {selectedClass && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Class Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-600">Class Name</p>
                  <p className="text-lg font-semibold text-slate-800" data-testid="text-class-name">
                    {selectedClass.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Duration</p>
                  <p className="text-lg font-semibold text-slate-800" data-testid="text-class-duration">
                    {selectedClass.duration} minutes
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Attendance Threshold</p>
                  <p className="text-lg font-semibold text-slate-800" data-testid="text-class-threshold">
                    {selectedClass.attendanceThreshold}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Table */}
        <AttendanceTable
          classId={selectedClassId}
          className={selectedClass?.name}
        />

        {/* Empty State */}
        {classes.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No classes found</h3>
            <p className="text-slate-600">Create a class to start tracking attendance</p>
          </div>
        )}
      </div>
    </div>
  );
}
