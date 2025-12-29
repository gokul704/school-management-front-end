'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { teacherApi } from '@/lib/api/teachers';
import { Teacher, Schedule } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Mail, Phone, Calendar, MapPin, User, GraduationCap, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const teacherId = params.id as string;

  useEffect(() => {
    loadTeacherData();
  }, [teacherId]);

  const loadTeacherData = async () => {
    try {
      setLoading(true);
      const [teacherData, scheduleData] = await Promise.all([
        teacherApi.getById(teacherId),
        teacherApi.getSchedule(teacherId),
      ]);
      setTeacher(teacherData);
      setSchedule(scheduleData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load teacher data',
        variant: 'destructive',
      });
      router.push('/dashboard/teachers');
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

  if (!teacher) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/teachers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {teacher.firstName} {teacher.lastName}
            </h1>
            <p className="text-muted-foreground mt-2">Teacher ID: {teacher.teacherId}</p>
          </div>
        </div>
        <Link href={`/dashboard/teachers/${teacherId}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Teacher
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
                <p className="font-medium">{teacher.email}</p>
              </div>
            </div>
            {teacher.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{teacher.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  {format(new Date(teacher.dateOfBirth), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{teacher.gender}</p>
              </div>
            </div>
            {teacher.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{teacher.address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Qualification</p>
                <p className="font-medium">{teacher.qualification}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Specialization</p>
                <p className="font-medium">{teacher.specialization}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Hire Date</p>
                <p className="font-medium">
                  {format(new Date(teacher.hireDate), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Status</p>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  teacher.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : teacher.status === 'on_leave'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {teacher.status.replace('_', ' ')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {schedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Teaching Schedule</CardTitle>
            <CardDescription>Current course assignments and schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Day</th>
                    <th className="text-left p-4">Time</th>
                    <th className="text-left p-4">Course</th>
                    <th className="text-left p-4">Room</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
                    .map((slot) => (
                      <tr key={slot.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">{daysOfWeek[slot.dayOfWeek]}</td>
                        <td className="p-4">
                          {slot.startTime} - {slot.endTime}
                        </td>
                        <td className="p-4">{slot.courseName}</td>
                        <td className="p-4">{slot.room || 'N/A'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

