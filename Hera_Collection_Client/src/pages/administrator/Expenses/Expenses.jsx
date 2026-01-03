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
    <div className="space-y-8 p-6 lg:p-8 pb-20 animate-fade-in max-w-7xl mx-auto">
      <AnimatePresence>
        {isSubmittingWorkflow && <FullPageWorkflowLoader message={isEditing ? "Syncing Ledger Changes..." : "Registering Expenditure..."} />}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="space-y-3">
          <Badge variant="outline" className="px-4 py-1.5 border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest animate-scale-in">
            Financial Operations
          </Badge>
          <h2 className="text-4xl lg:text-6xl font-black tracking-tight gradient-text leading-tight">
            Expenditure Registry
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl font-medium">
            Monitor and audit every financial outflow with enterprise-grade precision.
          </p>
        </div>
        <Button 
          onClick={() => setIsDialogOpen(true)} 
          className="btn-primary flex items-center gap-2 px-8 h-14 text-base font-bold group"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
          Record Expense
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-white/5 dark:bg-zinc-900/30 p-6 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-strong">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
          <Input 
            placeholder="Search operational expenses..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 h-14 bg-background/50 focus:bg-background border-white/20 focus:border-primary/50 focus:ring-primary/20 rounded-2xl text-base transition-all shadow-inner"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-primary/5 border border-primary/10 rounded-2xl">
            <Receipt className="h-5 w-5 text-primary" />
            <span className="text-base font-bold text-primary">{expenses.length}</span>
            <span className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Entries</span>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-card !p-0 overflow-hidden shadow-strong border-white/10 dark:border-white/5 animate-slide-up">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-white/10">
              <TableRow className="hover:bg-transparent border-white/10">
                <TableHead className="w-[80px] text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6 px-8">Audit ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6">Transaction</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6">Classification</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6">Value (KES)</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6">Status</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6 px-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                      <p className="text-sm font-medium text-muted-foreground">Synchronizing Records...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                      <div className="p-4 bg-muted rounded-full">
                        <FilterX className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-muted-foreground">No financial records detected</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow 
                    key={expense.id} 
                    className="group border-white/5 hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] transition-colors"
                  >
                    <TableCell className="py-6 px-8 font-mono text-[10px] font-bold text-muted-foreground/60">
                      #{expense.id.toString().padStart(4, '0')}
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-lg group-hover:text-primary transition-colors">{expense.title}</span>
                        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest">
                          <CalendarDays className="h-3 w-3" />
                          {format(new Date(expense.date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      {expense.category ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl w-fit">
                          <div 
                            className="h-3 w-3 rounded-full shadow-glow" 
                            style={{ backgroundColor: expense.category.color }} 
                          />
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                            {expense.category.name}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] font-black uppercase opacity-50">Unclassified</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-6">
                        <div className="flex flex-col">
                            <span className="font-black text-xl text-foreground">
                                {Number(expense.amount).toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 tracking-tighter">
                                {expense.paymentMethod} • {expense.referenceNumber || 'INTERNAL'}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge 
                        variant={expense.status === 'ACTIVE' ? 'default' : 'destructive'}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${expense.status === 'ACTIVE' ? 'bg-primary/20 text-primary hover:bg-primary/30' : ''}`}
                      >
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
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
                          className="h-12 w-12 rounded-2xl hover:bg-red-500/20 hover:text-red-500 transition-bounce"
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

      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-[1000px] p-0 overflow-hidden border-none glass-card shadow-strong animate-scale-in text-foreground">
          <div className="flex flex-col h-[90vh] md:h-auto max-h-[95vh]">
            {/* Header */}
            <div className="p-8 pb-0">
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-black tracking-tight gradient-text">
                      {isEditing ? 'Reconcile Transaction' : 'Record Expenditure'}
                    </DialogTitle>
                    <DialogDescription className="text-base font-medium text-muted-foreground">
                      {isEditing 
                        ? 'Modify the details of this existing financial entry.' 
                        : 'Register a new operational cost into the central ledger.'
                      }
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <ScrollArea className="flex-1 px-8 py-6">
              <Form {...form}>
                <form id="expense-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Core Identity */}
                    <div className="space-y-6">
                      <Card className="bg-white/5 border-white/10 shadow-soft overflow-hidden border-none">
                        <CardHeader className="pb-4 bg-primary/5 border-b border-white/5">
                          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Type className="h-4 w-4 text-primary" /> Description
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Expense Title</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., Office Rent - Q4" 
                                    {...field} 
                                    className="bg-background/50 focus:bg-background border-white/10 h-12 rounded-xl transition-all font-bold text-base"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Detailed Narrative</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Provide detailed context for this expenditure..." 
                                    {...field} 
                                    className="resize-none bg-background/50 focus:bg-background border-white/10 rounded-xl transition-all min-h-[120px] font-medium" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>

                      <Card className="bg-white/5 border-white/10 shadow-soft overflow-hidden border-none">
                        <CardHeader className="pb-4 bg-primary/5 border-b border-white/5">
                          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Icons.Banknote className="h-4 w-4 text-primary" /> Financial Values
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Amount (KES)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00" 
                                    {...field} 
                                    className="bg-background/50 focus:bg-background border-white/10 h-12 rounded-xl transition-all font-black text-xl text-primary"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Transaction Date</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date"
                                    {...field} 
                                    className="bg-background/50 focus:bg-background border-white/10 h-12 rounded-xl transition-all font-bold"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right Column: Classification & Logistics */}
                    <div className="space-y-6">
                      <Card className="bg-white/5 border-white/10 shadow-soft overflow-hidden border-none">
                        <CardHeader className="pb-4 bg-primary/5 border-b border-white/5">
                          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                             <ChevronRight className="h-4 w-4 text-primary" /> Logistics
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Classification</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        defaultValue={field.value?.toString()}
                                        value={field.value?.toString()}
                                    >
                                    <FormControl>
                                        <SelectTrigger className="bg-background/50 border-white/10 h-12 rounded-xl h-12 font-bold text-sm">
                                            <SelectValue placeholder="Categorize flow..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-zinc-900 border-white/10">
                                        {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
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
                                    <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Payment Channel</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-background/50 border-white/10 h-12 rounded-xl h-12 font-bold text-sm">
                                            <SelectValue placeholder="Channel..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-zinc-900 border-white/10">
                                        <SelectItem value="CASH">Liquid Cash</SelectItem>
                                        <SelectItem value="MPESA">M-Pesa Mobile</SelectItem>
                                        <SelectItem value="CARD">Debit/Credit Card</SelectItem>
                                        <SelectItem value="OTHER">Other Channels</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="referenceNumber"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Ref / Receipt #</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                            <Input 
                                                placeholder="e.g., MP12345X" 
                                                {...field} 
                                                className="pl-10 bg-background/50 focus:bg-background border-white/10 h-12 rounded-xl transition-all font-mono text-xs uppercase"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Audit Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-background/50 border-white/10 h-12 rounded-xl h-12 font-bold text-sm">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-zinc-900 border-white/10">
                                        <SelectItem value="ACTIVE">ACTIVE (AUDITED)</SelectItem>
                                        <SelectItem value="CANCELLED">CANCELLED (VOID)</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                          </div>

                          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3 items-start mt-4">
                            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                              Ensure all reference numbers are entered exactly as they appear on the receipt for seamless audit trails. VOID transactions will remain in history but excluded from analytics.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </form>
              </Form>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="p-8 pt-6 border-t border-white/5 bg-black/20">
              <DialogFooter className="flex-row sm:justify-end gap-3 items-center">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsDialogOpen(false)} 
                  className="h-14 rounded-2xl px-8 font-black text-xs uppercase tracking-widest border-white/10 hover:bg-white/5"
                >
                  Discard
                </Button>
                <Button 
                  form="expense-form"
                  type="submit" 
                  className="h-14 rounded-2xl px-12 btn-primary font-black text-xs uppercase tracking-widest shadow-glow min-w-[200px]"
                >
                   {isEditing ? 'Authorize Update' : 'Commit Entry'}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          isLoading={isDeleting}
          title="Purge Transaction?"
          description="This will permanently delete this expenditure from the registry. This action is irreversible and will affect financial reports."
          confirmText="Confirm Purge"
      >
          {expenseToDelete && (
              <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/10 shrink-0 shadow-soft">
                      <Receipt className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="flex flex-col">
                      <span className="font-black text-foreground break-words">{expenseToDelete.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-red-500 uppercase tracking-widest">KES {Number(expenseToDelete.amount).toLocaleString()}</span>
                      </div>
                  </div>
              </div>
          )}
      </ConfirmModal>
    </div>
  );
};

export default Expenses;
