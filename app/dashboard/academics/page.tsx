'use client';

import { useState, useEffect } from 'react';
import { academicsApi } from '@/lib/api/academics';
import { courseApi } from '@/lib/api/courses';
import { Assignment, Exam, Timetable } from '@/types';
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
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, FileText, Calendar, Plus, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { formatTo12Hour } from '@/lib/utils/timeFormat';
import { useToast } from '@/components/ui/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const assignmentSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  maxScore: z.number().min(0, 'Max score must be positive'),
});

const examSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  examDate: z.string().min(1, 'Exam date is required'),
  duration: z.number().min(1, 'Duration must be positive'),
  maxScore: z.number().min(0, 'Max score must be positive'),
  room: z.string().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;
type ExamFormData = z.infer<typeof examSchema>;

export default function AcademicsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const { toast } = useToast();

  const assignmentForm = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
  });

  const examForm = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, examsRes, coursesRes] = await Promise.all([
        academicsApi.getAssignments({ limit: 100 }),
        academicsApi.getExams({ limit: 100 }),
        courseApi.getAll({ limit: 1000 }),
      ]);
      setAssignments(assignmentsRes.data);
      setExams(examsRes.data);
      setCourses(coursesRes.data);
      // Load timetable if needed
      try {
        const timetableData = await academicsApi.getTimetable();
        setTimetable(timetableData);
      } catch (error) {
        // Timetable might not exist yet
      }
    } catch (error) {
      console.error('Failed to load academic data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load academic data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onCreateAssignment = async (data: AssignmentFormData) => {
    try {
      await academicsApi.createAssignment(data);
      toast({
        title: 'Success',
        description: 'Assignment created successfully',
      });
      setAssignmentDialogOpen(false);
      assignmentForm.reset();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create assignment',
        variant: 'destructive',
      });
    }
  };

  const onCreateExam = async (data: ExamFormData) => {
    try {
      await academicsApi.createExam(data);
      toast({
        title: 'Success',
        description: 'Exam scheduled successfully',
      });
      setExamDialogOpen(false);
      examForm.reset();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to schedule exam',
        variant: 'destructive',
      });
    }
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Academic Management</h1>
          <p className="text-muted-foreground mt-2">Manage assignments, exams, and timetables</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Exams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.filter((c) => c.status === 'active').length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assignments" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assignments</CardTitle>
                <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Assignment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Assignment</DialogTitle>
                      <DialogDescription>Create a new assignment for students</DialogDescription>
                    </DialogHeader>
                    <Form {...assignmentForm}>
                      <form onSubmit={assignmentForm.handleSubmit(onCreateAssignment)} className="space-y-4">
                        <FormField
                          control={assignmentForm.control}
                          name="courseId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Course</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select course" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {courses.map((course) => (
                                    <SelectItem key={course.id} value={course.id}>
                                      {course.name} ({course.courseCode})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={assignmentForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Assignment title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={assignmentForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Assignment description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={assignmentForm.control}
                            name="dueDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Due Date</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={assignmentForm.control}
                            name="maxScore"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Score</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="100"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setAssignmentDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Create Assignment</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
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
                        <TableHead>Title</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Max Score</TableHead>
                        <TableHead>Submissions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">{assignment.title}</TableCell>
                          <TableCell>{assignment.courseName}</TableCell>
                          <TableCell>{format(new Date(assignment.dueDate), 'MMM dd, yyyy')} {formatTo12Hour(format(new Date(assignment.dueDate), 'HH:mm'))}</TableCell>
                          <TableCell>{assignment.maxScore}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {assignment.submissions.length}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {assignments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No assignments found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Exams</CardTitle>
                <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Schedule Exam
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Schedule Exam</DialogTitle>
                      <DialogDescription>Schedule a new exam for students</DialogDescription>
                    </DialogHeader>
                    <Form {...examForm}>
                      <form onSubmit={examForm.handleSubmit(onCreateExam)} className="space-y-4">
                        <FormField
                          control={examForm.control}
                          name="courseId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Course</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select course" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {courses.map((course) => (
                                    <SelectItem key={course.id} value={course.id}>
                                      {course.name} ({course.courseCode})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={examForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Exam title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={examForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Exam description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={examForm.control}
                            name="examDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Exam Date & Time</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={examForm.control}
                            name="duration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Duration (minutes)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="120"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={examForm.control}
                            name="maxScore"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Score</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="100"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={examForm.control}
                            name="room"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Room (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Room number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setExamDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Schedule Exam</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
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
                        <TableHead>Title</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Results</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium">{exam.title}</TableCell>
                          <TableCell>{exam.courseName}</TableCell>
                          <TableCell>
                            {format(new Date(exam.examDate), 'MMM dd, yyyy')} {formatTo12Hour(format(new Date(exam.examDate), 'HH:mm'))}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {exam.duration} min
                            </div>
                          </TableCell>
                          <TableCell>{exam.room || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {exam.results.length}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {exams.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No exams found</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timetable</CardTitle>
              <CardDescription>View class schedules and timetables</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : timetable ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {timetable.className} - {timetable.academicYear}
                      </h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Day</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Teacher</TableHead>
                          <TableHead>Room</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timetable.schedule.map((slot) => (
                          <TableRow key={slot.id}>
                            <TableCell className="font-medium">{daysOfWeek[slot.dayOfWeek]}</TableCell>
                            <TableCell>
                              {slot.startTime} - {slot.endTime}
                            </TableCell>
                            <TableCell>{slot.courseName}</TableCell>
                            <TableCell>{slot.teacherName}</TableCell>
                            <TableCell>{slot.room || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No timetable available. Please create a timetable first.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
