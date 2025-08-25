import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Edit2, Save, X, User, Camera, ChevronDown, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeacherSchema, type Teacher, type InsertTeacher } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TeacherProfile() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const { toast } = useToast();

  // Fetch all teachers
  const { data: teachers = [], isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers']
  });

  // Fetch selected teacher
  const { data: selectedTeacher } = useQuery<Teacher>({
    queryKey: ['/api/teachers', selectedTeacherId],
    queryFn: async () => {
      if (!selectedTeacherId) return teachers[0] || null;
      const res = await fetch(`/api/teachers/${selectedTeacherId}`);
      if (!res.ok) throw new Error('Failed to fetch teacher');
      return res.json();
    },
    enabled: !!selectedTeacherId || teachers.length > 0
  });

  // Create teacher mutation
  const createTeacherMutation = useMutation({
    mutationFn: async (teacherData: InsertTeacher) => {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData)
      });
      if (!response.ok) throw new Error('Failed to create teacher');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Teacher Created",
        description: "New teacher profile has been created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create teacher profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update teacher mutation
  const updateTeacherMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertTeacher> }) => {
      const response = await fetch(`/api/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update teacher');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      setIsEditDialogOpen(false);
      setEditingTeacher(null);
      editForm.reset();
      toast({
        title: "Profile Updated",
        description: "Teacher profile has been updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const editForm = useForm<InsertTeacher>({
    resolver: zodResolver(insertTeacherSchema),
    defaultValues: {
      name: "",
      email: "",
      photoUrl: "",
      isActive: true
    }
  });

  const createForm = useForm<InsertTeacher>({
    resolver: zodResolver(insertTeacherSchema),
    defaultValues: {
      name: "",
      email: "",
      photoUrl: "",
      isActive: true
    }
  });

  const onEditSubmit = (data: InsertTeacher) => {
    if (editingTeacher) {
      updateTeacherMutation.mutate({
        id: editingTeacher.id,
        updates: data
      });
    }
  };

  const onCreateSubmit = (data: InsertTeacher) => {
    createTeacherMutation.mutate(data);
  };

  const handleEditClick = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    editForm.reset({
      name: teacher.name,
      email: teacher.email,
      photoUrl: teacher.photoUrl || "",
      isActive: teacher.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
  };

  // Set initial teacher if none selected
  if (teachers.length > 0 && !selectedTeacherId && !selectedTeacher) {
    setSelectedTeacherId(teachers[0].id);
  }

  if (teachersLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-64 bg-slate-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <User className="h-24 w-24 text-slate-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-slate-800 mb-4">No Teachers Found</h1>
            <p className="text-slate-600 mb-8">Get started by creating your first teacher profile.</p>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Create First Teacher
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Teacher Profile</DialogTitle>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter teacher's full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="photoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Photo URL (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter photo URL (optional)" 
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createTeacherMutation.isPending}
                      >
                        {createTeacherMutation.isPending ? 'Creating...' : 'Create Teacher'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedTeacher) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">No Teacher Found</h1>
            <p className="text-slate-600">Please add a teacher profile first.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Teacher Profile</h1>
            <p className="text-slate-600">Manage teacher profiles and information</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div>
              <Label htmlFor="teacher-select" className="text-sm font-medium text-slate-700">
                Select Teacher
              </Label>
              <Select value={selectedTeacherId} onValueChange={handleTeacherChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={() => handleEditClick(selectedTeacher)}
              variant="outline"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Teacher
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Teacher Profile</DialogTitle>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter teacher's full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <FormControl>
                              <Input type="email" placeholder="Enter email address" {...field} />
                            </FormControl>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="photoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Photo URL (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter photo URL (optional)" 
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createTeacherMutation.isPending}
                      >
                        {createTeacherMutation.isPending ? 'Creating...' : 'Create Teacher'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Teacher Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={selectedTeacher.photoUrl || undefined} alt={selectedTeacher.name} />
                <AvatarFallback className="text-2xl">
                  {selectedTeacher.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Full Name</Label>
                  <p className="text-lg text-slate-900">{selectedTeacher.name}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-700">Email</Label>
                  <p className="text-lg text-slate-900">{selectedTeacher.email}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-700">Status</Label>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${selectedTeacher.isActive ? 'bg-success' : 'bg-slate-400'}`}></div>
                    <span className={`text-sm ${selectedTeacher.isActive ? 'text-success' : 'text-slate-500'}`}>
                      {selectedTeacher.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-700">Member Since</Label>
                  <p className="text-sm text-slate-600">
                    {selectedTeacher.createdAt ? new Date(selectedTeacher.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Classes</p>
                  <p className="text-2xl font-bold text-slate-800">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Classes</p>
                  <p className="text-2xl font-bold text-success">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Students</p>
                  <p className="text-2xl font-bold text-slate-800">156</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile - {editingTeacher?.name}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter teacher's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Photo URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter photo URL (optional)" 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTeacherMutation.isPending}
                >
                  {updateTeacherMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}