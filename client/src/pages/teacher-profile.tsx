import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, User, Edit3, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PhotoCapture } from "@/components/photo-capture";
import { insertTeacherSchema, type InsertTeacher, type Teacher } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function TeacherProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isPhotoCaptureOpen, setIsPhotoCaptureOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current teacher (for now, we'll use the first teacher or create one)
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['/api/teachers'],
    queryFn: async () => {
      const response = await fetch('/api/teachers');
      if (!response.ok) throw new Error('Failed to fetch teachers');
      return response.json();
    }
  });

  const currentTeacher = teachers[0]; // Use first teacher for now

  const form = useForm<InsertTeacher>({
    resolver: zodResolver(insertTeacherSchema),
    defaultValues: {
      name: currentTeacher?.name || '',
      email: currentTeacher?.email || '',
      photoUrl: currentTeacher?.photoUrl || '',
      isActive: currentTeacher?.isActive ?? true
    }
  });

  // Reset form when teacher data changes
  useEffect(() => {
    if (currentTeacher) {
      form.reset({
        name: currentTeacher.name,
        email: currentTeacher.email,
        photoUrl: currentTeacher.photoUrl || '',
        isActive: currentTeacher.isActive
      });
      setCapturedPhoto(currentTeacher.photoUrl || null);
    }
  }, [currentTeacher, form]);

  const createTeacherMutation = useMutation({
    mutationFn: async (data: InsertTeacher) => {
      const response = await apiRequest('POST', '/api/teachers', data);
      if (!response.ok) throw new Error('Failed to create teacher profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      setIsEditing(false);
      setCapturedPhoto(null);
      toast({
        title: "Profile Created",
        description: "Teacher profile has been created successfully"
      });
    }
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async (data: InsertTeacher) => {
      const response = await apiRequest('PUT', `/api/teachers/${currentTeacher.id}`, data);
      if (!response.ok) throw new Error('Failed to update teacher profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Teacher profile has been updated successfully"
      });
    }
  });

  const onSubmit = (data: InsertTeacher) => {
    if (currentTeacher) {
      updateTeacherMutation.mutate(data);
    } else {
      createTeacherMutation.mutate(data);
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

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Teacher Profile</h1>
          <p className="text-slate-600 mt-2">Manage your teacher profile and access classroom data</p>
        </div>
        {currentTeacher && !isEditing && (
          <Button 
            onClick={() => setIsEditing(true)}
            variant="outline"
            data-testid="button-edit-profile"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {currentTeacher ? 'Teacher Information' : 'Create Teacher Profile'}
          </CardTitle>
          <CardDescription>
            {currentTeacher 
              ? 'Your profile information and photo for the classroom monitoring system'
              : 'Create your teacher profile to access the classroom monitoring system'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!currentTeacher || isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} data-testid="input-teacher-name" />
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} data-testid="input-teacher-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Photo</FormLabel>
                      <div className="space-y-4">
                        {/* Photo Preview */}
                        {capturedPhoto && (
                          <div className="flex items-center space-x-4">
                            <img
                              src={capturedPhoto}
                              alt="Teacher photo"
                              className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                              data-testid="img-teacher-photo-preview"
                            />
                            <div className="flex-1">
                              <p className="text-sm text-success font-medium">Photo captured successfully!</p>
                              <p className="text-xs text-slate-600">This photo will be used in your profile.</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={removePhoto}
                              data-testid="button-remove-teacher-photo"
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
                              Capture your profile photo
                            </p>
                            <Button
                              type="button"
                              onClick={openPhotoCapture}
                              variant="outline"
                              data-testid="button-capture-teacher-photo"
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
                              data-testid="input-teacher-photo-url" 
                            />
                          </FormControl>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={createTeacherMutation.isPending || updateTeacherMutation.isPending}
                    data-testid="button-save-teacher-profile"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {currentTeacher ? 'Update Profile' : 'Create Profile'}
                  </Button>
                  {currentTeacher && isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        form.reset();
                        setCapturedPhoto(currentTeacher.photoUrl || null);
                      }}
                      data-testid="button-cancel-edit"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                {currentTeacher.photoUrl && (
                  <img
                    src={currentTeacher.photoUrl}
                    alt="Teacher photo"
                    className="w-24 h-24 rounded-full object-cover border-2 border-slate-200"
                    data-testid="img-teacher-current-photo"
                  />
                )}
                <div>
                  <h3 className="text-xl font-semibold" data-testid="text-teacher-name">{currentTeacher.name}</h3>
                  <p className="text-slate-600" data-testid="text-teacher-email">{currentTeacher.email}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Profile created: {new Date(currentTeacher.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Capture Modal */}
      <PhotoCapture
        isOpen={isPhotoCaptureOpen}
        onPhotoCapture={handlePhotoCapture}
        onCancel={handleCancelPhotoCapture}
      />
    </div>
  );
}