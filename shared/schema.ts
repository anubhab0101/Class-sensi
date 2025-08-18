import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  studentId: text("student_id").notNull().unique(),
  email: text("email"),
  photoUrl: text("photo_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  duration: integer("duration").notNull(), // in minutes
  attendanceThreshold: integer("attendance_threshold").default(75), // percentage
  mobileDetectionEnabled: boolean("mobile_detection_enabled").default(true),
  talkingDetectionEnabled: boolean("talking_detection_enabled").default(false),
  isActive: boolean("is_active").default(false),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  classId: varchar("class_id").references(() => classes.id).notNull(),
  status: text("status").notNull(), // 'present', 'absent', 'late'
  timePresent: integer("time_present").default(0), // in minutes
  detectionCount: integer("detection_count").default(0),
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const behaviorWarnings = pgTable("behavior_warnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  classId: varchar("class_id").references(() => classes.id).notNull(),
  warningType: text("warning_type").notNull(), // 'mobile', 'talking', 'not_detected'
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const faceDetections = pgTable("face_detections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id),
  classId: varchar("class_id").references(() => classes.id).notNull(),
  confidence: integer("confidence"), // 0-100
  boundingBox: text("bounding_box"), // JSON string with x,y,width,height
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  endedAt: true,
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
});

export const insertBehaviorWarningSchema = createInsertSchema(behaviorWarnings).omit({
  id: true,
  createdAt: true,
});

export const insertFaceDetectionSchema = createInsertSchema(faceDetections).omit({
  id: true,
  timestamp: true,
});

// Teachers table
export const teachers = pgTable('teachers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  photoUrl: text('photo_url'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type BehaviorWarning = typeof behaviorWarnings.$inferSelect;
export type InsertBehaviorWarning = z.infer<typeof insertBehaviorWarningSchema>;
export type FaceDetection = typeof faceDetections.$inferSelect;
export type InsertFaceDetection = z.infer<typeof insertFaceDetectionSchema>;
export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
