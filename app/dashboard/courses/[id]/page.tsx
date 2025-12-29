'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { courseApi } from '@/lib/api/courses';
import { Course } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, BookOpen, GraduationCap, Users, Calendar, Building2, Hash } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const courseId = params.id as string;

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const courseData = await courseApi.getById(courseId);
      setCourse(courseData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load course data',
        variant: 'destructive',
      });
      router.push('/dashboard/courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Course not found.</p>
        <Button onClick={() => router.push('/dashboard/courses')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{course.name}</h1>
            <p className="text-muted-foreground mt-2">Course Code: {course.courseCode}</p>
          </div>
        </div>
        <Link href={`/dashboard/courses/${course.id}/edit`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Course
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
            <CardDescription>Details about the course</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Course Code</p>
              <p className="text-base flex items-center gap-1">
                <Hash className="h-4 w-4 text-muted-foreground" /> {course.courseCode}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Course Name</p>
              <p className="text-base flex items-center gap-1">
                <BookOpen className="h-4 w-4 text-muted-foreground" /> {course.name}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Department</p>
              <p className="text-base flex items-center gap-1">
                <Building2 className="h-4 w-4 text-muted-foreground" /> {course.department}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Credits</p>
              <p className="text-base flex items-center gap-1">
                <GraduationCap className="h-4 w-4 text-muted-foreground" /> {course.credits}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Academic Year</p>
              <p className="text-base flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" /> {course.academicYear}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-base">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {course.status}
                </span>
              </p>
            </div>
            {course.maxStudents && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Enrollment</p>
                <p className="text-base flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />{' '}
                  {course.enrolledStudents || 0} / {course.maxStudents}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructor</CardTitle>
            <CardDescription>Course teacher information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.teacherName ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Teacher</p>
                <p className="text-base">{course.teacherName}</p>
                {course.teacherId && (
                  <Link
                    href={`/dashboard/teachers/${course.teacherId}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View Teacher Profile
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No teacher assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {course.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{course.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Course Metadata</CardTitle>
          <CardDescription>Additional information</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Created At</p>
            <p className="text-base flex items-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />{' '}
              {format(new Date(course.createdAt), 'PPP')}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
            <p className="text-base flex items-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />{' '}
              {format(new Date(course.updatedAt), 'PPP')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

