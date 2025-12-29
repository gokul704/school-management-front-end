'use client';

import { useState, useEffect } from 'react';
import { examTimetableApi, ExamHall, ExamTimetable, ExamStudentAssignment } from '@/lib/api/examTimetable';
import { academicsApi } from '@/lib/api/academics';
import { studentApi } from '@/lib/api/students';
import { teacherApi } from '@/lib/api/teachers';
import { classApi, Class } from '@/lib/api/classes';
import { Exam, Student, Teacher } from '@/types';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Building2, Calendar, Users, Edit, Trash2, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { formatTo12Hour } from '@/lib/utils/timeFormat';
import { formatClassName } from '@/lib/utils/classFormat';
import { Checkbox } from '@/components/ui/checkbox';

export default function ExamTimetablePage() {
  const [examHalls, setExamHalls] = useState<ExamHall[]>([]);
  const [examTimetables, setExamTimetables] = useState<ExamTimetable[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [hallDialogOpen, setHallDialogOpen] = useState(false);
  const [timetableDialogOpen, setTimetableDialogOpen] = useState(false);
  const [sittingPlanDialogOpen, setSittingPlanDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [sittingPlanForm, setSittingPlanForm] = useState({
    classIds: [] as string[],
    date: '',
    startTime: '',
    endTime: '',
    examTitle: '',
  });
  const [selectAllClasses, setSelectAllClasses] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState<ExamTimetable | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Array<{ studentId: string; seatNumber?: string }>>([]);
  const [hallForm, setHallForm] = useState<Partial<ExamHall>>({});
  const [timetableForm, setTimetableForm] = useState({
    examId: '',
    examHallId: '',
    date: '',
    startTime: '',
    endTime: '',
    invigilatorId: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hallsRes, timetablesRes, examsRes, classesRes, studentsRes, teachersRes] = await Promise.all([
        examTimetableApi.getExamHalls({ limit: 1000 }),
        examTimetableApi.getExamTimetables(),
        academicsApi.getExams({ limit: 1000 }),
        classApi.getAll({ limit: 1000 }),
        studentApi.getAll({ limit: 1000 }),
        teacherApi.getAll({ limit: 1000 }),
      ]);
      setExamHalls(hallsRes.data);
      setExamTimetables(timetablesRes);
      setExams(examsRes.data);
      setClasses(classesRes.data);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHall = async () => {
    try {
      await examTimetableApi.createExamHall(hallForm);
      toast({
        title: 'Success',
        description: 'Exam hall created successfully',
      });
      setHallDialogOpen(false);
      setHallForm({});
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create exam hall',
        variant: 'destructive',
      });
    }
  };

  const handleCreateTimetable = async () => {
    try {
      await examTimetableApi.createExamTimetable({
        ...timetableForm,
        studentAssignments: selectedStudents,
      });
      toast({
        title: 'Success',
        description: 'Exam timetable created successfully',
      });
      setTimetableDialogOpen(false);
      setTimetableForm({
        examId: '',
        examHallId: '',
        date: '',
        startTime: '',
        endTime: '',
        invigilatorId: '',
      });
      setSelectedStudents([]);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create exam timetable',
        variant: 'destructive',
      });
    }
  };

  const handleAssignStudents = async () => {
    if (!selectedTimetable) return;
    try {
      await examTimetableApi.assignStudentsToExam(selectedTimetable.id, selectedStudents);
      toast({
        title: 'Success',
        description: 'Students assigned successfully',
      });
      setAssignDialogOpen(false);
      setSelectedTimetable(null);
      setSelectedStudents([]);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to assign students',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateSittingPlan = async () => {
    if (sittingPlanForm.classIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one class',
        variant: 'destructive',
      });
      return;
    }
    try {
      const result = await examTimetableApi.generateSittingPlan({
        ...sittingPlanForm,
        classIds: sittingPlanForm.classIds,
      });
      toast({
        title: 'Success',
        description: `Sitting plan generated! ${result.timetables.length} hall(s) assigned for ${result.totalStudents} students`,
      });
      setSittingPlanDialogOpen(false);
      setSittingPlanForm({
        classIds: [],
        date: '',
        startTime: '',
        endTime: '',
        examTitle: '',
      });
      setSelectAllClasses(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate sitting plan',
        variant: 'destructive',
      });
    }
  };

  const handleClassToggle = (classId: string) => {
    setSittingPlanForm(prev => {
      const newClassIds = prev.classIds.includes(classId)
        ? prev.classIds.filter(id => id !== classId)
        : [...prev.classIds, classId];
      return { ...prev, classIds: newClassIds };
    });
  };

  const handleSelectAllClasses = (checked: boolean) => {
    setSelectAllClasses(checked);
    if (checked) {
      setSittingPlanForm(prev => ({
        ...prev,
        classIds: classes.map(cls => cls.id),
      }));
    } else {
      setSittingPlanForm(prev => ({
        ...prev,
        classIds: [],
      }));
    }
  };

  const openAssignDialog = async (timetable: ExamTimetable) => {
    setSelectedTimetable(timetable);
    try {
      const assignments = await examTimetableApi.getExamTimetableStudents(timetable.id);
      setSelectedStudents(
        assignments.map((a: any) => ({
          studentId: a.studentId,
          seatNumber: a.seatNumber,
        }))
      );
      setAssignDialogOpen(true);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      setSelectedStudents([]);
      setAssignDialogOpen(true);
    }
  };

  const addStudentToAssignment = () => {
    setSelectedStudents([...selectedStudents, { studentId: '', seatNumber: '' }]);
  };

  const removeStudentFromAssignment = (index: number) => {
    setSelectedStudents(selectedStudents.filter((_, i) => i !== index));
  };

  const updateStudentAssignment = (index: number, field: 'studentId' | 'seatNumber', value: string) => {
    const updated = [...selectedStudents];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedStudents(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exam Timetable Management</h1>
          <p className="text-muted-foreground mt-2">Configure exam halls and create exam timetables</p>
        </div>
      </div>

      <Tabs defaultValue="halls" className="space-y-4">
        <TabsList>
          <TabsTrigger value="halls">
            <Building2 className="mr-2 h-4 w-4" />
            Exam Halls
          </TabsTrigger>
          <TabsTrigger value="timetables">
            <Calendar className="mr-2 h-4 w-4" />
            Exam Timetables
          </TabsTrigger>
        </TabsList>

        <TabsContent value="halls" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Exam Halls (Class-Section Combinations)</CardTitle>
                  <CardDescription>Exam halls are automatically generated from available class-section combinations</CardDescription>
                </div>
                <Dialog open={hallDialogOpen} onOpenChange={setHallDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Hall
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Exam Hall</DialogTitle>
                      <DialogDescription>Add a new exam hall or classroom</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Hall Name</Label>
                        <Input
                          value={hallForm.name || ''}
                          onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })}
                          placeholder="Hall A"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Capacity</Label>
                        <Input
                          type="number"
                          value={hallForm.capacity || ''}
                          onChange={(e) => setHallForm({ ...hallForm, capacity: parseInt(e.target.value) })}
                          placeholder="50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Building</Label>
                        <Input
                          value={hallForm.building || ''}
                          onChange={(e) => setHallForm({ ...hallForm, building: e.target.value })}
                          placeholder="Main Building"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Floor</Label>
                        <Input
                          value={hallForm.floor || ''}
                          onChange={(e) => setHallForm({ ...hallForm, floor: e.target.value })}
                          placeholder="1st Floor"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={hallForm.description || ''}
                          onChange={(e) => setHallForm({ ...hallForm, description: e.target.value })}
                          placeholder="Optional description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setHallDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateHall}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Building</TableHead>
                      <TableHead>Floor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examHalls.map((hall) => (
                      <TableRow key={hall.id}>
                        <TableCell className="font-medium">{hall.name}</TableCell>
                        <TableCell>{hall.capacity}</TableCell>
                        <TableCell>{hall.building || 'N/A'}</TableCell>
                        <TableCell>{hall.floor || 'N/A'}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              hall.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {hall.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetables" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Exam Timetables</CardTitle>
                  <CardDescription>Create and manage exam schedules</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={sittingPlanDialogOpen} onOpenChange={setSittingPlanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Settings className="mr-2 h-4 w-4" />
                        Auto Generate Sitting Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Generate Automatic Sitting Plan</DialogTitle>
                        <DialogDescription>
                          Automatically divide students across multiple exam halls based on capacity
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Select Classes *</Label>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="select-all"
                                checked={selectAllClasses}
                                onCheckedChange={handleSelectAllClasses}
                              />
                              <label
                                htmlFor="select-all"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                Select All
                              </label>
                            </div>
                          </div>
                          <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                            {classes.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No classes available</p>
                            ) : (
                              <div className="space-y-2">
                                {classes.map((cls) => (
                                  <div key={cls.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={cls.id}
                                      checked={sittingPlanForm.classIds.includes(cls.id)}
                                      onCheckedChange={() => handleClassToggle(cls.id)}
                                    />
                                    <label
                                      htmlFor={cls.id}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                    >
                                      {formatClassName(cls.name)} - {cls.studentCount || 0} students
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {sittingPlanForm.classIds.length} class(es) selected
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Exam Title (Optional)</Label>
                          <Input
                            value={sittingPlanForm.examTitle}
                            onChange={(e) => setSittingPlanForm({ ...sittingPlanForm, examTitle: e.target.value })}
                            placeholder="Leave empty for auto-generated title"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                              type="date"
                              value={sittingPlanForm.date}
                              onChange={(e) => setSittingPlanForm({ ...sittingPlanForm, date: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input
                              type="time"
                              value={sittingPlanForm.startTime}
                              onChange={(e) => setSittingPlanForm({ ...sittingPlanForm, startTime: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Time</Label>
                            <Input
                              type="time"
                              value={sittingPlanForm.endTime}
                              onChange={(e) => setSittingPlanForm({ ...sittingPlanForm, endTime: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSittingPlanDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleGenerateSittingPlan}>Generate Plan</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={timetableDialogOpen} onOpenChange={setTimetableDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Timetable
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Exam Timetable</DialogTitle>
                      <DialogDescription>Schedule an exam and assign students</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Exam</Label>
                        <Select
                          value={timetableForm.examId}
                          onValueChange={(value) => setTimetableForm({ ...timetableForm, examId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select exam" />
                          </SelectTrigger>
                          <SelectContent>
                            {exams.map((exam) => (
                              <SelectItem key={exam.id} value={exam.id}>
                                {exam.title} - {exam.courseName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Exam Hall</Label>
                          <Select
                            value={timetableForm.examHallId}
                            onValueChange={(value) => setTimetableForm({ ...timetableForm, examHallId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select hall" />
                            </SelectTrigger>
                            <SelectContent>
                              {examHalls.filter(h => h.isActive).map((hall) => (
                                <SelectItem key={hall.id} value={hall.id}>
                                  {hall.name} (Capacity: {hall.capacity})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={timetableForm.date}
                            onChange={(e) => setTimetableForm({ ...timetableForm, date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={timetableForm.startTime}
                            onChange={(e) => setTimetableForm({ ...timetableForm, startTime: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={timetableForm.endTime}
                            onChange={(e) => setTimetableForm({ ...timetableForm, endTime: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Invigilator</Label>
                          <Select
                            value={timetableForm.invigilatorId}
                            onValueChange={(value) => setTimetableForm({ ...timetableForm, invigilatorId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select invigilator" />
                            </SelectTrigger>
                            <SelectContent>
                              {teachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.firstName} {teacher.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTimetableDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTimetable}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Hall</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Invigilator</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examTimetables.map((timetable) => (
                      <TableRow key={timetable.id}>
                        <TableCell className="font-medium">{timetable.examTitle}</TableCell>
                        <TableCell>{format(new Date(timetable.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          {formatTo12Hour(timetable.startTime)} - {formatTo12Hour(timetable.endTime)}
                        </TableCell>
                        <TableCell>{timetable.hallName}</TableCell>
                        <TableCell>
                          {timetable.assignedStudents} / {timetable.hallCapacity}
                        </TableCell>
                        <TableCell>{timetable.invigilatorName || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openAssignDialog(timetable)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Students Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Students to Exam</DialogTitle>
            <DialogDescription>
              Assign students to {selectedTimetable?.hallName} for {selectedTimetable?.examTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Student Assignments</Label>
              <Button variant="outline" size="sm" onClick={addStudentToAssignment}>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {selectedStudents.map((assignment, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Student</Label>
                        <Select
                          value={assignment.studentId}
                          onValueChange={(value) => updateStudentAssignment(index, 'studentId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.firstName} {student.lastName} ({student.studentId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Seat Number</Label>
                        <Input
                          value={assignment.seatNumber || ''}
                          onChange={(e) => updateStudentAssignment(index, 'seatNumber', e.target.value)}
                          placeholder="A1"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStudentFromAssignment(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignStudents}>Save Assignments</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

