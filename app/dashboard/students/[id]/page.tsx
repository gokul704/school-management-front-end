'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { studentApi } from '@/lib/api/students';
import { gradesApi } from '@/lib/api/grades';
import { Student, AcademicRecord, ProgressCard } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Mail, Phone, Calendar, MapPin, User, GraduationCap, Award, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([]);
  const [progressCard, setProgressCard] = useState<ProgressCard | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const studentId = params.id as string;

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const studentData = await studentApi.getById(studentId);
      setStudent(studentData);
      
      // Load academic records
      const recordsData = await studentApi.getAcademicRecords(studentId);
      setAcademicRecords(recordsData);
      
      // Load progress card if student has a class
      if (studentData.classId) {
        // Get current academic year or latest from records
        const currentYear = recordsData.length > 0 
          ? recordsData[0].academicYear 
          : new Date().getFullYear() + '-' + (new Date().getFullYear() + 1);
        
        setSelectedAcademicYear(currentYear);
        try {
          const progressData = await gradesApi.getProgressCard(studentId, {
            classId: studentData.classId,
            academicYear: currentYear
          });
          setProgressCard(progressData);
        } catch (error) {
          // Progress card might not exist yet, that's okay
          console.log('Progress card not found for this academic year');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load student data',
        variant: 'destructive',
      });
      router.push('/dashboard/students');
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicYearChange = async (academicYear: string) => {
    if (!student?.classId) return;
    
    setSelectedAcademicYear(academicYear);
    try {
      const progressData = await gradesApi.getProgressCard(studentId, {
        classId: student.classId,
        academicYear
      });
      setProgressCard(progressData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load progress card',
        variant: 'destructive',
      });
      setProgressCard(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/students">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-muted-foreground mt-2">Student ID: {student.studentId}</p>
          </div>
        </div>
        <Link href={`/dashboard/students/${studentId}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Student
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{student.email}</p>
              </div>
            </div>
            {student.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{student.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  {format(new Date(student.dateOfBirth), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{student.gender}</p>
              </div>
            </div>
            {student.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{student.address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-medium">{student.className || 'Not assigned'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Enrollment Date</p>
                <p className="font-medium">
                  {format(new Date(student.enrollmentDate), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Status</p>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  student.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : student.status === 'graduated'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {student.status}
              </span>
            </div>
          </CardContent>
        </Card>

        {student.parentName && (
          <Card>
            <CardHeader>
              <CardTitle>Parent/Guardian Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{student.parentName}</p>
              </div>
              {student.parentPhone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{student.parentPhone}</p>
                </div>
              )}
              {student.parentEmail && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{student.parentEmail}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {student.healthData && (
          <Card>
            <CardHeader>
              <CardTitle>Health Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {student.healthData.bloodGroup && (
                <div>
                  <p className="text-sm text-muted-foreground">Blood Group</p>
                  <p className="font-medium">{student.healthData.bloodGroup}</p>
                </div>
              )}
              {student.healthData.allergies && student.healthData.allergies.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Allergies</p>
                  <p className="font-medium">{student.healthData.allergies.join(', ')}</p>
                </div>
              )}
              {student.healthData.emergencyContact && (
                <div>
                  <p className="text-sm text-muted-foreground">Emergency Contact</p>
                  <p className="font-medium">{student.healthData.emergencyContact}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="progress-card" className="w-full">
        <TabsList>
          <TabsTrigger value="progress-card">
            <Award className="mr-2 h-4 w-4" />
            Progress Card
          </TabsTrigger>
          <TabsTrigger value="academic-records">
            <BookOpen className="mr-2 h-4 w-4" />
            Academic Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress-card" className="space-y-4">
          {student?.classId ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Progress Card</CardTitle>
                    <CardDescription>Subject-wise grades and performance</CardDescription>
                  </div>
      {academicRecords.length > 0 && (
                    <Select value={selectedAcademicYear} onValueChange={handleAcademicYearChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Academic Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...new Set(academicRecords.map(r => r.academicYear))].map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {progressCard ? (
                  <div className="space-y-6">
                    {/* Student and Class Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Student</p>
                        <p className="font-semibold">{progressCard.student.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Class</p>
                        <p className="font-semibold">{progressCard.class.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Academic Year</p>
                        <p className="font-semibold">{progressCard.academicYear}</p>
                      </div>
                      {progressCard.overall.grade && (
                        <div>
                          <p className="text-sm text-muted-foreground">Overall Grade</p>
                          <p className="font-semibold text-lg">{progressCard.overall.grade}</p>
                        </div>
                      )}
                    </div>

                    {/* Subjects Table */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Final Grade</TableHead>
                            <TableHead>Marks</TableHead>
                            <TableHead>Percentage</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {progressCard.subjects.map((subject) => (
                            <TableRow key={subject.courseId}>
                              <TableCell className="font-medium">
                                <div>
                                  <p>{subject.courseName}</p>
                                  <p className="text-xs text-muted-foreground">{subject.courseCode}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {subject.finalGrade ? (
                                  <span className="font-semibold text-lg">{subject.finalGrade}</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {subject.finalMarks !== null && subject.totalMarks !== null ? (
                                  <span>{subject.finalMarks} / {subject.totalMarks}</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {subject.averagePercentage !== null ? (
                                  <span>{subject.averagePercentage.toFixed(1)}%</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {subject.grades.length > 0 ? (
                                  <div className="text-xs space-y-1">
                                    {subject.grades.map((g, idx) => (
                                      <div key={g.id} className="text-muted-foreground">
                                        {g.examName || g.examType}: {g.grade}
                                        {g.marksObtained !== null && g.maxMarks !== null && 
                                          ` (${g.marksObtained}/${g.maxMarks})`}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">No grades yet</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Overall Summary */}
                    {progressCard.overall.grade && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Overall Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Overall Grade</p>
                              <p className="text-2xl font-bold">{progressCard.overall.grade}</p>
                            </div>
                            {progressCard.overall.percentage !== null && (
                              <div>
                                <p className="text-sm text-muted-foreground">Overall Percentage</p>
                                <p className="text-2xl font-bold">{progressCard.overall.percentage.toFixed(1)}%</p>
                              </div>
                            )}
                            <div>
                              <p className="text-sm text-muted-foreground">Total Subjects</p>
                              <p className="text-2xl font-bold">{progressCard.overall.totalSubjects}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Subjects Graded</p>
                              <p className="text-2xl font-bold">{progressCard.overall.subjectsWithGrades}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No progress card available for the selected academic year.</p>
                    <p className="text-sm mt-2">Grades need to be entered for this student.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>Student is not assigned to a class yet.</p>
                <p className="text-sm mt-2">Assign a class to view progress card.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="academic-records">
          {academicRecords.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Academic Records</CardTitle>
                <CardDescription>Course grades and academic history organized by academic year</CardDescription>
          </CardHeader>
          <CardContent>
                <Accordion type="multiple" defaultValue={[...new Set(academicRecords.map(r => r.academicYear))].slice(0, 1)}>
                  {[...new Set(academicRecords.map(r => r.academicYear))].sort().reverse().map((academicYear) => {
                    const yearRecords = academicRecords.filter(r => r.academicYear === academicYear);
                    const totalCredits = yearRecords.reduce((sum, r) => sum + (r.credits || 0), 0);
                    const averageGrade = yearRecords.length > 0 
                      ? yearRecords.map(r => {
                          // Convert grade to numeric for average calculation
                          const gradeMap: Record<string, number> = {
                            'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0
                          };
                          return gradeMap[r.grade] ?? 0;
                        }).reduce((sum, val) => sum + val, 0) / yearRecords.length
                      : 0;
                    
                    const gradeToLetter = (num: number): string => {
                      if (num >= 9.5) return 'A+';
                      if (num >= 8.5) return 'A';
                      if (num >= 7.5) return 'B+';
                      if (num >= 6.5) return 'B';
                      if (num >= 5.5) return 'C+';
                      if (num >= 4.5) return 'C';
                      if (num >= 3.5) return 'D';
                      return 'F';
                    };

                    return (
                      <AccordionItem key={academicYear} value={academicYear}>
                        <AccordionTrigger>
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="text-left">
                              <div className="font-semibold text-lg">Academic Year {academicYear}</div>
                              <div className="text-sm text-muted-foreground">
                                {yearRecords.length} course(s) • {totalCredits} credits
                                {averageGrade > 0 && (
                                  <span className="ml-2">
                                    • Average: {gradeToLetter(averageGrade)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
            <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Course</TableHead>
                                  <TableHead>Course Code</TableHead>
                                  <TableHead>Grade</TableHead>
                                  <TableHead>Credits</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {yearRecords.map((record) => (
                                  <TableRow key={record.id}>
                                    <TableCell className="font-medium">{record.courseName}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {record.courseCode || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                        <span className="font-semibold">{record.grade}</span>
                                    </TableCell>
                                    <TableCell>{record.credits}</TableCell>
                                  </TableRow>
                  ))}
                              </TableBody>
                            </Table>
            </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No academic records found.
          </CardContent>
        </Card>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

