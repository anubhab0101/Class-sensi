import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { CameraFeed } from "@/components/camera-feed";
import { ClassControls } from "@/components/class-controls";
import { AttendanceTable } from "@/components/attendance-table";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Class, DetectedFace, BehaviorDetection } from "@shared/schema";

export default function Dashboard() {
  const [isRecording, setIsRecording] = useState(false);
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
      toast({
        title: "Class Started",
        description: "Monitoring session has begun"
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
    
    if (recording && currentClass) {
      startClassMutation.mutate(currentClass.id);
    }
  };

  const handleStartMonitoring = () => {
    if (currentClass) {
      startClassMutation.mutate(currentClass.id);
      setIsRecording(true);
    }
  };

  const handleClassUpdate = (updates: Partial<Class>) => {
    if (currentClass) {
      updateClassMutation.mutate({ id: currentClass.id, updates });
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

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      
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
