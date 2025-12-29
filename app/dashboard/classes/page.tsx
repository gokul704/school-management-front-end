'use client';

import { useState, useEffect } from 'react';
import { classApi, Class } from '@/lib/api/classes';
import { courseApi } from '@/lib/api/courses';
import { Course } from '@/types';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Search, Building2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppSelector } from '@/lib/store/hooks';
import { formatClassName } from '@/lib/utils/classFormat';

export default function ClassesPage() {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin' || user?.role === 'principal';
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    academicYear: new Date().getFullYear().toString(),
    gradeLevel: '',
    courseIds: [] as string[],
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesRes, coursesRes] = await Promise.all([
        classApi.getAll({ limit: 1000 }),
        courseApi.getAll({ limit: 1000 }),
      ]);
      setClasses(classesRes.data);
      setCourses(coursesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load classes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      academicYear: new Date().getFullYear().toString(),
      gradeLevel: '',
      courseIds: [],
    });
    setDialogOpen(true);
  };

  const handleEdit = async (classItem: Class) => {
    try {
      const classData = await classApi.getById(classItem.id);
      setEditingClass(classItem);
      setFormData({
        name: classData.name,
        academicYear: classData.academicYear,
        gradeLevel: classData.gradeLevel || '',
        courseIds: classData.courses?.map((c: any) => c.id) || [],
      });
      setDialogOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load class data',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.academicYear) {
      toast({
        title: 'Error',
        description: 'Name and academic year are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      if (editingClass) {
        await classApi.update(editingClass.id, formData);
        toast({
          title: 'Success',
          description: 'Class updated successfully',
        });
      } else {
        await classApi.create(formData);
        toast({
          title: 'Success',
          description: 'Class created successfully',
        });
      }
      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save class',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      setLoading(true);
      await classApi.delete(id);
      toast({
        title: 'Success',
        description: 'Class deleted successfully',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete class',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    setFormData({
      ...formData,
      courseIds: formData.courseIds.includes(courseId)
        ? formData.courseIds.filter(id => id !== courseId)
        : [...formData.courseIds, courseId],
    });
  };

  // Filter out duplicate classes - keep only unique by name and academic year
  const uniqueClasses = classes.reduce((acc, classItem) => {
    const key = `${classItem.name}_${classItem.academicYear}`;
    // Only add if we don't already have a class with the same name and academic year
    if (!acc.find(c => c.name === classItem.name && c.academicYear === classItem.academicYear)) {
      acc.push(classItem);
    }
    return acc;
  }, [] as Class[]);

  const filteredClasses = uniqueClasses.filter(cls =>
    `${cls.name} ${cls.gradeLevel}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground mt-2">Manage classes and map courses</p>
        </div>
        {isAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Class
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No classes found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade Level</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell className="font-medium">{formatClassName(classItem.name)}</TableCell>
                    <TableCell>{classItem.gradeLevel || 'N/A'}</TableCell>
                    <TableCell>{classItem.academicYear}</TableCell>
                    <TableCell>{classItem.studentCount || 0}</TableCell>
                    <TableCell>
                      {classItem.courses?.length || 0} course(s)
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(classItem)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(classItem.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClass ? 'Edit Class' : 'Create New Class'}
            </DialogTitle>
            <DialogDescription>
              {editingClass
                ? 'Update class information and course mappings'
                : 'Create a new class and map courses to it'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Class 1A"
                />
              </div>

              <div className="space-y-2">
                <Label>Grade Level</Label>
                <Input
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  placeholder="e.g., Grade 1"
                />
              </div>

              <div className="space-y-2">
                <Label>Academic Year *</Label>
                <Input
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="2024-2025"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Map Courses to Class</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Select the courses/subjects that this class will study. These courses will be used when generating timetables.
              </p>
              <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                {courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No courses available</p>
                ) : (
                  <div className="space-y-2">
                    {courses.map((course) => (
                      <div key={course.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={course.id}
                          checked={formData.courseIds.includes(course.id)}
                          onCheckedChange={() => toggleCourse(course.id)}
                        />
                        <label
                          htmlFor={course.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {course.name} ({course.courseCode})
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.courseIds.length} course(s) selected
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {editingClass ? 'Update' : 'Create'} Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

