import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { PhotoCapture } from "@/components/photo-capture";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserPlus, Search, Edit2, Trash2, Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentSchema, type Student, type InsertStudent } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPhotoCaptureOpen, setIsPhotoCaptureOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch students
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students']
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: async (studentData: InsertStudent) => {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
      if (!response.ok) throw new Error('Failed to create student');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsDialogOpen(false);
      setCapturedPhoto(null);
      form.reset();
      toast({
        title: "Student Added",
        description: "Student has been successfully added to the system"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete student');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: "Student Removed",
        description: "Student has been successfully removed from the system"
      });
    }
  });

  const form = useForm<InsertStudent>({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: {
      name: "",
      studentId: "",
      email: "",
      photoUrl: "",
      isActive: true
    }
  });

  const onSubmit = (data: InsertStudent) => {
    createStudentMutation.mutate(data);
  };

  const handleDelete = (studentId: string, studentName: string) => {
    if (confirm(`Are you sure you want to remove ${studentName} from the system?`)) {
      deleteStudentMutation.mutate(studentId);
    }
  };

  const handlePhotoCapture = (photoDataUrl: string) => {
    setCapturedPhoto(photoDataUrl);
    form.setValue('photoUrl', photoDataUrl);
    setIsPhotoCaptureOpen(false);
  };

  const handleCancelPhotoCapture = () => {
    setIsPhotoCaptureOpen(false);
  };

  const openPhotoCapture = () => {
    setIsPhotoCaptureOpen(true);
  };

  const removePhoto = () => {
    setCapturedPhoto(null);
    form.setValue('photoUrl', '');
  };

  // Filter students based on search query
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Students</h1>
            <p className="text-slate-600">Manage student profiles and information</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-student">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter student's full name" {...field} data-testid="input-student-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter student ID (e.g., STU001)" {...field} data-testid="input-student-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} data-testid="input-student-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Photo</FormLabel>
                        <div className="space-y-4">
                          {/* Photo Preview */}
                          {capturedPhoto && (
                            <div className="flex items-center space-x-4">
                              <img
                                src={capturedPhoto}
                                alt="Student photo"
                                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                                data-testid="img-photo-preview"
                              />
                              <div className="flex-1">
                                <p className="text-sm text-success font-medium">Photo captured successfully!</p>
                                <p className="text-xs text-slate-600">This photo will be used for face recognition.</p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={removePhoto}
                                data-testid="button-remove-photo"
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                          
                          {/* Camera Capture Button */}
                          {!capturedPhoto && (
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                              <Camera className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                              <p className="text-sm text-slate-600 mb-4">
                                Capture a photo for face recognition
                              </p>
                              <Button
                                type="button"
                                onClick={openPhotoCapture}
                                variant="outline"
                                data-testid="button-capture-photo"
                              >
                                <Camera className="mr-2 h-4 w-4" />
                                Take Photo
                              </Button>
                            </div>
                          )}
                          
                          {/* Manual URL Input (Alternative) */}
                          <div className="space-y-2">
                            <Label className="text-xs text-slate-500">Or enter photo URL manually:</Label>
                            <FormControl>
                              <Input 
                                placeholder="Enter photo URL (optional)" 
                                {...field}
                                value={field.value || ''}
                                data-testid="input-student-photo" 
                              />
                            </FormControl>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createStudentMutation.isPending}
                      data-testid="button-save-student"
                    >
                      {createStudentMutation.isPending ? 'Adding...' : 'Add Student'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-students"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Students</p>
                  <p className="text-2xl font-bold text-slate-800" data-testid="text-total-students">{students.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Students</p>
                  <p className="text-2xl font-bold text-success" data-testid="text-active-students">
                    {students.filter(s => s.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-slate-600">Inactive Students</p>
                  <p className="text-2xl font-bold text-slate-400" data-testid="text-inactive-students">
                    {students.filter(s => !s.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={student.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`}
                      alt={student.name}
                      className="h-12 w-12 rounded-full object-cover"
                      data-testid={`img-student-${student.studentId}`}
                    />
                    <div>
                      <h3 className="font-semibold text-slate-800" data-testid={`text-name-${student.studentId}`}>
                        {student.name}
                      </h3>
                      <p className="text-sm text-slate-600" data-testid={`text-id-${student.studentId}`}>
                        ID: {student.studentId}
                      </p>
                      {student.email && (
                        <p className="text-sm text-slate-500" data-testid={`text-email-${student.studentId}`}>
                          {student.email}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <Badge 
                      variant={student.isActive ? "default" : "secondary"}
                      className={student.isActive ? "bg-success/10 text-success" : ""}
                    >
                      {student.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`button-edit-${student.studentId}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(student.id, student.name)}
                        data-testid={`button-delete-${student.studentId}`}
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStudents.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No students found</h3>
            <p className="text-slate-600">Try adjusting your search terms</p>
          </div>
        )}

        {students.length === 0 && !searchQuery && (
          <div className="text-center py-12">
            <UserPlus className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No students registered</h3>
            <p className="text-slate-600 mb-4">Get started by adding your first student</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
        )}
      </div>

      {/* Photo Capture Modal */}
      <PhotoCapture
        isOpen={isPhotoCaptureOpen}
        onPhotoCapture={handlePhotoCapture}
        onCancel={handleCancelPhotoCapture}
      />
    </div>
  );
}
