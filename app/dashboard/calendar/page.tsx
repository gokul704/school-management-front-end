'use client';

import { useState, useEffect } from 'react';
import { academicsApi } from '@/lib/api/academics';
import { teacherApi } from '@/lib/api/teachers';
import { communicationsApi } from '@/lib/api/communications';
import { holidaysApi } from '@/lib/api/holidays';
import { Assignment, Exam, Timetable, Event, Holiday } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, BookOpen, FileText, MessageSquare, CalendarDays } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { useAppSelector } from '@/lib/store/hooks';
import { formatTo12Hour } from '@/lib/utils/timeFormat';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadCalendarData();
    }
  }, [user, currentDate]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      
      // Load holidays for a wider range (3 months before and after) to ensure visibility
      const holidayStart = new Date(currentDate);
      holidayStart.setMonth(holidayStart.getMonth() - 3);
      const holidayEnd = new Date(currentDate);
      holidayEnd.setMonth(holidayEnd.getMonth() + 3);

      // Load teacher's schedule
      if (user?.role === 'teacher') {
        const schedule = await teacherApi.getSchedule(user.id);
        if (schedule.length > 0) {
          // Convert schedule to timetable format
          const timetableData: Timetable = {
            id: 'teacher-schedule',
            classId: '',
            className: 'My Schedule',
            academicYear: '2024-2025',
            schedule: schedule.map(s => ({
              id: s.id,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              courseId: s.courseId,
              courseName: s.courseName,
              teacherId: user.id,
              teacherName: user.name,
              room: s.room,
            })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setTimetable(timetableData);
        }
      }

      // Load assignments, exams, events, and holidays
      const [assignmentsRes, examsRes, eventsRes, holidaysRes] = await Promise.all([
        academicsApi.getAssignments({ limit: 100 }),
        academicsApi.getExams({ limit: 100 }),
        communicationsApi.getEvents({ limit: 100 }),
        holidaysApi.getAll({
          startDate: format(holidayStart, 'yyyy-MM-dd'),
          endDate: format(holidayEnd, 'yyyy-MM-dd'),
          limit: 1000,
        }),
      ]);

      setAssignments(assignmentsRes.data);
      setExams(examsRes.data);
      setEvents(eventsRes.data);
      setHolidays(holidaysRes.data);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: endOfWeek(currentDate, { weekStartsOn: 0 }),
  });

  const getActivitiesForDate = (date: Date) => {
    const activities: Array<{ type: string; title: string; time?: string; color: string }> = [];

    // Add assignments due on this date
    assignments.forEach((assignment) => {
      const dueDate = parseISO(assignment.dueDate);
      if (isSameDay(dueDate, date)) {
        activities.push({
          type: 'assignment',
          title: assignment.title,
          time: formatTo12Hour(format(dueDate, 'HH:mm')),
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        });
      }
    });

    // Add exams on this date
    exams.forEach((exam) => {
      const examDate = parseISO(exam.examDate);
      if (isSameDay(examDate, date)) {
        activities.push({
          type: 'exam',
          title: exam.title,
          time: formatTo12Hour(format(examDate, 'HH:mm')),
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        });
      }
    });

    // Add events on this date
    events.forEach((event) => {
      const startDate = parseISO(event.startDate);
      const endDate = parseISO(event.endDate);
      if (
        isSameDay(startDate, date) ||
        isSameDay(endDate, date) ||
        (date >= startDate && date <= endDate)
      ) {
        activities.push({
          type: 'event',
          title: event.title,
          time: formatTo12Hour(format(startDate, 'HH:mm')),
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        });
      }
    });

    // Add holidays on this date
    holidays.forEach((holiday) => {
      const startDate = parseISO(holiday.startDate);
      const endDate = parseISO(holiday.endDate);
      if (
        isSameDay(startDate, date) ||
        isSameDay(endDate, date) ||
        isWithinInterval(date, { start: startDate, end: endDate })
      ) {
        const holidayColor = {
          holiday: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          festival: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
          exam: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          break: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        }[holiday.holidayType] || 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';

        activities.push({
          type: 'holiday',
          title: holiday.title,
          time: undefined,
          color: holidayColor,
        });
      }
    });

    // Add timetable slots for this day
    if (timetable) {
      const dayOfWeek = date.getDay();
      timetable.schedule
        .filter((slot) => slot.dayOfWeek === dayOfWeek)
        .forEach((slot) => {
          activities.push({
            type: 'class',
            title: slot.courseName,
            time: `${formatTo12Hour(slot.startTime)} - ${formatTo12Hour(slot.endTime)}`,
            color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
          });
        });
    }

    // Sort activities: holidays first, then by time
    return activities.sort((a, b) => {
      // Holidays come first
      if (a.type === 'holiday' && b.type !== 'holiday') return -1;
      if (a.type !== 'holiday' && b.type === 'holiday') return 1;
      // Then sort by time
      return (a.time || '').localeCompare(b.time || '');
    });
  };

  const goToPreviousWeek = () => {
    setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const goToNextWeek = () => {
    setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-2">View your schedule and activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goToPreviousWeek}>
            Previous
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" onClick={goToNextWeek}>
            Next
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
          <CardDescription>Week of {format(weekDays[0], 'MMM dd')} - {format(weekDays[6], 'MMM dd, yyyy')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
                const activities = getActivitiesForDate(day);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-2 min-h-[150px] ${
                      isToday ? 'bg-primary/10 border-primary' : 'bg-card'
                    }`}
                  >
                    <div className="text-sm font-medium mb-2">
                      <div className="text-muted-foreground">{DAYS_OF_WEEK[index]}</div>
                      <div className={isToday ? 'text-primary font-bold' : ''}>
                        {format(day, 'd')}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {activities.slice(0, 3).map((activity, actIndex) => (
                        <div
                          key={actIndex}
                          className={`text-xs p-1 rounded ${activity.color} truncate`}
                          title={activity.title}
                        >
                          <div className="font-medium">{activity.title}</div>
                          {activity.time && (
                            <div className="text-xs opacity-75">{activity.time}</div>
                          )}
                        </div>
                      ))}
                      {activities.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{activities.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upcoming Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignments
                .filter((a) => new Date(a.dueDate) >= new Date())
                .slice(0, 5)
                .map((assignment) => (
                  <div key={assignment.id} className="text-sm">
                    <div className="font-medium">{assignment.title}</div>
                    <div className="text-muted-foreground">
                      Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exams
                .filter((e) => new Date(e.examDate) >= new Date())
                .slice(0, 5)
                .map((exam) => (
                  <div key={exam.id} className="text-sm">
                    <div className="font-medium">{exam.title}</div>
                    <div className="text-muted-foreground">
                      {format(new Date(exam.examDate), 'MMM dd, yyyy')} {formatTo12Hour(format(new Date(exam.examDate), 'HH:mm'))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {events
                .filter((e) => new Date(e.startDate) >= new Date())
                .slice(0, 5)
                .map((event) => (
                  <div key={event.id} className="text-sm">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-muted-foreground">
                      {format(new Date(event.startDate), 'MMM dd, yyyy')}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Upcoming Holidays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {holidays
                .filter((h) => new Date(h.startDate) >= new Date())
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .slice(0, 5)
                .map((holiday) => {
                  const startDate = parseISO(holiday.startDate);
                  const endDate = parseISO(holiday.endDate);
                  const isMultiDay = !isSameDay(startDate, endDate);
                  
                  return (
                    <div key={holiday.id} className="text-sm">
                      <div className="font-medium">{holiday.title}</div>
                      <div className="text-muted-foreground">
                        {isMultiDay
                          ? `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`
                          : format(startDate, 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {holiday.holidayType}
                      </div>
                    </div>
                  );
                })}
              {holidays.filter((h) => new Date(h.startDate) >= new Date()).length === 0 && (
                <div className="text-sm text-muted-foreground">No upcoming holidays</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

