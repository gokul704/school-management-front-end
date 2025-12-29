'use client';

import { useState, useEffect } from 'react';
import { gradesApi } from '@/lib/api/grades';
import { classApi } from '@/lib/api/classes';
import { studentApi } from '@/lib/api/students';
import { courseApi } from '@/lib/api/courses';
import { attendanceApi } from '@/lib/api/attendance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Save, X, Download } from 'lucide-react';
import { useAppSelector } from '@/lib/store/hooks';
import { format } from 'date-fns';
import { formatClassName } from '@/lib/utils/classFormat';

interface GradeFormData {
  studentId: string;
  courseId: string;
  classId: string;
  academicYear: string;
  grade: string;
  marksObtained?: number;
  maxMarks?: number;
  examType: 'unit_test' | 'mid_term' | 'final' | 'assignment' | 'project' | 'practical' | 'other';
  examName?: string;
  remarks?: string;
}

export default function GradesPage() {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin' || user?.role === 'principal';
  
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2024-2025');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any | null>(null);
  const [gradeForm, setGradeForm] = useState<GradeFormData>({
    studentId: '',
    courseId: '',
    classId: '',
    academicYear: '2024-2025',
    grade: '',
    marksObtained: undefined,
    maxMarks: undefined,
    examType: 'final',
    examName: '',
    remarks: '',
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Generate academic years (current and past 5 years)
  const academicYears = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 6; i++) {
    const year = currentYear - i;
    academicYears.push(`${year}-${year + 1}`);
  }

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadStudents();
      loadCourses();
    }
  }, [selectedClassId, selectedSection, selectedAcademicYear]);

  useEffect(() => {
    if (selectedClassId && selectedAcademicYear) {
      loadGrades();
    }
  }, [selectedClassId, selectedCourseId, selectedAcademicYear]);

  const loadClasses = async () => {
    try {
      const response = await classApi.getAll({ limit: 1000 });
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadStudents = async () => {
    if (!selectedClassId) return;
    try {
      const params: any = { classId: selectedClassId, limit: 1000 };
      if (selectedSection && selectedSection !== 'all') {
        params.section = selectedSection;
      }
      const response = await studentApi.getAll(params);
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const loadCourses = async () => {
    if (!selectedClassId) {
      setCourses([]);
      return;
    }
    try {
      const classCourses = await attendanceApi.getCoursesForClass(selectedClassId, {
        academicYear: selectedAcademicYear || undefined
      });
      setCourses(classCourses);
    } catch (error) {
      console.error('Failed to load courses:', error);
      setCourses([]);
    }
  };

  const loadGrades = async () => {
    if (!selectedClassId || !selectedAcademicYear) return;
    try {
      setLoading(true);
      const params: any = { academicYear: selectedAcademicYear };
      if (selectedCourseId) {
        params.courseId = selectedCourseId;
      }
      const data = await gradesApi.getClassGrades(selectedClassId, params);
      setGrades(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load grades',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (grade?: any) => {
    if (grade) {
      setEditingGrade(grade);
      setGradeForm({
        studentId: grade.studentId,
        courseId: grade.courseId,
        classId: grade.classId,
        academicYear: grade.academicYear,
        grade: grade.grade,
        marksObtained: grade.marksObtained,
        maxMarks: grade.maxMarks,
        examType: grade.examType,
        examName: grade.examName || '',
        remarks: grade.remarks || '',
      });
    } else {
      setEditingGrade(null);
      setGradeForm({
        studentId: selectedStudentId || '',
        courseId: selectedCourseId || '',
        classId: selectedClassId,
        academicYear: selectedAcademicYear,
        grade: '',
        marksObtained: undefined,
        maxMarks: undefined,
        examType: 'final',
        examName: '',
        remarks: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSaveGrade = async () => {
    if (!gradeForm.studentId || !gradeForm.courseId || !gradeForm.classId || !gradeForm.academicYear || !gradeForm.grade) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingGrade) {
        await gradesApi.updateGrade(editingGrade.id, gradeForm);
      } else {
        await gradesApi.createOrUpdateGrade(gradeForm);
      }
      toast({
        title: 'Success',
        description: editingGrade ? 'Grade updated successfully' : 'Grade added successfully',
      });
      setDialogOpen(false);
      loadGrades();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save grade',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGrade = async (id: string) => {
    if (!confirm('Are you sure you want to delete this grade?')) return;

    try {
      await gradesApi.deleteGrade(id);
      toast({
        title: 'Success',
        description: 'Grade deleted successfully',
      });
      loadGrades();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete grade',
        variant: 'destructive',
      });
    }
  };

  // Get unique sections from students
  const sections = [...new Set(students.map(s => s.section).filter(Boolean))].sort();

  // Filter grades by selected filters
  const filteredGrades = grades.filter(grade => {
    if (selectedCourseId && grade.courseId !== selectedCourseId) return false;
    if (selectedStudentId && grade.studentId !== selectedStudentId) return false;
    return true;
  });

  // Group grades by student for bulk view
  const gradesByStudent = filteredGrades.reduce((acc: any, grade: any) => {
    if (!acc[grade.studentId]) {
      acc[grade.studentId] = {
        studentId: grade.studentId,
        studentName: grade.studentName,
        grades: [],
      };
    }
    acc[grade.studentId].grades.push(grade);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grades Management</h1>
          <p className="text-muted-foreground mt-2">Enter and manage student grades</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Grade
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingGrade ? 'Edit Grade' : 'Add Grade'}</DialogTitle>
                <DialogDescription>
                  {editingGrade ? 'Update grade information' : 'Enter grade for a student'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Academic Year *</Label>
                    <Select
                      value={gradeForm.academicYear}
                      onValueChange={(value) => setGradeForm({ ...gradeForm, academicYear: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Class *</Label>
                    <Select
                      value={gradeForm.classId}
                      onValueChange={(value) => {
                        setGradeForm({ ...gradeForm, classId: value });
                        setSelectedClassId(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {formatClassName(cls.name)} - {cls.academicYear}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Student *</Label>
                    <Select
                      value={gradeForm.studentId}
                      onValueChange={(value) => setGradeForm({ ...gradeForm, studentId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.firstName} {student.lastName} ({student.studentId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Course *</Label>
                    <Select
                      value={gradeForm.courseId}
                      onValueChange={(value) => setGradeForm({ ...gradeForm, courseId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} ({course.courseCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Exam Type *</Label>
                    <Select
                      value={gradeForm.examType}
                      onValueChange={(value: any) => setGradeForm({ ...gradeForm, examType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unit_test">Unit Test</SelectItem>
                        <SelectItem value="mid_term">Mid Term</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="practical">Practical</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Exam Name</Label>
                    <Input
                      value={gradeForm.examName}
                      onChange={(e) => setGradeForm({ ...gradeForm, examName: e.target.value })}
                      placeholder="e.g., First Term Exam"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Grade *</Label>
                    <Input
                      value={gradeForm.grade}
                      onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value.toUpperCase() })}
                      placeholder="A+, A, B+, etc."
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Marks Obtained</Label>
                    <Input
                      type="number"
                      value={gradeForm.marksObtained || ''}
                      onChange={(e) => setGradeForm({ ...gradeForm, marksObtained: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="85"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Marks</Label>
                    <Input
                      type="number"
                      value={gradeForm.maxMarks || ''}
                      onChange={(e) => setGradeForm({ ...gradeForm, maxMarks: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={gradeForm.remarks}
                    onChange={(e) => setGradeForm({ ...gradeForm, remarks: e.target.value })}
                    placeholder="Additional notes or comments"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveGrade}>
                  <Save className="mr-2 h-4 w-4" />
                  {editingGrade ? 'Update' : 'Save'} Grade
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select class, course, and academic year to view grades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClassId} onValueChange={(value) => {
                setSelectedClassId(value);
                setSelectedCourseId('');
                setSelectedStudentId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedClassId && sections.length > 0 && (
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {sections.map(section => (
                      <SelectItem key={section} value={section}>
                        Section {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={selectedCourseId || 'all'} onValueChange={(value) => setSelectedCourseId(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={selectedStudentId || 'all'} onValueChange={(value) => setSelectedStudentId(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClassId && (
        <Card>
          <CardHeader>
            <CardTitle>Grades</CardTitle>
            <CardDescription>
              {filteredGrades.length} grade record(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredGrades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No grades found. {isAdmin && 'Click "Add Grade" to enter grades.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Exam Type</TableHead>
                      <TableHead>Exam Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Academic Year</TableHead>
                      {isAdmin && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">
                          {grade.studentName}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{grade.courseName}</div>
                            <div className="text-xs text-muted-foreground">{grade.courseCode}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{grade.examType.replace('_', ' ')}</span>
                        </TableCell>
                        <TableCell>{grade.examName || '-'}</TableCell>
                        <TableCell>
                          <span className="font-semibold">{grade.grade}</span>
                        </TableCell>
                        <TableCell>
                          {grade.marksObtained !== null && grade.maxMarks !== null ? (
                            `${grade.marksObtained} / ${grade.maxMarks}`
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{grade.academicYear}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenDialog(grade)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteGrade(grade.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

