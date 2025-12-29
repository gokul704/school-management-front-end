'use client';

import { useState, useEffect } from 'react';
import { academicsApi } from '@/lib/api/academics';
import { classApi, Class } from '@/lib/api/classes';
import { courseApi } from '@/lib/api/courses';
import { teacherApi } from '@/lib/api/teachers';
import { Timetable, TimetableSlot, Course, Teacher } from '@/types';
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
import { Plus, Calendar, Clock, Building2, Users, Edit, Trash2, Sparkles } from 'lucide-react';
import { useAppSelector } from '@/lib/store/hooks';
import { formatTo12Hour } from '@/lib/utils/timeFormat';
import { formatClassName } from '@/lib/utils/classFormat';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

export default function TimetablePage() {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'classroom' | 'teacher'>('classroom');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<Timetable | null>(null);
  const [scheduleSlots, setScheduleSlots] = useState<Partial<TimetableSlot>[]>([]);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    classId: '',
    academicYear: new Date().getFullYear().toString(), // Use just the year to match database format
  });
  const [generateFormData, setGenerateFormData] = useState({
    classId: 'all',
    academicYear: new Date().getFullYear().toString(), // Use just the year to match database format
    sections: [] as string[],
    slotDuration: 45,
    workingHours: { start: '08:00', end: '17:00' },
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClassId || selectedTeacherId) {
      loadTimetables();
    }
  }, [selectedClassId, selectedTeacherId, viewMode, formData.academicYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesRes, coursesRes, teachersRes] = await Promise.all([
        classApi.getAll({ limit: 1000 }),
        courseApi.getAll({ limit: 1000 }),
        teacherApi.getAll({ limit: 1000 }),
      ]);
      setClasses(classesRes.data);
      setCourses(coursesRes.data);
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

  const loadTimetables = async () => {
    try {
      setLoading(true);
      if (viewMode === 'classroom' && selectedClassId) {
        // Use the academic year from formData or generateFormData, defaulting to current year format
        // Try multiple formats to match what's in the database
        const academicYear = formData.academicYear || generateFormData.academicYear || new Date().getFullYear().toString();
        let timetable = null;
        
        // Try with the provided academic year first
        try {
          timetable = await academicsApi.getTimetable(selectedClassId, academicYear);
        } catch (error) {
          // If that fails, try without academic year to get the most recent
          try {
            timetable = await academicsApi.getTimetable(selectedClassId);
          } catch (e) {
            console.error('Failed to load timetable:', e);
          }
        }
        
        if (timetable) {
          // Ensure schedule exists and is an array
          if (timetable.schedule && Array.isArray(timetable.schedule) && timetable.schedule.length > 0) {
            console.log('Loaded timetable with', timetable.schedule.length, 'slots');
            setTimetables([timetable]);
          } else {
            console.warn('Timetable found but has no schedule slots:', timetable);
            setTimetables([]);
          }
        } else {
          console.log('No timetable found for class:', selectedClassId, 'academic year:', academicYear);
          setTimetables([]);
        }
      } else if (viewMode === 'teacher' && selectedTeacherId) {
        // For teacher view, get schedule from timetable_slots
        const teacher = teachers.find(t => t.id === selectedTeacherId);
        if (teacher) {
          try {
            // Get teacher's schedule from timetable slots
            const schedule = await teacherApi.getSchedule(selectedTeacherId);
            // Convert schedule to timetable format
            if (schedule && schedule.length > 0) {
              // Group by class if possible, or create a generic timetable
              const timetable: Timetable = {
                id: 'teacher-schedule',
                classId: '',
                className: `${teacher.firstName} ${teacher.lastName}'s Schedule`,
                academicYear: schedule[0]?.academicYear || new Date().getFullYear().toString(),
                schedule: schedule.map(s => ({
                  id: s.id,
                  dayOfWeek: s.dayOfWeek,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  courseId: s.courseId,
                  courseName: s.courseName || 'Unknown Course',
                  teacherId: teacher.id,
                  teacherName: `${teacher.firstName} ${teacher.lastName}`,
                  room: s.room,
                  section: s.section,
                })),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              console.log('Loaded teacher schedule with', schedule.length, 'slots');
              setTimetables([timetable]);
            } else {
              console.log('No schedule found for teacher:', selectedTeacherId);
              setTimetables([]);
            }
          } catch (error: any) {
            console.error('Failed to load teacher schedule:', error);
            // If 404, teacher has no schedule yet
            if (error.response?.status === 404) {
              setTimetables([]);
            } else {
              toast({
                title: 'Error',
                description: 'Failed to load teacher schedule',
                variant: 'destructive',
              });
              setTimetables([]);
            }
          }
        } else {
          setTimetables([]);
        }
      } else {
        // No class/teacher selected, clear timetables
        setTimetables([]);
      }
    } catch (error) {
      console.error('Failed to load timetables:', error);
      setTimetables([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTimetable = () => {
    setFormData({
      classId: '',
      academicYear: new Date().getFullYear().toString(),
    });
    setScheduleSlots([]);
    setCreateDialogOpen(true);
  };

  const handleEditTimetable = (timetable: Timetable) => {
    setEditingTimetable(timetable);
    setFormData({
      classId: timetable.classId,
      academicYear: timetable.academicYear,
    });
    setScheduleSlots(timetable.schedule);
    setEditDialogOpen(true);
  };

  const addTimeSlot = () => {
    setScheduleSlots([
      ...scheduleSlots,
      {
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '09:45', // Default 45 minutes
        durationMinutes: 45,
        courseId: '',
        teacherId: '',
        room: '',
        section: '',
      },
    ]);
  };

  const removeTimeSlot = (index: number) => {
    setScheduleSlots(scheduleSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: keyof TimetableSlot, value: any) => {
    const updated = [...scheduleSlots];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleSlots(updated);
  };

  const handleGenerateTimetable = async () => {
    let classesToGenerate = generateFormData.classId === 'all' 
      ? classes 
      : classes.filter(c => c.id === generateFormData.classId);

    // Filter out classes that don't have courses mapped
    classesToGenerate = classesToGenerate.filter(c => (c.courses?.length || 0) > 0);

    if (classesToGenerate.length === 0) {
      toast({
        title: 'Error',
        description: generateFormData.classId === 'all' 
          ? 'No classes with mapped courses found. Please map courses to classes first.'
          : 'This class has no courses mapped. Please map courses to this class first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGenerating(true);
      let totalGenerated = 0;
      let totalSlots = 0;
      let errors: string[] = [];
      let skipped: string[] = [];

      for (const classItem of classesToGenerate) {
        // Double-check courses exist
        if (!classItem.courses || classItem.courses.length === 0) {
          skipped.push(classItem.name);
          continue;
        }

        try {
          const result = await academicsApi.generateTimetable({
            ...generateFormData,
            classId: classItem.id,
          });
          
          // Auto-save the generated timetable
          await academicsApi.createTimetable({
            classId: classItem.id,
            academicYear: generateFormData.academicYear,
            schedule: result.schedule,
          });
          
          totalGenerated++;
          totalSlots += result.summary.totalSlots;
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to generate';
          errors.push(`${classItem.name}: ${errorMsg}`);
        }
      }

      setGenerateDialogOpen(false);
      
      if (totalGenerated > 0) {
        let message = `Generated timetables for ${totalGenerated} class(es) with ${totalSlots} total slots`;
        if (skipped.length > 0) {
          message += `. Skipped ${skipped.length} class(es) without courses`;
        }
        if (errors.length > 0) {
          message += `. ${errors.length} error(s)`;
        }
        toast({
          title: 'Success',
          description: message,
        });
        
        // Reload classes to get updated data
        await loadData();
        
        // Update formData with the academic year used for generation
        setFormData(prev => ({
          ...prev,
          academicYear: generateFormData.academicYear,
        }));
        
        // If generating for all classes, select the first generated class to show its timetable
        if (classesToGenerate.length > 0) {
          const firstClass = classesToGenerate[0];
          setSelectedClassId(firstClass.id);
          // Update formData with the academic year before loading
          setFormData(prev => ({
            ...prev,
            academicYear: generateFormData.academicYear,
          }));
          // Force reload timetables with the correct academic year
          setTimeout(() => {
            loadTimetables();
          }, 500);
        } else if (generateFormData.classId !== 'all') {
          // If generating for a specific class, select it
          setSelectedClassId(generateFormData.classId);
          setFormData(prev => ({
            ...prev,
            academicYear: generateFormData.academicYear,
          }));
          setTimeout(() => {
            loadTimetables();
          }, 500);
        }
      } else {
        let message = 'Failed to generate timetables';
        if (skipped.length > 0) {
          message += `. ${skipped.length} class(es) skipped (no courses mapped)`;
        }
        if (errors.length > 0) {
          message += `. Errors: ${errors.join('; ')}`;
        }
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate timetables',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveTimetable = async () => {
    if (!formData.classId) {
      toast({
        title: 'Error',
        description: 'Please select a class',
        variant: 'destructive',
      });
      return;
    }

    if (scheduleSlots.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one time slot',
        variant: 'destructive',
      });
      return;
    }

    // Validate all slots have required fields
    for (const slot of scheduleSlots) {
      if (!slot.courseId || !slot.teacherId || !slot.startTime || !slot.endTime) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields for each time slot',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      if (editingTimetable) {
        await academicsApi.updateTimetable(editingTimetable.id, {
          schedule: scheduleSlots as TimetableSlot[],
        });
        toast({
          title: 'Success',
          description: 'Timetable updated successfully',
        });
      } else {
        await academicsApi.createTimetable({
          classId: formData.classId,
          academicYear: formData.academicYear,
          schedule: scheduleSlots as TimetableSlot[],
        });
        toast({
          title: 'Success',
          description: 'Timetable created successfully',
        });
      }
      setCreateDialogOpen(false);
      setEditDialogOpen(false);
      setEditingTimetable(null);
      loadTimetables();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save timetable',
        variant: 'destructive',
      });
    }
  };

  const renderTimetableGrid = (timetable: Timetable) => {
    // Group slots by day
    const slotsByDay: { [key: number]: TimetableSlot[] } = {};
    if (timetable.schedule && Array.isArray(timetable.schedule)) {
      timetable.schedule.forEach(slot => {
        if (!slotsByDay[slot.dayOfWeek]) {
          slotsByDay[slot.dayOfWeek] = [];
        }
        slotsByDay[slot.dayOfWeek].push(slot);
      });
    }

    // Sort slots by time within each day
    Object.keys(slotsByDay).forEach(day => {
      slotsByDay[parseInt(day)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Time</TableHead>
              {DAYS_OF_WEEK.map((day, index) => (
                <TableHead key={index} className="min-w-[200px]">
                  {day}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {TIME_SLOTS.map((time, timeIndex) => {
              if (timeIndex % 2 !== 0) return null; // Show every hour
              const nextTime = TIME_SLOTS[timeIndex + 1] || TIME_SLOTS[timeIndex];
              
              return (
                <TableRow key={time}>
                  <TableCell className="font-medium">{formatTo12Hour(time)} - {formatTo12Hour(nextTime)}</TableCell>
                  {DAYS_OF_WEEK.map((_, dayIndex) => {
                    // Find slots that overlap with this time slot
                    const slot = slotsByDay[dayIndex]?.find(
                      s => {
                        // Normalize time formats (handle both "08:00" and "08:00:00")
                        const normalizeTime = (t: string) => t.substring(0, 5); // Take only HH:MM
                        const slotStart = normalizeTime(s.startTime);
                        const slotEnd = normalizeTime(s.endTime);
                        const timeStart = normalizeTime(time);
                        const timeEnd = normalizeTime(nextTime);
                        // Check if times overlap
                        return slotStart < timeEnd && slotEnd > timeStart;
                      }
                    );
                    return (
                      <TableCell key={dayIndex}>
                        {slot ? (
                          <div className="p-2 bg-primary/10 rounded border border-primary/20">
                            <p className="font-medium text-sm">{slot.courseName}</p>
                            <p className="text-xs text-muted-foreground">{slot.teacherName}</p>
                            {slot.room && (
                              <p className="text-xs text-muted-foreground">Room: {slot.room}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatTo12Hour(slot.startTime)} - {formatTo12Hour(slot.endTime)}
                            </p>
                          </div>
                        ) : (
                          <div className="p-2 text-muted-foreground text-sm">-</div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timetable Management</h1>
          <p className="text-muted-foreground mt-2">
            {isAdmin ? 'Create and manage class timetables' : 'View your class schedule'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setGenerateDialogOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Auto Generate
            </Button>
            <Button onClick={handleCreateTimetable}>
              <Plus className="mr-2 h-4 w-4" />
              Create Timetable
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'classroom' | 'teacher')}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="classroom">
                  <Building2 className="mr-2 h-4 w-4" />
                  Classroom View
                </TabsTrigger>
                <TabsTrigger value="teacher">
                  <Users className="mr-2 h-4 w-4" />
                  Teacher View
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-4">
                {viewMode === 'classroom' ? (
                  <Select value={selectedClassId || 'all'} onValueChange={(value) => setSelectedClassId(value === 'all' ? '' : value)}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {formatClassName(cls.name)} ({cls.gradeLevel})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={selectedTeacherId || 'all'} onValueChange={(value) => setSelectedTeacherId(value === 'all' ? '' : value)}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.firstName} {teacher.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <TabsContent value="classroom" className="mt-6">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : timetables.length > 0 ? (
                timetables.map((timetable) => (
                  <div key={timetable.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{timetable.className}</h3>
                        <p className="text-sm text-muted-foreground">
                          {timetable.academicYear}
                        </p>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTimetable(timetable)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                    {renderTimetableGrid(timetable)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedClassId
                    ? 'No timetable found for this class. Create one to get started.'
                    : 'Select a class to view its timetable'}
                </div>
              )}
            </TabsContent>

            <TabsContent value="teacher" className="mt-6">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : timetables.length > 0 ? (
                timetables.map((timetable) => (
                  <div key={timetable.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{timetable.className}</h3>
                        <p className="text-sm text-muted-foreground">
                          {timetable.academicYear}
                        </p>
                      </div>
                    </div>
                    {renderTimetableGrid(timetable)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedTeacherId
                    ? 'No schedule found for this teacher.'
                    : 'Select a teacher to view their schedule'}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Create/Edit Timetable Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setEditingTimetable(null);
          setScheduleSlots([]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTimetable ? 'Edit Timetable' : 'Create New Timetable'}
            </DialogTitle>
            <DialogDescription>
              {editingTimetable
                ? 'Update the timetable schedule'
                : 'Create a new timetable for a class'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  disabled={!!editingTimetable}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {formatClassName(cls.name)} - {cls.gradeLevel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="2024-2025"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Time Slots</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTimeSlot}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Slot
                </Button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {scheduleSlots.map((slot, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-7 gap-4">
                        <div className="space-y-2">
                          <Label>Day</Label>
                          <Select
                            value={slot.dayOfWeek?.toString() || ''}
                            onValueChange={(value) =>
                              updateTimeSlot(index, 'dayOfWeek', parseInt(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS_OF_WEEK.map((day, dayIndex) => (
                                <SelectItem key={dayIndex} value={dayIndex.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={slot.startTime || ''}
                            onChange={(e) => {
                              const startTime = e.target.value;
                              updateTimeSlot(index, 'startTime', startTime);
                              // Auto-calculate end time based on duration
                              if (startTime && slot.durationMinutes) {
                                const [hours, minutes] = startTime.split(':').map(Number);
                                const totalMinutes = hours * 60 + minutes + slot.durationMinutes;
                                const endHours = Math.floor(totalMinutes / 60);
                                const endMins = totalMinutes % 60;
                                const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
                                updateTimeSlot(index, 'endTime', endTime);
                              }
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Duration (mins)</Label>
                          <Select
                            value={slot.durationMinutes?.toString() || '45'}
                            onValueChange={(value) => {
                              const duration = parseInt(value);
                              updateTimeSlot(index, 'durationMinutes', duration);
                              // Auto-calculate end time
                              if (slot.startTime) {
                                const [hours, minutes] = slot.startTime.split(':').map(Number);
                                const totalMinutes = hours * 60 + minutes + duration;
                                const endHours = Math.floor(totalMinutes / 60);
                                const endMins = totalMinutes % 60;
                                const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
                                updateTimeSlot(index, 'endTime', endTime);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="45">45 minutes</SelectItem>
                              <SelectItem value="60">60 minutes (1 hour)</SelectItem>
                              <SelectItem value="90">90 minutes (1.5 hours)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Section</Label>
                          <Input
                            value={slot.section || ''}
                            onChange={(e) =>
                              updateTimeSlot(index, 'section', e.target.value)
                            }
                            placeholder="A, B, C..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Course</Label>
                          <Select
                            value={slot.courseId || ''}
                            onValueChange={(value) =>
                              updateTimeSlot(index, 'courseId', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Teacher</Label>
                          <Select
                            value={slot.teacherId || ''}
                            onValueChange={(value) =>
                              updateTimeSlot(index, 'teacherId', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
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

                        <div className="space-y-2">
                          <Label>Room</Label>
                          <Input
                            value={slot.room || ''}
                            onChange={(e) =>
                              updateTimeSlot(index, 'room', e.target.value)
                            }
                            placeholder="Room number"
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => removeTimeSlot(index)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {scheduleSlots.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No time slots added. Click "Add Slot" to create one.
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
                setEditingTimetable(null);
                setScheduleSlots([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTimetable}>
              {editingTimetable ? 'Update' : 'Create'} Timetable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto Generate Timetable Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Auto Generate Timetable</DialogTitle>
            <DialogDescription>
              Automatically generate a timetable based on available courses, teachers, and constraints
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={generateFormData.classId}
                  onValueChange={(value) => setGenerateFormData({ ...generateFormData, classId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {formatClassName(cls.name)} - {cls.gradeLevel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select "All Classes" to generate timetables for all classes at once
                </p>
              </div>

              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input
                  value={generateFormData.academicYear}
                  onChange={(e) => setGenerateFormData({ ...generateFormData, academicYear: e.target.value })}
                  placeholder="2024-2025"
                />
              </div>


              <div className="space-y-2">
                <Label>Slot Duration (minutes)</Label>
                <Select
                  value={generateFormData.slotDuration.toString()}
                  onValueChange={(value) => setGenerateFormData({ ...generateFormData, slotDuration: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes (1 hour)</SelectItem>
                    <SelectItem value="90">90 minutes (1.5 hours)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={generateFormData.workingHours.start}
                  onChange={(e) => setGenerateFormData({
                    ...generateFormData,
                    workingHours: { ...generateFormData.workingHours, start: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={generateFormData.workingHours.end}
                  onChange={(e) => setGenerateFormData({
                    ...generateFormData,
                    workingHours: { ...generateFormData.workingHours, end: e.target.value }
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sections (optional, comma-separated)</Label>
              <Input
                placeholder="A, B, C (leave empty for single section)"
                value={generateFormData.sections.join(', ')}
                onChange={(e) => {
                  const sections = e.target.value
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                  setGenerateFormData({ ...generateFormData, sections });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter section names separated by commas (e.g., A, B, C). Leave empty for a single timetable.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateTimetable} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Timetable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

