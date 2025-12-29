'use client';

import { useState, useEffect } from 'react';
import { courseApi } from '@/lib/api/courses';
import { Course } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Eye, Download } from 'lucide-react';
import Link from 'next/link';
import { exportToCSV } from '@/lib/utils/export';
import { useToast } from '@/components/ui/use-toast';
import { useAppSelector } from '@/lib/store/hooks';

export default function CoursesPage() {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin' || user?.role === 'principal';
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
  }, [searchTerm]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await courseApi.getAll({ search: searchTerm });
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      try {
        await courseApi.delete(id);
        loadCourses();
        toast({
          title: 'Success',
          description: 'Course deleted successfully',
        });
      } catch (error: any) {
        console.error('Failed to delete course:', error);
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to delete course',
          variant: 'destructive',
        });
      }
    }
  };

  const handleExport = () => {
    const headers = [
      { key: 'courseCode', label: 'Course Code' },
      { key: 'name', label: 'Course Name' },
      { key: 'department', label: 'Department' },
      { key: 'credits', label: 'Credits' },
      { key: 'status', label: 'Status' },
      { key: 'description', label: 'Description' },
    ];
    
    exportToCSV(courses, 'courses', headers);
    toast({
      title: 'Success',
      description: 'Courses data exported successfully',
    });
  };

  const filteredCourses = courses.filter((course) =>
    `${course.name} ${course.courseCode} ${course.department}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground mt-2">Manage academic courses and curriculum</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          {isAdmin && (
            <Link href="/dashboard/courses/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Course
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Course Code</th>
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Department</th>
                    <th className="text-left p-4">Teacher</th>
                    <th className="text-left p-4">Credits</th>
                    <th className="text-left p-4">Status</th>
                    {isAdmin && <th className="text-right p-4">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{course.courseCode}</td>
                      <td className="p-4">{course.name}</td>
                      <td className="p-4">{course.department}</td>
                      <td className="p-4">{course.teacherName || 'Unassigned'}</td>
                      <td className="p-4">{course.credits}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            course.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {course.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/courses/${course.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/dashboard/courses/${course.id}/edit`}>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(course.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCourses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No courses found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

