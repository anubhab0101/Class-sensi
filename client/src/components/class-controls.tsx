import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Play, Download, UserPlus, X, Square, Plus } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Class, BehaviorWarning } from "@shared/schema";

interface ClassControlsProps {
  currentClass?: Class;
  onStartMonitoring: () => void;
  onClassUpdate: (classData: Partial<Class>) => void;
  isMonitoring?: boolean;
  onStopMonitoring?: () => void;
}

export function ClassControls({ 
  currentClass, 
  onStartMonitoring, 
  onClassUpdate,
  isMonitoring = false,
  onStopMonitoring
}: ClassControlsProps) {
  const [duration, setDuration] = useState(currentClass?.duration || 90);
  const [threshold, setThreshold] = useState(currentClass?.attendanceThreshold || 75);
  const [mobileDetection, setMobileDetection] = useState(currentClass?.mobileDetectionEnabled ?? true);
  const [talkingDetection, setTalkingDetection] = useState(currentClass?.talkingDetectionEnabled ?? false);
  const { toast } = useToast();

  // Create default class mutation
  const createClassMutation = useMutation({
    mutationFn: async (classData: any) => {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classData)
      });
      if (!response.ok) throw new Error('Failed to create class');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      toast({
        title: "Class Created",
        description: "Default class has been created successfully.",
        variant: "default"
      });
    },
    onError: () => {
      toast({
        title: "Failed to Create Class",
        description: "There was an error creating the class. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Fetch active warnings
  const { data: warnings = [] } = useQuery<BehaviorWarning[]>({
    queryKey: ['/api/warnings', { classId: currentClass?.id, isActive: 'true' }],
    queryFn: async () => {
      if (!currentClass?.id) return [];
      const params = new URLSearchParams({
        classId: currentClass.id,
        isActive: 'true'
      });
      const response = await fetch(`/api/warnings?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch warnings');
      return response.json();
    },
    enabled: !!currentClass?.id
  });

  // Dismiss warning mutation
  const dismissWarningMutation = useMutation({
    mutationFn: async (warningId: string) => {
      const response = await fetch(`/api/warnings/${warningId}/dismiss`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to dismiss warning');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warnings'] });
    }
  });

  const handleSettingChange = (field: string, value: any) => {
    const updates = { [field]: value };
    
    switch (field) {
      case 'duration':
        setDuration(value);
        break;
      case 'attendanceThreshold':
        setThreshold(value);
        break;
      case 'mobileDetectionEnabled':
        setMobileDetection(value);
        break;
      case 'talkingDetectionEnabled':
        setTalkingDetection(value);
        break;
    }

    onClassUpdate(updates);
  };

  const handleDismissWarning = (warningId: string) => {
    dismissWarningMutation.mutate(warningId);
  };

  const handleStartMonitoring = async () => {
    if (!currentClass) {
      // Create a default class if none exists
      const defaultClass = {
        name: "CS-101",
        duration: duration,
        attendanceThreshold: threshold,
        mobileDetectionEnabled: mobileDetection,
        talkingDetectionEnabled: talkingDetection
      };
      
      try {
        await createClassMutation.mutateAsync(defaultClass);
        // Wait a bit for the class to be created and fetched
        setTimeout(() => {
          onStartMonitoring();
        }, 500);
      } catch (error) {
        console.error("Failed to create class:", error);
      }
    } else {
      onStartMonitoring();
    }
  };

  const getWarningIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return '📱';
      case 'talking':
        return '💬';
      case 'not_detected':
        return '👤';
      default:
        return '⚠️';
    }
  };

  const getWarningMessage = (warning: BehaviorWarning) => {
    switch (warning.warningType) {
      case 'mobile':
        return 'Mobile phone usage detected';
      case 'talking':
        return 'Excessive talking detected';
      case 'not_detected':
        return 'Not detected for extended period';
      default:
        return warning.description || 'Unknown warning';
    }
  };

  return (
    <div className="space-y-6">
      {/* Class Settings */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Class Settings</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="duration" className="block text-sm font-medium text-slate-700 mb-2">
                Class Duration
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => handleSettingChange('duration', parseInt(e.target.value) || 0)}
                  className="w-20"
                  data-testid="input-duration"
                />
                <span className="text-sm text-slate-600">minutes</span>
              </div>
            </div>
            <div>
              <Label htmlFor="threshold" className="block text-sm font-medium text-slate-700 mb-2">
                Attendance Threshold
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="threshold"
                  type="number"
                  min={0}
                  max={100}
                  value={threshold}
                  onChange={(e) => {
                    let value = parseInt(e.target.value) || 0;
                    if (value < 0) value = 0;
                    if (value > 100) value = 100;
                    handleSettingChange('attendanceThreshold', value);
                  }}
                  className="w-20"
                  data-testid="input-threshold"
                />
                <span className="text-sm text-slate-600">% of class time</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="mobile-detection" className="text-sm font-medium text-slate-700">
                Mobile Detection
              </Label>
              <Switch
                id="mobile-detection"
                checked={mobileDetection}
                onCheckedChange={(checked) => handleSettingChange('mobileDetectionEnabled', checked)}
                data-testid="switch-mobile-detection"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="talking-detection" className="text-sm font-medium text-slate-700">
                Talking Detection
              </Label>
              <Switch
                id="talking-detection"
                checked={talkingDetection}
                onCheckedChange={(checked) => handleSettingChange('talkingDetectionEnabled', checked)}
                data-testid="switch-talking-detection"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {!isMonitoring ? (
              <Button 
                onClick={handleStartMonitoring}
                className="w-full bg-success text-white hover:bg-green-600 transition-colors"
                data-testid="button-start-monitoring"
                disabled={createClassMutation.isPending}
              >
                {createClassMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {currentClass ? "Start Monitoring" : "Create Class & Start Monitoring"}
              </Button>
            ) : (
              <Button 
                onClick={onStopMonitoring}
                className="w-full bg-danger text-white hover:bg-red-600 transition-colors"
                data-testid="button-stop-monitoring"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop Monitoring
              </Button>
            )}
            <Button 
              variant="secondary"
              className="w-full"
              data-testid="button-export-attendance"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('export-attendance'));
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Attendance
            </Button>
            <Button 
              variant="secondary"
              className="w-full"
              data-testid="button-add-student"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-add-student'));
                }
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Warnings */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Active Warnings</h3>
          <div className="space-y-3">
            {warnings.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No active warnings</p>
            ) : (
              warnings.map((warning) => (
                <div
                  key={warning.id}
                  className={`${
                    warning.warningType === 'mobile' || warning.warningType === 'talking'
                      ? 'bg-warning/10 border border-warning/30'
                      : 'bg-danger/10 border border-danger/30'
                  } rounded-md p-3`}
                  data-testid={`warning-${warning.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {warning.studentId} {/* In real app, this would be student name */}
                      </p>
                      <p className={`text-xs ${
                        warning.warningType === 'mobile' || warning.warningType === 'talking'
                          ? 'text-warning'
                          : 'text-danger'
                      }`}>
                        {getWarningIcon(warning.warningType)} {getWarningMessage(warning)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDismissWarning(warning.id)}
                      className={`${
                        warning.warningType === 'mobile' || warning.warningType === 'talking'
                          ? 'text-warning hover:text-orange-600'
                          : 'text-danger hover:text-red-600'
                      }`}
                      data-testid={`button-dismiss-${warning.id}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
