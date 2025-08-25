import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { CameraFeed } from "@/components/camera-feed";
import { ClassControls } from "@/components/class-controls";
import { AttendanceTable } from "@/components/attendance-table";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Class } from "@shared/schema";
import type { DetectedFace, BehaviorDetection } from "@/lib/face-detection";

export default function Dashboard() {
  const [isRecording, setIsRecording] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { toast } = useToast();

  // Quick actions listeners
  useEffect(() => {
    const onExport = () => {
      toast({ title: "Export", description: "Attendance export started" });
    };
    const onOpenAdd = () => {
      window.location.href = "/students#add";
    };
    window.addEventListener("export-attendance", onExport as EventListener);
    window.addEventListener("open-add-student", onOpenAdd as EventListener);
    return () => {
      window.removeEventListener("export-attendance", onExport as EventListener);
      window.removeEventListener("open-add-student", onOpenAdd as EventListener);
    };
  }, [toast]);

  // Fetch current class
  const { data: currentClass } = useQuery<Class>({
    queryKey: ['/api/classes/current']
  });

  // Fetch all classes
  const { data: allClasses } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
    initialData: []
  });

  // Update class mutation
  const updateClassMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Class> }) => {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update class');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
    }
  });

  // Start class mutation
  const startClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      const response = await fetch(`/api/classes/${classId}/start`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to start class');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      setIsMonitoring(true);
      toast({
        title: "Monitoring Started Successfully!",
        description: "The attendance monitoring system is now active and tracking students.",
        variant: "default"
      });
    },
    onError: () => {
      toast({
        title: "Failed to Start Monitoring",
        description: "There was an error starting the monitoring system. Please try again.",
        variant: "destructive"
      });
    }
  });

  // End class mutation
  const endClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      // First finalize attendance
      const finalizeResponse = await fetch('/api/attendance/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId })
      });
      
      if (!finalizeResponse.ok) {
        console.warn('Failed to finalize attendance, but continuing with class end');
      }
      
      // Then end the class
      const response = await fetch(`/api/classes/${classId}/end`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to end class');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      setIsMonitoring(false);
      setIsRecording(false);
      toast({
        title: "Class Ended",
        description: "Monitoring has been stopped and attendance records have been finalized.",
        variant: "default"
      });
    },
    onError: () => {
      toast({
        title: "Failed to End Class",
        description: "There was an error ending the class. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Create behavior warning mutation
  const createWarningMutation = useMutation({
    mutationFn: async (warningData: any) => {
      const response = await fetch('/api/warnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(warningData)
      });
      if (!response.ok) throw new Error('Failed to create warning');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warnings'] });
    }
  });

  const handleRecordingChange = (recording: boolean) => {
    setIsRecording(recording);
    
    if (recording && currentClass && !isMonitoring) {
      startClassMutation.mutate(currentClass.id);
    }
  };

  const handleStartMonitoring = () => {
    if (currentClass) {
      startClassMutation.mutate(currentClass.id);
      setIsRecording(true);
    } else {
      toast({
        title: "No Active Class",
        description: "Please select a class before starting monitoring.",
        variant: "destructive"
      });
    }
  };

  const handleStopMonitoring = () => {
    if (currentClass && isMonitoring) {
      endClassMutation.mutate(currentClass.id);
    }
  };

  const handleClassUpdate = (updates: Partial<Class>) => {
    if (currentClass) {
      updateClassMutation.mutate({ id: currentClass.id, updates });
    }
  };

  const handleClassChange = (classId: string) => {
    // Find the selected class from the all classes query
    const selectedClass = allClasses?.find(cls => cls.id === classId);
    
    if (selectedClass) {
      // Update the current class in the query client
      queryClient.setQueryData(['/api/classes/current'], selectedClass);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/warnings'] });
    }
  };

  const handleFacesDetected = (faces: DetectedFace[]) => {
    // Handle face detection data
    // In a real implementation, this would update attendance records
    console.log('Faces detected:', faces);
  };

  const handleBehaviorDetected = (behaviors: BehaviorDetection[]) => {
    if (!currentClass) return;

    // Create warnings for detected behaviors
    behaviors.forEach(behavior => {
      if (behavior.studentId) {
        createWarningMutation.mutate({
          studentId: behavior.studentId,
          classId: currentClass.id,
          warningType: behavior.type,
          description: `${behavior.type} detected with ${behavior.confidence}% confidence`
        });
      }
    });
  };

  // Auto-end class when duration is reached
  useEffect(() => {
    if (currentClass && isMonitoring && currentClass.startedAt) {
      const startTime = new Date(currentClass.startedAt);
      const durationMs = (currentClass.duration || 90) * 60 * 1000; // Convert minutes to milliseconds
      const endTime = new Date(startTime.getTime() + durationMs);
      
      const now = new Date();
      if (now >= endTime) {
        // Class duration has been reached, auto-end
        handleStopMonitoring();
      } else {
        // Set timer to auto-end class
        const timeUntilEnd = endTime.getTime() - now.getTime();
        const timer = setTimeout(() => {
          handleStopMonitoring();
        }, timeUntilEnd);
        
        return () => clearTimeout(timer);
      }
    }
  }, [currentClass, isMonitoring]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader isMonitoring={isMonitoring} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Camera Feed Section */}
          <div className="lg:col-span-2">
            <CameraFeed
              isRecording={isRecording}
              onRecordingChange={handleRecordingChange}
              onFacesDetected={handleFacesDetected}
              onBehaviorDetected={handleBehaviorDetected}
            />
          </div>

          {/* Class Control Sidebar */}
          <div>
            <ClassControls
              currentClass={currentClass}
              onStartMonitoring={handleStartMonitoring}
              onClassUpdate={handleClassUpdate}
              onClassChange={handleClassChange}
              isMonitoring={isMonitoring}
              onStopMonitoring={handleStopMonitoring}
            />
          </div>
        </div>

        {/* Attendance Table */}
        <div className="mt-8">
          <AttendanceTable
            classId={currentClass?.id}
            className={currentClass?.name || "CS-101"}
          />
        </div>
      </div>
    </div>
  );
}
