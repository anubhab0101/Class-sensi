import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, RefreshCw, Database, Bell, Shield, Monitor, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    autoSave: true,
    notifications: true,
    darkMode: false,
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5
  });

  // Monitoring settings state
  const [monitoringSettings, setMonitoringSettings] = useState({
    faceDetectionAccuracy: 85,
    behaviorDetectionSensitivity: 'medium',
    recordingQuality: 'high',
    storageRetention: 30
  });

  const handleSettingChange = (category: string, setting: string, value: any) => {
    switch (category) {
      case 'system':
        setSystemSettings(prev => ({ ...prev, [setting]: value }));
        break;
      case 'security':
        setSecuritySettings(prev => ({ ...prev, [setting]: value }));
        break;
      case 'monitoring':
        setMonitoringSettings(prev => ({ ...prev, [setting]: value }));
        break;
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    // Reset to default values
    setSystemSettings({
      autoSave: true,
      notifications: true,
      darkMode: false,
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    });
    
    setSecuritySettings({
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginAttempts: 5
    });
    
    setMonitoringSettings({
      faceDetectionAccuracy: 85,
      behaviorDetectionSensitivity: 'medium',
      recordingQuality: 'high',
      storageRetention: 30
    });

    toast({
      title: "Settings Reset",
      description: "Settings have been reset to default values.",
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
          <p className="text-slate-600 mt-2">Configure system preferences and behavior</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* System Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>System Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-save" className="text-sm font-medium text-slate-700">
                        Auto Save
                      </Label>
                      <Switch
                        id="auto-save"
                        checked={systemSettings.autoSave}
                        onCheckedChange={(checked) => handleSettingChange('system', 'autoSave', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications" className="text-sm font-medium text-slate-700">
                        Notifications
                      </Label>
                      <Switch
                        id="notifications"
                        checked={systemSettings.notifications}
                        onCheckedChange={(checked) => handleSettingChange('system', 'notifications', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dark-mode" className="text-sm font-medium text-slate-700">
                        Dark Mode
                      </Label>
                      <Switch
                        id="dark-mode"
                        checked={systemSettings.darkMode}
                        onCheckedChange={(checked) => handleSettingChange('system', 'darkMode', checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="language" className="text-sm font-medium text-slate-700">
                        Language
                      </Label>
                      <Select 
                        value={systemSettings.language} 
                        onValueChange={(value) => handleSettingChange('system', 'language', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="timezone" className="text-sm font-medium text-slate-700">
                        Timezone
                      </Label>
                      <Select 
                        value={systemSettings.timezone} 
                        onValueChange={(value) => handleSettingChange('system', 'timezone', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">Eastern Time</SelectItem>
                          <SelectItem value="PST">Pacific Time</SelectItem>
                          <SelectItem value="GMT">GMT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="2fa" className="text-sm font-medium text-slate-700">
                        Two-Factor Authentication
                      </Label>
                      <Switch
                        id="2fa"
                        checked={securitySettings.twoFactorAuth}
                        onCheckedChange={(checked) => handleSettingChange('security', 'twoFactorAuth', checked)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="session-timeout" className="text-sm font-medium text-slate-700">
                        Session Timeout (minutes)
                      </Label>
                      <Input
                        id="session-timeout"
                        type="number"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value) || 30)}
                        className="mt-1"
                        min={5}
                        max={120}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="password-expiry" className="text-sm font-medium text-slate-700">
                        Password Expiry (days)
                      </Label>
                      <Input
                        id="password-expiry"
                        type="number"
                        value={securitySettings.passwordExpiry}
                        onChange={(e) => handleSettingChange('security', 'passwordExpiry', parseInt(e.target.value) || 90)}
                        className="mt-1"
                        min={30}
                        max={365}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="login-attempts" className="text-sm font-medium text-slate-700">
                        Max Login Attempts
                      </Label>
                      <Input
                        id="login-attempts"
                        type="number"
                        value={securitySettings.loginAttempts}
                        onChange={(e) => handleSettingChange('security', 'loginAttempts', parseInt(e.target.value) || 5)}
                        className="mt-1"
                        min={3}
                        max={10}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monitoring Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>Monitoring Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="face-accuracy" className="text-sm font-medium text-slate-700">
                        Face Detection Accuracy (%)
                      </Label>
                      <Input
                        id="face-accuracy"
                        type="number"
                        value={monitoringSettings.faceDetectionAccuracy}
                        onChange={(e) => handleSettingChange('monitoring', 'faceDetectionAccuracy', parseInt(e.target.value) || 85)}
                        className="mt-1"
                        min={50}
                        max={100}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="behavior-sensitivity" className="text-sm font-medium text-slate-700">
                        Behavior Detection Sensitivity
                      </Label>
                      <Select 
                        value={monitoringSettings.behaviorDetectionSensitivity} 
                        onValueChange={(value) => handleSettingChange('monitoring', 'behaviorDetectionSensitivity', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="recording-quality" className="text-sm font-medium text-slate-700">
                        Recording Quality
                      </Label>
                      <Select 
                        value={monitoringSettings.recordingQuality} 
                        onValueChange={(value) => handleSettingChange('monitoring', 'recordingQuality', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="storage-retention" className="text-sm font-medium text-slate-700">
                        Storage Retention (days)
                      </Label>
                      <Input
                        id="storage-retention"
                        type="number"
                        value={monitoringSettings.storageRetention}
                        onChange={(e) => handleSettingChange('monitoring', 'storageRetention', parseInt(e.target.value) || 30)}
                        className="mt-1"
                        min={7}
                        max={365}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleResetSettings}
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset to Defaults
                </Button>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>System Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Version:</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Build:</span>
                  <span className="font-medium">2024.01.15</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Environment:</span>
                  <span className="font-medium">Production</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
