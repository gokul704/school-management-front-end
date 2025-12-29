'use client';

import { useState, useEffect } from 'react';
import { financialApi } from '@/lib/api/financial';
import { studentApi } from '@/lib/api/students';
import { Payment, FeeStructure } from '@/types';
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
import { DollarSign, TrendingUp, FileText, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
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

const feeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  feeType: z.enum(['tuition', 'library', 'laboratory', 'sports', 'transport', 'hostel', 'other']),
  academicYear: z.string().min(1, 'Academic year is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  applicableTo: z.enum(['all', 'class', 'student']),
  classId: z.string().optional(),
  studentId: z.string().optional(),
});

const paymentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  feeStructureId: z.string().min(1, 'Fee structure is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  paymentMethod: z.enum(['cash', 'card', 'online', 'bank_transfer']),
});

type FeeFormData = z.infer<typeof feeSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;

export default function FinancialPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const feeForm = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      applicableTo: 'all',
      feeType: 'tuition',
    },
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: 'cash',
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, feesRes, studentsRes] = await Promise.all([
        financialApi.getPayments({ limit: 100 }),
        financialApi.getFeeStructures({ limit: 100 }),
        studentApi.getAll({ limit: 1000 }),
      ]);
      setPayments(paymentsRes.data);
      setFeeStructures(feesRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Failed to load financial data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load financial data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onCreateFee = async (data: FeeFormData) => {
    try {
      await financialApi.createFeeStructure(data);
      toast({
        title: 'Success',
        description: 'Fee structure created successfully',
      });
      setFeeDialogOpen(false);
      feeForm.reset();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create fee structure',
        variant: 'destructive',
      });
    }
  };

  const onCreatePayment = async (data: PaymentFormData) => {
    try {
      await financialApi.createPayment(data);
      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
      });
      setPaymentDialogOpen(false);
      paymentForm.reset();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to record payment',
        variant: 'destructive',
      });
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = payments.filter((p) => p.status === 'pending').length;
  const totalPending = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter((p) =>
    `${p.studentName} ${p.feeName} ${p.transactionId || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground mt-2">Manage fees, payments, and financial reports</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs {totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Rs {totalPending.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Structures</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feeStructures.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="fees">Fee Structures</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>Record a new payment transaction</DialogDescription>
                </DialogHeader>
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onCreatePayment)} className="space-y-4">
                    <FormField
                      control={paymentForm.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select student" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {students.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.firstName} {student.lastName} ({student.studentId})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="feeStructureId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fee Structure</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select fee" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {feeStructures.map((fee) => (
                                <SelectItem key={fee.id} value={fee.id}>
                                  {fee.name} - Rs {fee.amount}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="online">Online</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Record Payment</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.studentName}</TableCell>
                          <TableCell>{payment.feeName}</TableCell>
                          <TableCell>Rs {payment.amount.toLocaleString()}</TableCell>
                          <TableCell className="capitalize">{payment.paymentMethod.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                payment.status === 'completed'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : payment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                            >
                              {payment.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {payment.paidAt
                              ? format(new Date(payment.paidAt), 'MMM dd, yyyy')
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredPayments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No payments found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fee Structures</CardTitle>
                <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Fee Structure
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Fee Structure</DialogTitle>
                      <DialogDescription>Add a new fee structure for students</DialogDescription>
                    </DialogHeader>
                    <Form {...feeForm}>
                      <form onSubmit={feeForm.handleSubmit(onCreateFee)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={feeForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Tuition Fee" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={feeForm.control}
                            name="feeType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fee Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="tuition">Tuition</SelectItem>
                                    <SelectItem value="library">Library</SelectItem>
                                    <SelectItem value="laboratory">Laboratory</SelectItem>
                                    <SelectItem value="sports">Sports</SelectItem>
                                    <SelectItem value="transport">Transport</SelectItem>
                                    <SelectItem value="hostel">Hostel</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={feeForm.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={feeForm.control}
                            name="dueDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Due Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={feeForm.control}
                            name="academicYear"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Academic Year</FormLabel>
                                <FormControl>
                                  <Input placeholder="2024-2025" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={feeForm.control}
                            name="applicableTo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Applicable To</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="all">All Students</SelectItem>
                                    <SelectItem value="class">Specific Class</SelectItem>
                                    <SelectItem value="student">Specific Student</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setFeeDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Create Fee Structure</Button>
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
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeStructures.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">{fee.name}</TableCell>
                          <TableCell className="capitalize">{fee.feeType.replace('_', ' ')}</TableCell>
                          <TableCell>Rs {fee.amount.toLocaleString()}</TableCell>
                          <TableCell>{format(new Date(fee.dueDate), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{fee.academicYear}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                fee.status === 'active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {fee.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {feeStructures.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No fee structures found
                    </div>
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
