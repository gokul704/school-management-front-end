'use client';

import { useState, useEffect } from 'react';
import { holidaysApi } from '@/lib/api/holidays';
import { Holiday } from '@/types';
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
import { Plus, Edit, Trash2, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useAppSelector } from '@/lib/store/hooks';
import { Checkbox } from '@/components/ui/checkbox';

export default function HolidaysPage() {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    holidayType: 'holiday' as 'holiday' | 'festival' | 'exam' | 'break' | 'other',
    isRecurring: false,
    recurringPattern: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadHolidays();
  }, [typeFilter]);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear + 1}-12-31`;
      
      const response = await holidaysApi.getAll({
        startDate,
        endDate,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        limit: 1000,
      });
      setHolidays(response.data);
    } catch (error) {
      console.error('Failed to load holidays:', error);
      toast({
        title: 'Error',
        description: 'Failed to load holidays',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingHoliday(null);
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      holidayType: 'holiday',
      isRecurring: false,
      recurringPattern: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      title: holiday.title,
      description: holiday.description || '',
      startDate: holiday.startDate,
      endDate: holiday.endDate,
      holidayType: holiday.holidayType,
      isRecurring: holiday.isRecurring,
      recurringPattern: holiday.recurringPattern || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast({
        title: 'Error',
        description: 'Title, start date, and end date are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      if (editingHoliday) {
        await holidaysApi.update(editingHoliday.id, formData);
        toast({
          title: 'Success',
          description: 'Holiday updated successfully',
        });
      } else {
        await holidaysApi.create(formData);
        toast({
          title: 'Success',
          description: 'Holiday created successfully',
        });
      }
      setDialogOpen(false);
      loadHolidays();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save holiday',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;

    try {
      setLoading(true);
      await holidaysApi.delete(id);
      toast({
        title: 'Success',
        description: 'Holiday deleted successfully',
      });
      loadHolidays();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete holiday',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getHolidayTypeColor = (type: string) => {
    switch (type) {
      case 'festival':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'exam':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'break':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'other':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const filteredHolidays = holidays.filter(holiday =>
    holiday.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (holiday.description && holiday.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Holiday Calendar</h1>
          <p className="text-muted-foreground mt-2">Manage school holidays and events</p>
        </div>
        {isAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Holiday
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
                  placeholder="Search holidays..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="festival">Festival</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="break">Break</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredHolidays.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No holidays found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Recurring</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHolidays.map((holiday) => {
                  const start = new Date(holiday.startDate);
                  const end = new Date(holiday.endDate);
                  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  
                  return (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium">{holiday.title}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getHolidayTypeColor(holiday.holidayType)}`}>
                          {holiday.holidayType}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(holiday.startDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(holiday.endDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{daysDiff} day{daysDiff !== 1 ? 's' : ''}</TableCell>
                      <TableCell>
                        {holiday.isRecurring ? (
                          <span className="text-sm text-muted-foreground">
                            {holiday.recurringPattern || 'Yes'}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(holiday)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(holiday.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      {isAdmin && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingHoliday ? 'Edit Holiday' : 'Create New Holiday'}
              </DialogTitle>
              <DialogDescription>
                {editingHoliday
                  ? 'Update holiday information'
                  : 'Add a new holiday or event to the school calendar'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Diwali, Summer Break, Annual Day"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Holiday Type</Label>
                <Select
                  value={formData.holidayType}
                  onValueChange={(value: any) => setFormData({ ...formData, holidayType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="break">Break</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked as boolean })}
                />
                <label
                  htmlFor="recurring"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Recurring holiday
                </label>
              </div>

              {formData.isRecurring && (
                <div className="space-y-2">
                  <Label>Recurring Pattern</Label>
                  <Select
                    value={formData.recurringPattern}
                    onValueChange={(value) => setFormData({ ...formData, recurringPattern: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {editingHoliday ? 'Update' : 'Create'} Holiday
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

