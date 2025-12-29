'use client';

import { useState, useEffect } from 'react';
import { communicationsApi } from '@/lib/api/communications';
import { studentApi } from '@/lib/api/students';
import { teacherApi } from '@/lib/api/teachers';
import { classApi } from '@/lib/api/classes';
import { Message, Announcement, Event } from '@/types';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MessageSquare, Megaphone, Calendar, Plus, Bell, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { formatClassName } from '@/lib/utils/classFormat';
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

const messageSchema = z.object({
  sendType: z.enum(['individual', 'class', 'section']),
  recipientId: z.string().optional(),
  recipientIds: z.array(z.string()).optional(),
  classId: z.string().optional(),
  section: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Message content is required'),
}).refine((data) => {
  if (data.sendType === 'individual') {
    return data.recipientIds && data.recipientIds.length > 0;
  } else if (data.sendType === 'section') {
    return data.classId && data.section;
  } else if (data.sendType === 'class') {
    return data.classId;
  }
  return false;
}, {
  message: 'Please select recipients based on the send type',
});

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  targetAudience: z.enum(['all', 'students', 'teachers', 'parents', 'staff']),
  priority: z.enum(['low', 'medium', 'high']),
});

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z.string().optional(),
  targetAudience: z.enum(['all', 'students', 'teachers', 'parents', 'staff']),
});

type MessageFormData = z.infer<typeof messageSchema>;
type AnnouncementFormData = z.infer<typeof announcementSchema>;
type EventFormData = z.infer<typeof eventSchema>;

export default function CommunicationsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const { toast } = useToast();

  const messageForm = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      sendType: 'individual',
    },
  });

  const sendType = messageForm.watch('sendType');
  const selectedClassId = messageForm.watch('classId');
  const selectedSection = messageForm.watch('section');

  const announcementForm = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      priority: 'medium',
      targetAudience: 'all',
    },
  });

  const eventForm = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      targetAudience: 'all',
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [messagesRes, announcementsRes, eventsRes, studentsRes, teachersRes, classesRes] = await Promise.all([
        communicationsApi.getMessages({ limit: 100 }),
        communicationsApi.getAnnouncements({ limit: 100 }),
        communicationsApi.getEvents({ limit: 100 }),
        studentApi.getAll({ limit: 1000 }),
        teacherApi.getAll({ limit: 1000 }),
        classApi.getAll({ limit: 1000 }),
      ]);
      setMessages(messagesRes.data);
      setAnnouncements(announcementsRes.data);
      setEvents(eventsRes.data);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error('Failed to load communications data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load communications data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load students when class/section changes
  useEffect(() => {
    const loadStudentsForMessaging = async () => {
      if (selectedClassId && sendType === 'individual') {
        try {
          const params: { classId: string; section?: string } = { classId: selectedClassId };
          // Only add section filter if a specific section is selected (not "all" or undefined)
          if (selectedSection && selectedSection !== 'all') {
            params.section = selectedSection;
          }
          const studentsData = await communicationsApi.getStudentsForMessaging(params);
          setAvailableStudents(studentsData);
        } catch (error) {
          console.error('Failed to load students:', error);
          setAvailableStudents([]);
        }
      } else {
        setAvailableStudents([]);
      }
    };

    loadStudentsForMessaging();
  }, [selectedClassId, selectedSection, sendType]);

  // Update sections when class changes
  useEffect(() => {
    const loadSections = async () => {
      if (selectedClassId && (sendType === 'section' || sendType === 'individual')) {
        const classData = classes.find(c => c.id === selectedClassId);
        if (classData) {
          // Get unique sections from students in this class
          try {
            const studentsRes = await communicationsApi.getStudentsForMessaging({ classId: selectedClassId });
            const uniqueSections = [...new Set(studentsRes.map(s => s.section).filter(Boolean))].sort();
            setSections(uniqueSections);
          } catch (error) {
            console.error('Failed to load sections:', error);
            setSections([]);
          }
        } else {
          setSections([]);
        }
      } else {
        setSections([]);
      }
    };
    
    loadSections();
  }, [selectedClassId, sendType, classes]);

  const onSendMessage = async (data: MessageFormData) => {
    try {
      const messageData: any = {
        subject: data.subject,
        content: data.content,
      };

      if (data.sendType === 'individual' && data.recipientIds) {
        messageData.recipientIds = data.recipientIds;
      } else if (data.sendType === 'section' && data.classId && data.section) {
        messageData.classId = data.classId;
        messageData.section = data.section;
      } else if (data.sendType === 'class' && data.classId) {
        messageData.classId = data.classId;
      }

      const result = await communicationsApi.sendMessage(messageData);
      toast({
        title: 'Success',
        description: `Message sent successfully to ${result.count || 1} recipient(s)`,
      });
      setMessageDialogOpen(false);
      messageForm.reset({ sendType: 'individual' });
      setAvailableStudents([]);
      setSections([]);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const onCreateAnnouncement = async (data: AnnouncementFormData) => {
    try {
      await communicationsApi.createAnnouncement(data);
      toast({
        title: 'Success',
        description: 'Announcement created successfully',
      });
      setAnnouncementDialogOpen(false);
      announcementForm.reset();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create announcement',
        variant: 'destructive',
      });
    }
  };

  const onCreateEvent = async (data: EventFormData) => {
    try {
      await communicationsApi.createEvent(data);
      toast({
        title: 'Success',
        description: 'Event created successfully',
      });
      setEventDialogOpen(false);
      eventForm.reset();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create event',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await communicationsApi.markMessageAsRead(messageId);
      loadData();
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const unreadMessages = messages.filter((m) => !m.read).length;

  const allRecipients = [
    ...students.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, role: 'student' })),
    ...teachers.map((t) => ({ id: t.id, name: `${t.firstName} ${t.lastName}`, role: 'teacher' })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communications</h1>
          <p className="text-muted-foreground mt-2">Messages, announcements, and events</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
            {unreadMessages > 0 && (
              <p className="text-sm text-muted-foreground">{unreadMessages} unread</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcements.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="messages">
            Messages {unreadMessages > 0 && `(${unreadMessages})`}
          </TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Messages</CardTitle>
                <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                  <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Message
                </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Send Message</DialogTitle>
                      <DialogDescription>Send a message to a student or teacher</DialogDescription>
                    </DialogHeader>
                    <Form {...messageForm}>
                      <form onSubmit={messageForm.handleSubmit(onSendMessage)} className="space-y-4">
                        <FormField
                          control={messageForm.control}
                          name="sendType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Send To</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select send type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="individual">Individual Students</SelectItem>
                                  <SelectItem value="section">Entire Section</SelectItem>
                                  <SelectItem value="class">Entire Class</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {sendType === 'class' && (
                          <FormField
                            control={messageForm.control}
                            name="classId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Class</FormLabel>
                                <Select 
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    messageForm.setValue('section', undefined);
                                  }} 
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {classes.map((cls) => (
                                      <SelectItem key={cls.id} value={cls.id}>
                                        {formatClassName(cls.name)} - {cls.academicYear}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {sendType === 'section' && (
                          <>
                            <FormField
                              control={messageForm.control}
                              name="classId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Class</FormLabel>
                                  <Select 
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      messageForm.setValue('section', undefined);
                                    }} 
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select class" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                          {formatClassName(cls.name)} - {cls.academicYear}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {selectedClassId && sections.length > 0 && (
                              <FormField
                                control={messageForm.control}
                                name="section"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Section</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select section" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {sections.map((section) => (
                                          <SelectItem key={section} value={section}>
                                            Section {section}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                            {selectedClassId && selectedSection && (
                              <div className="text-sm text-muted-foreground">
                                Will send to all students in {classes.find(c => c.id === selectedClassId)?.name?.split('-')[0]} Section {selectedSection}
                              </div>
                            )}
                          </>
                        )}

                        {sendType === 'individual' && (
                          <>
                            <FormField
                              control={messageForm.control}
                              name="classId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Class</FormLabel>
                                  <Select 
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      messageForm.setValue('section', undefined);
                                      messageForm.setValue('recipientIds', []);
                                    }} 
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select class" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                          {formatClassName(cls.name)} - {cls.academicYear}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {selectedClassId && sections.length > 0 && (
                              <FormField
                                control={messageForm.control}
                                name="section"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Section (Optional)</FormLabel>
                                    <Select 
                                      onValueChange={(value) => {
                                        // Convert "all" to undefined for the form
                                        field.onChange(value === 'all' ? undefined : value);
                                        messageForm.setValue('recipientIds', []);
                                      }} 
                                      value={field.value || 'all'}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="All sections" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="all">All Sections</SelectItem>
                                        {sections.map((section) => (
                                          <SelectItem key={section} value={section}>
                                            Section {section}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                            {selectedClassId && (
                              <FormField
                                control={messageForm.control}
                                name="recipientIds"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Select Students</FormLabel>
                                    <FormControl>
                                      <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                                        {availableStudents.length === 0 ? (
                                          <div className="text-sm text-muted-foreground py-2">
                                            {selectedClassId ? 'Loading students...' : 'Please select a class first'}
                                          </div>
                                        ) : (
                                          <>
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-sm text-muted-foreground">
                                                {availableStudents.length} student(s) available
                                              </span>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  const allIds = availableStudents.map(s => s.userId).filter(Boolean);
                                                  field.onChange(allIds);
                                                }}
                                              >
                                                Select All
                                              </Button>
                                            </div>
                                            <div className="space-y-2">
                                              {availableStudents.map((student) => (
                                                <div key={student.id} className="flex items-center space-x-2">
                                                  <input
                                                    type="checkbox"
                                                    id={`student-${student.id}`}
                                                    checked={field.value?.includes(student.userId) || false}
                                                    onChange={(e) => {
                                                      const currentValue = field.value || [];
                                                      if (e.target.checked) {
                                                        field.onChange([...currentValue, student.userId]);
                                                      } else {
                                                        field.onChange(currentValue.filter((id: string) => id !== student.userId));
                                                      }
                                                    }}
                                                    className="rounded"
                                                  />
                                                  <label
                                                    htmlFor={`student-${student.id}`}
                                                    className="text-sm cursor-pointer flex-1"
                                                  >
                                                    {student.fullName} ({student.studentId})
                                                    {student.section && ` - Section ${student.section}`}
                                                  </label>
                                                </div>
                                              ))}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                    {field.value && field.value.length > 0 && (
                                      <div className="text-sm text-muted-foreground">
                                        {field.value.length} student(s) selected
                                      </div>
                                    )}
                                  </FormItem>
                                )}
                              />
                            )}
                          </>
                        )}
                        <FormField
                          control={messageForm.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <FormControl>
                                <Input placeholder="Message subject" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={messageForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Enter your message" rows={6} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setMessageDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Send Message</Button>
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
                        <TableHead>From</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                  {messages.map((message) => (
                        <TableRow
                      key={message.id}
                          className={!message.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                          onClick={() => handleMarkAsRead(message.id)}
                        >
                          <TableCell className="font-medium">
                            {message.senderName} ({message.senderRole})
                          </TableCell>
                          <TableCell>{message.subject}</TableCell>
                          <TableCell>{format(new Date(message.createdAt), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            {message.read ? (
                              <span className="text-xs text-muted-foreground">Read</span>
                            ) : (
                              <span className="text-xs font-medium text-blue-600">Unread</span>
                            )}
                          </TableCell>
                        </TableRow>
                  ))}
                    </TableBody>
                  </Table>
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No messages found</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Announcements</CardTitle>
                <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
                  <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Announcement
                </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Announcement</DialogTitle>
                      <DialogDescription>Create a new school-wide announcement</DialogDescription>
                    </DialogHeader>
                    <Form {...announcementForm}>
                      <form onSubmit={announcementForm.handleSubmit(onCreateAnnouncement)} className="space-y-4">
                        <FormField
                          control={announcementForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Announcement title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={announcementForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Announcement content" rows={6} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={announcementForm.control}
                            name="targetAudience"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Target Audience</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select audience" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="students">Students</SelectItem>
                                    <SelectItem value="teachers">Teachers</SelectItem>
                                    <SelectItem value="parents">Parents</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={announcementForm.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setAnnouncementDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Create Announcement</Button>
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
                        <TableHead>Author</TableHead>
                        <TableHead>Audience</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Published</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                  {announcements.map((announcement) => (
                        <TableRow key={announcement.id}>
                          <TableCell className="font-medium">{announcement.title}</TableCell>
                          <TableCell>{announcement.authorName}</TableCell>
                          <TableCell className="capitalize">{announcement.targetAudience}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                announcement.priority === 'high'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : announcement.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {announcement.priority}
                          </span>
                          </TableCell>
                          <TableCell>{format(new Date(announcement.publishedAt), 'MMM dd, yyyy')}</TableCell>
                        </TableRow>
                  ))}
                    </TableBody>
                  </Table>
                  {announcements.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No announcements found</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Events</CardTitle>
                <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                  <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Event
                </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Event</DialogTitle>
                      <DialogDescription>Schedule a new school event</DialogDescription>
                    </DialogHeader>
                    <Form {...eventForm}>
                      <form onSubmit={eventForm.handleSubmit(onCreateEvent)} className="space-y-4">
                        <FormField
                          control={eventForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Event title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={eventForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Event description" rows={4} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={eventForm.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date & Time</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={eventForm.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date & Time</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={eventForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Event location" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={eventForm.control}
                            name="targetAudience"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Target Audience</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select audience" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="students">Students</SelectItem>
                                    <SelectItem value="teachers">Teachers</SelectItem>
                                    <SelectItem value="parents">Parents</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setEventDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Create Event</Button>
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
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Audience</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                  {events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell>{format(new Date(event.startDate), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            {format(new Date(event.startDate), 'h:mm a')} -{' '}
                            {format(new Date(event.endDate), 'h:mm a')}
                          </TableCell>
                          <TableCell>
                            {event.location ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                        </div>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell className="capitalize">{event.targetAudience}</TableCell>
                        </TableRow>
                  ))}
                    </TableBody>
                  </Table>
                  {events.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No events found</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
