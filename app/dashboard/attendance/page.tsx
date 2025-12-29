'use client';

import { useState, useEffect } from 'react';
import { attendanceApi } from '@/lib/api/attendance';
import { classApi } from '@/lib/api/classes';
import { studentApi } from '@/lib/api/students';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, CheckCircle, XCircle, Download, Search, Edit2, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { exportToCSV } from '@/lib/utils/export';
import { formatClassName } from '@/lib/utils/classFormat';

interface StudentAttendance {
  studentId: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  courses: Array<{
    courseId: string;
    courseName: string;
    courseCode: string;
    attendanceId: string | null;
    status: string | null;
    notes: string | null;
  }>;
}

interface Course {
  id: string;
  name: string;
  courseCode: string;
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState<{
    students: StudentAttendance[];
    courses: Course[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentAttendance | null>(null);
  const [calendarData, setCalendarData] = useState<Record<string, any[]>>({});
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('');
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Record<string, string>>({}); // courseId -> status
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<{
    studentId: string;
    courseId: string;
    attendanceId: string | null;
    currentStatus: string | null;
  } | null>(null);
  const [editStatus, setEditStatus] = useState<'present' | 'absent'>('present');
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<{
    student: StudentAttendance;
    details: any;
    stats: any;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadSections();
      if (selectedDate) {
        loadAttendanceData();
      }
    }
  }, [selectedClassId, selectedSection, selectedDate]);

  const loadClasses = async () => {
    try {
      const classesRes = await classApi.getAll({ limit: 1000 });
      setClasses(classesRes.data);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadSections = async () => {
    if (!selectedClassId) return;
    
    const classData = classes.find(c => c.id === selectedClassId);
    if (classData) {
      // Get unique sections from students in this class
      try {
        const studentsRes = await attendanceApi.getStudentsForAttendance({ classId: selectedClassId });
        const uniqueSections = [...new Set(studentsRes.map((s: { section: string }) => s.section).filter(Boolean))].sort();
        setSections(uniqueSections);
      } catch (error) {
        console.error('Failed to load sections:', error);
        setSections([]);
      }
    } else {
      setSections([]);
    }
  };

  const loadAttendanceData = async () => {
    if (!selectedClassId || !selectedDate) return;

    try {
      setLoading(true);
      const params: any = { classId: selectedClassId, date: selectedDate };
      if (selectedSection && selectedSection !== 'all') {
        params.section = selectedSection;
      }
      const data = await attendanceApi.getByClassAndDate(params);
      setAttendanceData({
        students: data.students,
        courses: data.courses
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load attendance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (studentId: string, courseId: string, status: 'present' | 'absent') => {
    try {
      await attendanceApi.markAttendance({
        studentId,
        courseId,
        date: selectedDate,
        status,
      });
      toast({
        title: 'Success',
        description: 'Attendance marked successfully',
      });
      loadAttendanceData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to mark attendance',
        variant: 'destructive',
      });
    }
  };

  const handleEditAttendance = (studentId: string, courseId: string, attendanceId: string | null, currentStatus: string | null) => {
    setEditingAttendance({ studentId, courseId, attendanceId, currentStatus });
    setEditStatus((currentStatus === 'present' ? 'present' : 'absent') as 'present' | 'absent');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAttendance) return;

    try {
      if (editingAttendance.attendanceId) {
        // Update existing attendance
        await attendanceApi.update(editingAttendance.attendanceId, {
          status: editStatus,
        });
      } else {
        // Create new attendance
        await attendanceApi.markAttendance({
          studentId: editingAttendance.studentId,
          courseId: editingAttendance.courseId,
          date: selectedDate,
          status: editStatus,
        });
      }
      toast({
        title: 'Success',
        description: 'Attendance updated successfully',
      });
      setEditDialogOpen(false);
      setEditingAttendance(null);
      loadAttendanceData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update attendance',
        variant: 'destructive',
      });
    }
  };

  const handleStudentClick = async (student: StudentAttendance) => {
    try {
      // Fetch student details
      const studentDetails = await studentApi.getById(student.studentId);
      
      // Fetch attendance statistics for current academic year
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;
      
      const stats = await attendanceApi.getReport(student.studentId, {
        startDate,
        endDate
      });
      
      setSelectedStudentInfo({
        student,
        details: studentDetails,
        stats
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load student information',
        variant: 'destructive',
      });
    }
  };

  const handleOpenCalendar = async (student: StudentAttendance) => {
    setSelectedStudent(student);
    setCalendarDialogOpen(true);
    
    // Load calendar data for current month
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    try {
      const calendar = await attendanceApi.getStudentCalendar(student.studentId, {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd')
      });
      setCalendarData(calendar.calendar);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load calendar data',
        variant: 'destructive',
      });
    }
  };

  const handleDateClick = async (date: string) => {
    setSelectedCalendarDate(date);
    
    // Load courses for the selected class on this date
    if (selectedClassId) {
      try {
        const courses = await attendanceApi.getCoursesForClass(selectedClassId);
        setAvailableCourses(courses);
        
        // Load existing attendance for this date
        const existingAttendance = calendarData[date] || [];
        const selected: Record<string, string> = {};
        existingAttendance.forEach((att: any) => {
          selected[att.courseId] = att.status;
        });
        setSelectedCourses(selected);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: 'Failed to load courses',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSaveCalendarAttendance = async () => {
    if (!selectedStudent || !selectedCalendarDate || Object.keys(selectedCourses).length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one course',
        variant: 'destructive',
      });
      return;
    }

    try {
      const attendances = Object.entries(selectedCourses).map(([courseId, status]) => ({
        courseId,
        status: status as 'present' | 'absent'
      }));

      await attendanceApi.markBulkAttendance({
        studentId: selectedStudent.studentId,
        date: selectedCalendarDate,
        attendances
      });

      toast({
        title: 'Success',
        description: 'Attendance marked successfully',
      });

      // Reload calendar data
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      const calendar = await attendanceApi.getStudentCalendar(selectedStudent.studentId, {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd')
      });
      setCalendarData(calendar.calendar);
      setSelectedCalendarDate('');
      setSelectedCourses({});
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to mark attendance',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return null;
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-600';
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Filter students based on search query
  const filteredStudents = attendanceData?.students.filter(student => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.fullName.toLowerCase().includes(query) ||
      student.studentNumber.toLowerCase().includes(query) ||
      student.firstName.toLowerCase().includes(query) ||
      student.lastName.toLowerCase().includes(query)
    );
  }) || [];

  const handleExport = () => {
    if (!attendanceData) return;

    const headers = [
      { key: 'studentName', label: 'Student Name' },
      { key: 'studentId', label: 'Student ID' },
      ...attendanceData.courses.map(c => ({ key: c.id, label: c.name })),
    ];

    const exportData = attendanceData.students.map(student => {
      const row: any = {
        studentName: student.fullName,
        studentId: student.studentNumber,
      };
      student.courses.forEach(course => {
        row[course.courseId] = course.status || 'Not Marked';
      });
      return row;
    });
    
    exportToCSV(exportData, `attendance_${selectedDate}`, headers);
    toast({
      title: 'Success',
      description: 'Attendance data exported successfully',
    });
  };

  const calendarDays = eachDayOfInterval({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground mt-2">Mark and track student attendance by class</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!attendanceData}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select class, section, and date to view attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClassId} onValueChange={(value) => {
                setSelectedClassId(value);
                setSelectedSection('all');
              }}>
                  <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {formatClassName(cls.name)} - {cls.academicYear}
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
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {sections.map((section) => (
                      <SelectItem key={section} value={section}>
                        Section {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

              <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {attendanceData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Attendance for {format(new Date(selectedDate), 'MMM dd, yyyy')}</CardTitle>
                <CardDescription>
                  {filteredStudents.length} of {attendanceData.students.length} student(s) - {attendanceData.courses.length} course(s)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10">Student</TableHead>
                      {attendanceData.courses.map((course) => (
                        <TableHead key={course.id} className="min-w-[150px]">
                          <div className="text-center">
                            <div className="font-medium">{course.name}</div>
                            <div className="text-xs text-muted-foreground">{course.courseCode}</div>
                          </div>
                        </TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={attendanceData.courses.length + 1} className="text-center py-8 text-muted-foreground">
                          No students found matching your search
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow key={student.studentId}>
                          <TableCell className="sticky left-0 bg-background z-10 font-medium">
                            <button
                              onClick={() => handleStudentClick(student)}
                              className="text-left hover:underline cursor-pointer"
                            >
                              <div>{student.fullName}</div>
                              <div className="text-xs text-muted-foreground">{student.studentNumber}</div>
                            </button>
                      </TableCell>
                          {student.courses.map((course) => (
                            <TableCell key={course.courseId} className="text-center">
                              {course.status ? (
                                <div className="flex items-center justify-center gap-2">
                                  {getStatusIcon(course.status)}
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(course.status)}`}>
                                    {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleEditAttendance(student.studentId, course.courseId, course.attendanceId, course.status)}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2"
                                    onClick={() => handleMarkAttendance(student.studentId, course.courseId, 'present')}
                                  >
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2"
                                    onClick={() => handleMarkAttendance(student.studentId, course.courseId, 'absent')}
                                  >
                                    <XCircle className="h-3 w-3 text-red-600" />
                                  </Button>
                                </div>
                              )}
                      </TableCell>
                          ))}
                    </TableRow>
                      ))
                    )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Student Info Card */}
      {selectedStudentInfo && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Information</CardTitle>
                <CardDescription>{selectedStudentInfo.student.fullName}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStudentInfo(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Basic Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student ID:</span>
                    <span className="font-medium">{selectedStudentInfo.student.studentNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedStudentInfo.details?.firstName} {selectedStudentInfo.details?.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium text-sm">{selectedStudentInfo.details?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Class:</span>
                    <span className="font-medium">{selectedStudentInfo.details?.className || 'N/A'}</span>
                  </div>
                  {selectedStudentInfo.details?.section && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Section:</span>
                      <span className="font-medium">Section {selectedStudentInfo.details.section}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`font-medium ${selectedStudentInfo.details?.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedStudentInfo.details?.status || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance Statistics */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Attendance Statistics</h3>
                {selectedStudentInfo.stats ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground">Attendance Percentage</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {selectedStudentInfo.stats.attendancePercentage?.toFixed(1) || 0}%
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Present Days</div>
            <div className="text-2xl font-bold text-green-600">
                          {selectedStudentInfo.stats.presentDays || 0}
                        </div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Absent Days</div>
                        <div className="text-2xl font-bold text-red-600">
                          {selectedStudentInfo.stats.absentDays || 0}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Total Days</div>
                      <div className="text-xl font-semibold">
                        {selectedStudentInfo.stats.totalDays || 0}
                      </div>
                    </div>
                    {selectedStudentInfo.stats.period && (
                      <div className="text-xs text-muted-foreground">
                        Period: {format(new Date(selectedStudentInfo.stats.period.start), 'MMM dd, yyyy')} - {format(new Date(selectedStudentInfo.stats.period.end), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground">No attendance data available</div>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedStudentInfo) {
                    handleOpenCalendar(selectedStudentInfo.student);
                    setSelectedStudentInfo(null);
                  }
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar View Dialog */}
      <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Attendance Calendar - {selectedStudent?.fullName}
            </DialogTitle>
            <DialogDescription>
              Click on a date to view and mark attendance for that day
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-medium text-sm p-2">
                  {day}
                </div>
              ))}
              {calendarDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayAttendance = calendarData[dateStr] || [];
                const hasAttendance = dayAttendance.length > 0;
                const isSelected = selectedCalendarDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDateClick(dateStr)}
                    className={`p-2 rounded border text-sm ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : isToday(day)
                        ? 'bg-blue-50 border-blue-300'
                        : hasAttendance
                        ? 'bg-green-50 border-green-300'
                        : 'bg-muted border-border hover:bg-accent'
                    }`}
                  >
                    <div className="font-medium">{format(day, 'd')}</div>
                    {hasAttendance && (
                      <div className="text-xs mt-1">
                        {dayAttendance.length} course{dayAttendance.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Courses */}
            {selectedCalendarDate && (
        <Card>
                <CardHeader>
                  <CardTitle>
                    Courses for {format(new Date(selectedCalendarDate), 'MMM dd, yyyy')}
                  </CardTitle>
                  <CardDescription>
                    Select courses and mark attendance
                  </CardDescription>
          </CardHeader>
                <CardContent className="space-y-4">
                  {availableCourses.map((course) => {
                    const existingAttendance = calendarData[selectedCalendarDate]?.find(
                      (att: any) => att.courseId === course.id
                    );
                    const currentStatus = selectedCourses[course.id] || existingAttendance?.status || '';

                    return (
                      <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={!!selectedCourses[course.id] || !!existingAttendance}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCourses({ ...selectedCourses, [course.id]: 'present' });
                              } else {
                                const newSelected = { ...selectedCourses };
                                delete newSelected[course.id];
                                setSelectedCourses(newSelected);
                              }
                            }}
                          />
                          <div>
                            <div className="font-medium">{course.name}</div>
                            <div className="text-sm text-muted-foreground">{course.courseCode}</div>
                          </div>
                        </div>
                        {currentStatus && (
                          <div className="flex items-center gap-2">
                            {getStatusIcon(currentStatus)}
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(currentStatus)}`}>
                              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                            </span>
                          </div>
                        )}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={currentStatus === 'present' ? 'default' : 'outline'}
                            onClick={() => setSelectedCourses({ ...selectedCourses, [course.id]: 'present' })}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={currentStatus === 'absent' ? 'default' : 'outline'}
                            onClick={() => setSelectedCourses({ ...selectedCourses, [course.id]: 'absent' })}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          {existingAttendance && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const attendanceId = existingAttendance.id;
                                handleEditAttendance(
                                  selectedStudent?.studentId || '',
                                  course.id,
                                  attendanceId,
                                  currentStatus
                                );
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
            </div>
                    );
                  })}
          </CardContent>
        </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCalendarDialogOpen(false);
              setSelectedCalendarDate('');
              setSelectedCourses({});
            }}>
              Close
            </Button>
            {selectedCalendarDate && (
              <Button onClick={handleSaveCalendarAttendance}>
                Save Attendance
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Attendance Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
            <DialogDescription>
              Update attendance status for {format(new Date(selectedDate), 'MMM dd, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={(value: 'present' | 'absent') => setEditStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Present
                    </div>
                  </SelectItem>
                  <SelectItem value="absent">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Absent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
      </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setEditingAttendance(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
