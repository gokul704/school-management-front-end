'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { leavesApi, TeacherLeave } from '@/lib/api/leaves';
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
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/components/ui/use-toast';
import { Plus, Calendar, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useAppSelector } from '@/lib/store/hooks';

export default function LeavesPage() {
  const searchParams = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin' || user?.role === 'principal';
  const [leaves, setLeaves] = useState<TeacherLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<TeacherLeave | null>(null);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [reviewForm, setReviewForm] = useState({
    status: '',
    reviewNotes: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadLeaves();
  }, [statusFilter]);

  // Handle leaveId from URL (from notifications)
  useEffect(() => {
    const leaveId = searchParams?.get('leaveId');
    if (leaveId && leaves.length > 0) {
      const leave = leaves.find(l => l.id === leaveId);
      if (leave && leave.status === 'pending' && isAdmin) {
        setSelectedLeave(leave);
        setReviewDialogOpen(true);
      }
    }
  }, [searchParams, leaves, isAdmin]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const response = await leavesApi.getAll({
        limit: 100,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setLeaves(response.data);
    } catch (error) {
      console.error('Failed to load leaves:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leave applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async () => {
    try {
      await leavesApi.create(leaveForm);
      toast({
        title: 'Success',
        description: 'Leave application submitted successfully',
      });
      setApplyDialogOpen(false);
      setLeaveForm({
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
      });
      loadLeaves();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit leave application',
        variant: 'destructive',
      });
    }
  };

  const handleReviewLeave = async () => {
    if (!selectedLeave) return;
    try {
      await leavesApi.updateStatus(selectedLeave.id, reviewForm);
      toast({
        title: 'Success',
        description: 'Leave status updated successfully',
      });
      setReviewDialogOpen(false);
      setSelectedLeave(null);
      setReviewForm({ status: '', reviewNotes: '' });
      loadLeaves();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update leave status',
        variant: 'destructive',
      });
    }
  };

  const openReviewDialog = (leave: TeacherLeave) => {
    setSelectedLeave(leave);
    setReviewForm({
      status: leave.status === 'pending' ? 'approved' : leave.status,
      reviewNotes: leave.reviewNotes || '',
    });
    setReviewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case 'cancelled':
        return `${baseClasses} bg-muted text-muted-foreground`;
      default:
        return `${baseClasses} bg-muted text-muted-foreground`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground mt-2">
            {isAdmin ? 'Review and manage teacher leave applications' : 'Apply for leave and track your applications'}
          </p>
        </div>
        {!isAdmin && (
          <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Apply for Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
                <DialogDescription>Submit a leave application to the principal</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Leave Type</Label>
                  <Select
                    value={leaveForm.leaveType}
                    onValueChange={(value) => setLeaveForm({ ...leaveForm, leaveType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="casual">Casual Leave</SelectItem>
                      <SelectItem value="personal">Personal Leave</SelectItem>
                      <SelectItem value="emergency">Emergency Leave</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    placeholder="Please provide a reason for your leave..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApplyLeave}>Submit Application</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Leave Applications</CardTitle>
            {isAdmin && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && <TableHead>Teacher</TableHead>}
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave) => {
                  const startDate = new Date(leave.startDate);
                  const endDate = new Date(leave.endDate);
                  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                  return (
                    <TableRow key={leave.id}>
                      {isAdmin && (
                        <TableCell className="font-medium">{leave.teacherName}</TableCell>
                      )}
                      <TableCell className="capitalize">{leave.leaveType}</TableCell>
                      <TableCell>{format(startDate, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(endDate, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{duration} day{duration !== 1 ? 's' : ''}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(leave.status)}
                          <span className={getStatusBadge(leave.status)}>
                            {leave.status}
                          </span>
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {leave.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReviewDialog(leave)}
                            >
                              Review
                            </Button>
                          )}
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Leave Application</DialogTitle>
            <DialogDescription>
              Review leave application from {selectedLeave?.teacherName}
            </DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <Input value={selectedLeave.leaveType} disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input value={format(new Date(selectedLeave.startDate), 'MMM dd, yyyy')} disabled />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input value={format(new Date(selectedLeave.endDate), 'MMM dd, yyyy')} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea value={selectedLeave.reason} disabled rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={reviewForm.status}
                  onValueChange={(value) => setReviewForm({ ...reviewForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Review Notes</Label>
                <Textarea
                  value={reviewForm.reviewNotes}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
                  placeholder="Optional notes for the teacher..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReviewLeave}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

