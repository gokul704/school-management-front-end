'use client';

import { useState, useEffect } from 'react';
import { studentApi } from '@/lib/api/students';
import { classApi } from '@/lib/api/classes';
import { Student } from '@/types';
import { Class } from '@/lib/api/classes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Eye, Download } from 'lucide-react';
import Link from 'next/link';
import { exportToCSV } from '@/lib/utils/export';
import { useToast } from '@/components/ui/use-toast';
import { useAppSelector } from '@/lib/store/hooks';
import { formatClassName } from '@/lib/utils/classFormat';

export default function StudentsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin' || user?.role === 'principal';
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [searchTerm, selectedClassId, selectedSection]);

  const loadClasses = async () => {
    try {
      const response = await classApi.getAll({ limit: 1000 });
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const params: any = { 
        search: searchTerm,
        limit: 1000 
      };
      
      if (selectedClassId !== 'all') {
        params.classId = selectedClassId;
      }
      
      if (selectedSection !== 'all') {
        params.section = selectedSection;
      }
      
      const response = await studentApi.getAll(params);
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to load students:', error);
      toast({
        title: 'Error',
        description: 'Failed to load students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        await studentApi.delete(id);
        loadStudents();
        toast({
          title: 'Success',
          description: 'Student deleted successfully',
        });
      } catch (error: any) {
        console.error('Failed to delete student:', error);
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to delete student',
          variant: 'destructive',
        });
      }
    }
  };

  const handleExport = () => {
    const headers = [
      { key: 'studentId', label: 'Student ID' },
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'className', label: 'Class' },
      { key: 'status', label: 'Status' },
      { key: 'enrollmentDate', label: 'Enrollment Date' },
      { key: 'dateOfBirth', label: 'Date of Birth' },
      { key: 'gender', label: 'Gender' },
    ];
    
    exportToCSV(students, 'students', headers);
    toast({
      title: 'Success',
      description: 'Students data exported successfully',
    });
  };

  // Get unique sections from classes
  const sections = Array.from(new Set(classes.map(c => c.section).filter((s): s is string => Boolean(s)))).sort();

  const filteredStudents = students;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground mt-2">Manage student information and records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          {isAdmin && (
            <Link href="/dashboard/students/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {formatClassName(cls.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Section" />
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Student ID</th>
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Class</th>
                    <th className="text-left p-4">Status</th>
                    {isAdmin && <th className="text-right p-4">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{student.studentId}</td>
                      <td className="p-4">{`${student.firstName} ${student.lastName}`}</td>
                      <td className="p-4">{student.email}</td>
                      <td className="p-4">{student.className || 'N/A'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            student.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/students/${student.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/dashboard/students/${student.id}/edit`}>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(student.id)}
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
              {filteredStudents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No students found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

