import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertStudentSchema, 
  insertClassSchema, 
  insertAttendanceRecordSchema,
  insertBehaviorWarningSchema,
  insertFaceDetectionSchema,
  insertTeacherSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Students routes
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid student data" });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    try {
      const updates = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(req.params.id, updates);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid update data" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteStudent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Classes routes
  app.get("/api/classes", async (req, res) => {
    try {
      const classes = await storage.getClasses();
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.get("/api/classes/:id", async (req, res) => {
    try {
      const classData = await storage.getClass(req.params.id);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json(classData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch class" });
    }
  });

  app.get("/api/classes/current", async (req, res) => {
    try {
      const currentClass = await storage.getCurrentClass();
      res.json(currentClass);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current class" });
    }
  });

  app.post("/api/classes", async (req, res) => {
    try {
      const classData = insertClassSchema.parse(req.body);
      const newClass = await storage.createClass(classData);
      res.status(201).json(newClass);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid class data" });
    }
  });

  app.put("/api/classes/:id", async (req, res) => {
    try {
      const updates = insertClassSchema.partial().parse(req.body);
      const updatedClass = await storage.updateClass(req.params.id, updates);
      if (!updatedClass) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json(updatedClass);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid update data" });
    }
  });

  app.post("/api/classes/:id/start", async (req, res) => {
    try {
      const startedClass = await storage.startClass(req.params.id);
      if (!startedClass) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json(startedClass);
    } catch (error) {
      res.status(500).json({ message: "Failed to start class" });
    }
  });

  app.post("/api/classes/:id/end", async (req, res) => {
    try {
      const endedClass = await storage.endClass(req.params.id);
      if (!endedClass) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json(endedClass);
    } catch (error) {
      res.status(500).json({ message: "Failed to end class" });
    }
  });

  // Attendance routes
  app.get("/api/attendance", async (req, res) => {
    try {
      const classId = req.query.classId as string;
      const records = await storage.getAttendanceRecords(classId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const recordData = insertAttendanceRecordSchema.parse(req.body);
      const record = await storage.createAttendanceRecord(recordData);
      res.status(201).json(record);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid attendance data" });
    }
  });

  app.put("/api/attendance/:id", async (req, res) => {
    try {
      const updates = insertAttendanceRecordSchema.partial().parse(req.body);
      const record = await storage.updateAttendanceRecord(req.params.id, updates);
      if (!record) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid update data" });
    }
  });

  // Behavior warnings routes
  app.get("/api/warnings", async (req, res) => {
    try {
      const classId = req.query.classId as string;
      const isActive = req.query.isActive === "true";
      const warnings = await storage.getBehaviorWarnings(classId, isActive);
      res.json(warnings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch warnings" });
    }
  });

  app.post("/api/warnings", async (req, res) => {
    try {
      const warningData = insertBehaviorWarningSchema.parse(req.body);
      const warning = await storage.createBehaviorWarning(warningData);
      res.status(201).json(warning);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid warning data" });
    }
  });

  app.put("/api/warnings/:id/dismiss", async (req, res) => {
    try {
      const dismissed = await storage.dismissBehaviorWarning(req.params.id);
      if (!dismissed) {
        return res.status(404).json({ message: "Warning not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to dismiss warning" });
    }
  });

  app.delete("/api/warnings/clear", async (req, res) => {
    try {
      await storage.clearAllWarnings();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to clear warnings" });
    }
  });

  // Face detection routes
  app.post("/api/face-detections", async (req, res) => {
    try {
      const detectionData = insertFaceDetectionSchema.parse(req.body);
      const detection = await storage.createFaceDetection(detectionData);
      res.status(201).json(detection);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid detection data" });
    }
  });

  app.get("/api/face-detections/recent", async (req, res) => {
    try {
      const classId = req.query.classId as string;
      const minutes = parseInt(req.query.minutes as string) || 5;
      if (!classId) {
        return res.status(400).json({ message: "classId is required" });
      }
      const detections = await storage.getRecentFaceDetections(classId, minutes);
      res.json(detections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent detections" });
    }
  });

  // Update attendance based on face detection
  app.post("/api/attendance/update-from-detection", async (req, res) => {
    try {
      const { classId, studentId, timePresent, lastSeen } = req.body;
      
      if (!classId || !studentId) {
        return res.status(400).json({ message: "classId and studentId are required" });
      }

      // Get or create attendance record
      let attendanceRecord = await storage.getAttendanceRecord(classId, studentId);
      
      if (!attendanceRecord) {
        // Create new attendance record
        const newRecord = {
          studentId,
          classId,
          status: 'present',
          timePresent: timePresent || 0,
          lastSeen: lastSeen ? new Date(lastSeen) : new Date()
        };
        attendanceRecord = await storage.createAttendanceRecord(newRecord);
      } else {
        // Update existing record
        const updates = {
          timePresent: timePresent || attendanceRecord.timePresent,
          lastSeen: lastSeen ? new Date(lastSeen) : new Date()
        };
        attendanceRecord = await storage.updateAttendanceRecord(attendanceRecord.id, updates);
      }

      res.json(attendanceRecord);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update attendance" });
    }
  });

  // Calculate final attendance status for all students in a class
  app.post("/api/attendance/finalize", async (req, res) => {
    try {
      const { classId } = req.body;
      
      if (!classId) {
        return res.status(400).json({ message: "classId is required" });
      }

      // Get class information
      const classInfo = await storage.getClass(classId);
      if (!classInfo) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Get all attendance records for this class
      const attendanceRecords = await storage.getAttendanceRecords(classId);
      
      // Calculate final status for each student
      const updatedRecords = [];
      for (const record of attendanceRecords) {
        const timePresent = record.timePresent || 0;
        const attendancePercentage = (timePresent / classInfo.duration) * 100;
        let finalStatus = 'absent';
        
        if (attendancePercentage >= (classInfo.attendanceThreshold || 75)) {
          finalStatus = 'present';
        } else if (timePresent > 0 && attendancePercentage >= 25) {
          finalStatus = 'late';
        }
        
        // Update the record with final status
        const updatedRecord = await storage.updateAttendanceRecord(record.id, {
          status: finalStatus
        });
        updatedRecords.push(updatedRecord);
      }

      res.json({ 
        message: "Attendance finalized successfully", 
        records: updatedRecords 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to finalize attendance" });
    }
  });

  // Teachers routes
  app.get("/api/teachers", async (req, res) => {
    try {
      const teachers = await storage.getTeachers();
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  app.get("/api/teachers/:id", async (req, res) => {
    try {
      const teacher = await storage.getTeacher(req.params.id);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json(teacher);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teacher" });
    }
  });

  app.post("/api/teachers", async (req, res) => {
    try {
      const teacherData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(teacherData);
      res.status(201).json(teacher);
    } catch (error: any) {
      res.status(400).json({ message: error.errors?.[0]?.message || "Invalid teacher data" });
    }
  });

  app.put("/api/teachers/:id", async (req, res) => {
    try {
      const teacherData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.updateTeacher(req.params.id, teacherData);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json(teacher);
    } catch (error: any) {
      res.status(400).json({ message: error.errors?.[0]?.message || "Invalid teacher data" });
    }
  });

  app.delete("/api/teachers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTeacher(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete teacher" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
