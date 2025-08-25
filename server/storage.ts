import { 
  type Student, 
  type InsertStudent,
  type Class,
  type InsertClass,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type BehaviorWarning,
  type InsertBehaviorWarning,
  type FaceDetection,
  type InsertFaceDetection,
  type Teacher,
  type InsertTeacher
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Students
  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;

  // Classes
  getClasses(): Promise<Class[]>;
  getClass(id: string): Promise<Class | undefined>;
  getCurrentClass(): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: string, updates: Partial<Class>): Promise<Class | undefined>;
  startClass(id: string): Promise<Class | undefined>;
  endClass(id: string): Promise<Class | undefined>;

  // Attendance
  getAttendanceRecords(classId?: string): Promise<AttendanceRecord[]>;
  getAttendanceRecord(studentId: string, classId: string): Promise<AttendanceRecord | undefined>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined>;

  // Behavior Warnings
  getBehaviorWarnings(classId?: string, isActive?: boolean): Promise<BehaviorWarning[]>;
  createBehaviorWarning(warning: InsertBehaviorWarning): Promise<BehaviorWarning>;
  dismissBehaviorWarning(id: string): Promise<boolean>;
  clearAllWarnings(): Promise<void>;

  // Face Detections
  createFaceDetection(detection: InsertFaceDetection): Promise<FaceDetection>;
  getRecentFaceDetections(classId: string, minutes?: number): Promise<FaceDetection[]>;

  // Teachers
  getTeachers(): Promise<Teacher[]>;
  getTeacher(id: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: string, updates: Partial<Teacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private students: Map<string, Student> = new Map();
  private classes: Map<string, Class> = new Map();
  private attendanceRecords: Map<string, AttendanceRecord> = new Map();
  private behaviorWarnings: Map<string, BehaviorWarning> = new Map();
  private faceDetections: Map<string, FaceDetection> = new Map();
  private teachers: Map<string, Teacher> = new Map();

  constructor() {
    // Start with empty storage - no demo data
  }

  // Students
  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(s => s.studentId === studentId);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = {
      ...insertStudent,
      id,
      createdAt: new Date(),
      email: insertStudent.email ?? null,
      photoUrl: insertStudent.photoUrl ?? null,
      isActive: insertStudent.isActive ?? null
    };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    const existing = this.students.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.students.set(id, updated);
    return updated;
  }

  async deleteStudent(id: string): Promise<boolean> {
    return this.students.delete(id);
  }

  // Classes
  async getClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async getClass(id: string): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getCurrentClass(): Promise<Class | undefined> {
    return Array.from(this.classes.values()).find(c => c.isActive);
  }

  async createClass(insertClass: InsertClass): Promise<Class> {
    const id = randomUUID();
    const classData: Class = {
      ...insertClass,
      id,
      createdAt: new Date(),
      isActive: insertClass.isActive ?? null,
      attendanceThreshold: insertClass.attendanceThreshold ?? null,
      mobileDetectionEnabled: insertClass.mobileDetectionEnabled ?? null,
      talkingDetectionEnabled: insertClass.talkingDetectionEnabled ?? null,
      startedAt: null,
      endedAt: null
    };
    this.classes.set(id, classData);
    return classData;
  }

  async updateClass(id: string, updates: Partial<Class>): Promise<Class | undefined> {
    const existing = this.classes.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.classes.set(id, updated);
    return updated;
  }

  async startClass(id: string): Promise<Class | undefined> {
    const existing = this.classes.get(id);
    if (!existing) return undefined;

    // End any other active classes
    for (const [cId, c] of Array.from(this.classes.entries())) {
      if (c.isActive && cId !== id) {
        this.classes.set(cId, { ...c, isActive: false, endedAt: new Date() });
      }
    }

    const updated = { 
      ...existing, 
      isActive: true, 
      startedAt: new Date(),
      endedAt: null 
    };
    this.classes.set(id, updated);
    return updated;
  }

  async endClass(id: string): Promise<Class | undefined> {
    const existing = this.classes.get(id);
    if (!existing) return undefined;

    const updated = { 
      ...existing, 
      isActive: false, 
      endedAt: new Date() 
    };
    this.classes.set(id, updated);
    return updated;
  }

  // Attendance
  async getAttendanceRecords(classId?: string): Promise<AttendanceRecord[]> {
    const records = Array.from(this.attendanceRecords.values());
    return classId ? records.filter(r => r.classId === classId) : records;
  }

  async getAttendanceRecord(studentId: string, classId: string): Promise<AttendanceRecord | undefined> {
    return Array.from(this.attendanceRecords.values())
      .find(r => r.studentId === studentId && r.classId === classId);
  }

  async createAttendanceRecord(insertRecord: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const id = randomUUID();
    const record: AttendanceRecord = {
      ...insertRecord,
      id,
      createdAt: new Date(),
      timePresent: insertRecord.timePresent ?? null,
      detectionCount: insertRecord.detectionCount ?? null,
      lastSeen: insertRecord.lastSeen ?? null
    };
    this.attendanceRecords.set(id, record);
    return record;
  }

  async updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined> {
    const existing = this.attendanceRecords.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.attendanceRecords.set(id, updated);
    return updated;
  }

  // Behavior Warnings
  async getBehaviorWarnings(classId?: string, isActive?: boolean): Promise<BehaviorWarning[]> {
    let warnings = Array.from(this.behaviorWarnings.values());
    if (classId) warnings = warnings.filter(w => w.classId === classId);
    if (isActive !== undefined) warnings = warnings.filter(w => w.isActive === isActive);
    return warnings;
  }

  async createBehaviorWarning(insertWarning: InsertBehaviorWarning): Promise<BehaviorWarning> {
    const id = randomUUID();
    const warning: BehaviorWarning = {
      ...insertWarning,
      id,
      createdAt: new Date(),
      isActive: insertWarning.isActive ?? null,
      description: insertWarning.description ?? null
    };
    this.behaviorWarnings.set(id, warning);
    return warning;
  }

  async dismissBehaviorWarning(id: string): Promise<boolean> {
    const warning = this.behaviorWarnings.get(id);
    if (!warning) return false;

    this.behaviorWarnings.set(id, { ...warning, isActive: false });
    return true;
  }

  async clearAllWarnings(): Promise<void> {
    this.behaviorWarnings.clear();
  }

  // Face Detections
  async createFaceDetection(insertDetection: InsertFaceDetection): Promise<FaceDetection> {
    const id = randomUUID();
    const detection: FaceDetection = {
      ...insertDetection,
      id,
      timestamp: new Date(),
      studentId: insertDetection.studentId ?? null,
      confidence: insertDetection.confidence ?? null,
      boundingBox: insertDetection.boundingBox ?? null
    };
    this.faceDetections.set(id, detection);
    return detection;
  }

  async getRecentFaceDetections(classId: string, minutes: number = 5): Promise<FaceDetection[]> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return Array.from(this.faceDetections.values())
      .filter(d => d.classId === classId && d.timestamp && d.timestamp > cutoff);
  }

  // Teachers
  async getTeachers(): Promise<Teacher[]> {
    return Array.from(this.teachers.values());
  }

  async getTeacher(id: string): Promise<Teacher | undefined> {
    return this.teachers.get(id);
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const id = randomUUID();
    const teacher: Teacher = {
      ...insertTeacher,
      id,
      createdAt: new Date(),
      isActive: insertTeacher.isActive ?? true,
      photoUrl: insertTeacher.photoUrl ?? null
    };
    this.teachers.set(id, teacher);
    return teacher;
  }

  async updateTeacher(id: string, updates: Partial<Teacher>): Promise<Teacher | undefined> {
    const existing = this.teachers.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.teachers.set(id, updated);
    return updated;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    return this.teachers.delete(id);
  }
}

export const storage = new MemStorage();
