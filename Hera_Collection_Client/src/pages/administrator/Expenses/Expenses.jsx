import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import ExpenseService from '@/api/expense.service';
import ExpenseCategoryService from '@/api/expenseCategory.service';
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Receipt, 
  Info, 
  Wallet, 
  Type,
  CalendarDays,
  CreditCard,
  Hash,
  FilterX,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OrbitProgress } from 'react-loading-indicators';
import * as Icons from 'lucide-react';

const expenseSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(160),
  description: z.string().max(1000).optional().or(z.literal('')),
  amount: z.coerce.number().min(0.01, 'Amount must be at least 0.01'),
  date: z.string().optional().or(z.literal('')),
  categoryId: z.coerce.number().optional().nullable(),
  paymentMethod: z.enum(['MPESA', 'CARD', 'CASH', 'OTHER']).default('CASH'),
  referenceNumber: z.string().max(64).optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'CANCELLED']).default('ACTIVE'),
});

const FullPageWorkflowLoader = ({ message = "Processing Transaction..." }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center z-[100]"
  >
    <div className="flex flex-col items-center gap-6 text-center">
      <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />
      <div className="space-y-2">
        <h3 className="text-2xl font-black tracking-tight gradient-text">{message}</h3>
        <p className="text-muted-foreground font-medium animate-pulse">Encrypting data and synchronizing ledger...</p>
      </div>
    </div>
  </motion.div>
);

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSubmittingWorkflow, setIsSubmittingWorkflow] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
      paymentMethod: 'CASH',
      referenceNumber: '',
      status: 'ACTIVE',
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expensesRes, categoriesRes] = await Promise.all([
        ExpenseService.getAllExpenses({ search: searchQuery }),
        ExpenseCategoryService.getAllCategories()
      ]);
      setExpenses(expensesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Network Error',
        description: 'Failed to synchronize with the financial registry.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onSubmit = async (data) => {
    setIsSubmittingWorkflow(true);
    try {
      const payload = {
        ...data,
        categoryId: data.categoryId ? Number(data.categoryId) : null,
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString()
      };

      if (isEditing && currentExpense) {
        await ExpenseService.updateExpense(currentExpense.id, payload);
        toast({ title: 'Ledger Updated', description: 'Expense record synchronized successfully.' });
      } else {
        await ExpenseService.createExpense(payload);
        toast({ title: 'Transaction Recorded', description: 'New expenditure added to the registry.' });
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
        const message = error.response?.data?.message || 'Transaction validation failed.';
        toast({
            variant: 'destructive',
            title: 'Registry Error',
            description: message,
        });
    } finally {
      setIsSubmittingWorkflow(false);
    }
  };

  const handleEdit = (expense) => {
    setIsEditing(true);
    setCurrentExpense(expense);
    form.reset({
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount,
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
      categoryId: expense.categoryId?.toString() || '',
      paymentMethod: expense.paymentMethod || 'CASH',
      referenceNumber: expense.referenceNumber || '',
      status: expense.status || 'ACTIVE',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      await ExpenseService.deleteExpense(expenseToDelete.id);
      toast({ title: 'Entry Removed', description: 'Expense record purged from the registry.' });
      fetchData();
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to delete expense entry.',
        });
    } finally {
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
        setExpenseToDelete(null);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentExpense(null);
    form.reset({
      title: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
      paymentMethod: 'CASH',
      referenceNumber: '',
      status: 'ACTIVE',
    });
  };

  const handleDialogChange = (open) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  };

  const renderIcon = (iconName, size = 18, className = "") => {
    const IconComponent = Icons[iconName] || Icons.FolderTree;
    return <IconComponent size={size} className={className} />;
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 space-y-10 animate-fade-in max-w-7xl mx-auto">
      <AnimatePresence>
        {isSubmittingWorkflow && (
          <FullPageWorkflowLoader 
            message={isEditing ? "Reconciling Transaction..." : "Securing Expense Record..."} 
          />
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-white shadow-glow">
              <Receipt className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              Operational Capital Flow
            </span>
          </div>
          <h1 className="text-4xl lg:text-7xl font-black tracking-tight leading-none">
            Financial <span className="gradient-text">Registry</span>
          </h1>
          <p className="text-muted-foreground text-lg font-medium max-w-xl">
            Audit every expenditure with total transparency. Enterprise-grade record keeping for Hera Collection.
          </p>
        </div>
        
        <Button 
          onClick={() => setIsDialogOpen(true)} 
          className="btn-primary h-16 px-10 rounded-2xl group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <span className="relative flex items-center gap-3 text-lg font-bold">
            <Plus className="h-6 w-6 group-hover:rotate-180 transition-transform duration-700" />
            Create New Expense
          </span>
        </Button>
      </header>

      {/* Controls Bar */}
      <div className="glass-card flex flex-col md:flex-row items-center gap-6 border-white/10 dark:border-white/5 shadow-medium">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Filter by title, reference, or recipient..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 h-16 bg-background/50 border-white/10 focus:border-primary/50 text-lg rounded-xl shadow-inner transition-all"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 px-6 py-4 bg-muted/30 border border-white/5 rounded-xl">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <span className="font-bold text-xl">{expenses.length}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Audit Items</span>
          </div>
        </div>
      </div>

      {/* Main Data Grid */}
      <div className="glass-card !p-0 overflow-hidden shadow-strong border-white/10 animate-slide-up rounded-3xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-white/5">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[100px] py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Audit ID</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Transaction Description</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Classification</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Monetary Value</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Payment Method</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-60 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-96 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <OrbitProgress color="hsl(var(--primary))" size="medium" />
                      <p className="text-muted-foreground font-bold tracking-widest animate-pulse">SYNCHRONIZING SECURE LEDGER...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-96 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <div className="h-20 w-20 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
                        <FilterX className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-xl font-bold">No Records Detected</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow 
                    key={expense.id} 
                    className="group border-white/5 hover:bg-primary/[0.03] transition-colors"
                  >
                    <TableCell className="py-8 px-8">
                      <span className="font-mono text-[10px] font-black text-muted-foreground">
                        {expense.id.toString().padStart(5, '0')}
                      </span>
                    </TableCell>
                    <TableCell className="py-8">
                      <div className="space-y-1">
                        <p className="text-lg font-black leading-tight group-hover:text-primary transition-colors">
                          {expense.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <CalendarDays className="h-3 w-3" />
                          {format(new Date(expense.date), 'MMMM dd, yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-8">
                      {expense.category ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-lg">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: expense.category.color }} />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {expense.category.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-20 italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="py-8">
                      <div className="space-y-0.5">
                        <p className="text-xl font-black tracking-tight">
                          <span className="text-sm font-bold opacity-40 mr-1">KES</span>
                          {Number(expense.amount).toLocaleString()}
                        </p>
                        <Badge 
                          variant={expense.status === 'ACTIVE' ? 'outline' : 'destructive'}
                          className={`text-[8px] font-black tracking-[0.2em] px-2 py-0 h-4 border-none ${expense.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : ''}`}
                        >
                          {expense.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-8">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest">{expense.paymentMethod}</span>
                          <span className="text-[9px] font-mono text-muted-foreground">{expense.referenceNumber || 'N/A'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-8 pr-8 text-right">
                      <div className="flex justify-end items-center gap-3">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(expense)}
                          className="h-12 w-12 rounded-2xl hover:bg-primary/20 hover:text-primary transition-bounce"
                        >
                          <Pencil className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteClick(expense)}
                          className="h-12 w-12 rounded-2xl hover:bg-destructive/20 hover:text-destructive transition-bounce"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Persistence Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange} className="bg-background">
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none glass-card shadow-strong animate-scale-in">
          <div className="flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-white/5 bg-primary/5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-glow">
                  <Receipt className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight leading-tight">
                    {isEditing ? 'Modify' : 'Record'} <span className="gradient-text">Expenditure</span>
                  </h2>
                  <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] mt-1">
                    Secure Registry Management System
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-10">
              <Form {...form}>
                <form id="expense-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid gap-8">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Transaction Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Warehouse Logistics Q2" 
                              {...field} 
                              className="h-14 text-lg font-bold border-white/10 bg-background/50 focus:border-primary px-5 rounded-xl transition-all"
                            />
                          </FormControl>
                          <FormMessage className="text-[10px] font-bold uppercase" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Monetary Amount</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black opacity-40">KES</span>
                                <Input 
                                  type="number"
                                  placeholder="0.00" 
                                  {...field} 
                                  className="h-14 pl-14 text-xl font-black border-white/10 bg-background/50 focus:border-primary rounded-xl transition-all"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px] font-bold uppercase" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Effective Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date"
                                {...field} 
                                className="h-14 font-bold border-white/10 bg-background/50 focus:border-primary px-5 rounded-xl transition-all uppercase"
                              />
                            </FormControl>
                            <FormMessage className="text-[10px] font-bold uppercase" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Business Classification</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger className="h-14 font-bold border-white/10 bg-background/50 px-5 rounded-xl">
                                  <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="glass border-white/10">
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id.toString()} className="font-bold uppercase tracking-widest text-[10px]">
                                    <div className="flex items-center gap-2">
                                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                      {cat.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Financial Channel</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-14 font-bold border-white/10 bg-background/50 px-5 rounded-xl">
                                  <SelectValue placeholder="Select Method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="glass border-white/10">
                                <SelectItem value="CASH" className="font-bold text-[10px]">LIQUID CASH</SelectItem>
                                <SelectItem value="MPESA" className="font-bold text-[10px]">M-PESA WALLET</SelectItem>
                                <SelectItem value="CARD" className="font-bold text-[10px]">DEBIT/CREDIT CARD</SelectItem>
                                <SelectItem value="OTHER" className="font-bold text-[10px]">BANK TRANSFER / OTHER</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Narrative Summary (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide internal audit context..." 
                              {...field} 
                              className="bg-background/50 border-white/10 focus:border-primary rounded-xl font-medium min-h-[100px] p-5" 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </ScrollArea>

            <div className="p-10 border-t border-white/5 bg-muted/20 flex justify-end gap-4">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="h-14 rounded-xl px-10 font-black uppercase tracking-widest text-[10px] border-white/10"
              >
                Cancel
              </Button>
              <Button 
                form="expense-form"
                type="submit" 
                className="btn-primary h-14 rounded-xl px-12 font-black uppercase tracking-widest text-[10px]"
              >
                {isEditing ? 'Commit Update' : 'Authorize Record'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Protocols */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Authorize Purge?"
        description="This operation is mission-critical and irreversible. Removing this record will permanently alter the Hera Collection historical audit logs."
      >
        {expenseToDelete && (
          <div className="glass shadow-strong rounded-2xl p-6 mt-4 border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/10 shrink-0">
                <Icons.AlertOctagon className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/70 mb-1">Target Entry</p>
                <p className="font-black text-xl leading-tight">{expenseToDelete.title}</p>
                <p className="text-sm font-bold opacity-60">KES {Number(expenseToDelete.amount).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
};

export default Expenses;
