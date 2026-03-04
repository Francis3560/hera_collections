import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import ExpenseCategoryService from '@/api/expenseCategory.service';
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  FolderTree, 
  Info, 
  Palette, 
  Type,
  LayoutGrid
} from 'lucide-react';
import { motion } from 'framer-motion';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as Icons from 'lucide-react';

// Schema
const expenseCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().max(500).optional().or(z.literal('')),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional().or(z.literal('')),
  icon: z.string().max(50).optional().or(z.literal('')),
});

const ExpenseCategoryModule = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#6366f1',
      icon: 'FolderTree',
    },
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await ExpenseCategoryService.getAllCategories({ search: searchQuery });
      setCategories(response.data);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch expense categories.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onSubmit = async (data) => {
    try {
      if (isEditing && currentCategory) {
        await ExpenseCategoryService.updateCategory(currentCategory.id, data);
        toast({ title: 'Success', description: 'Expense category updated successfully.' });
      } else {
        await ExpenseCategoryService.createCategory(data);
        toast({ title: 'Success', description: 'Expense category created successfully.' });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
        const message = error.response?.data?.message || 'Something went wrong.';
        toast({
            variant: 'destructive',
            title: 'Error',
            description: message,
        });
    }
  };

  const handleEdit = (category) => {
    setIsEditing(true);
    setCurrentCategory(category);
    form.reset({
      name: category.name,
      description: category.description || '',
      color: category.color || '#6366f1',
      icon: category.icon || 'FolderTree',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await ExpenseCategoryService.deleteCategory(categoryToDelete.id);
      toast({ title: 'Success', description: 'Expense category deleted successfully.' });
      fetchCategories();
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to delete category.';
        toast({
            variant: 'destructive',
            title: 'Error',
            description: message,
        });
    } finally {
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
        setCategoryToDelete(null);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentCategory(null);
    form.reset({
      name: '',
      description: '',
      color: '#6366f1',
      icon: 'FolderTree',
    });
  };

  const handleDialogChange = (open) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  };

  // Helper to render icon
  const renderIcon = (iconName, size = 20, className = "") => {
    const IconComponent = Icons[iconName] || Icons.FolderTree;
    return <IconComponent size={size} className={className} />;
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 space-y-10 animate-fade-in max-w-7xl mx-auto">
      {/* Hero Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-white shadow-glow">
              <FolderTree className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              Financial Infrastructure
            </span>
          </div>
          <h1 className="text-4xl lg:text-7xl font-black tracking-tight leading-none">
            Expense <span className="gradient-text">Categories</span>
          </h1>
          <p className="text-muted-foreground text-lg font-medium max-w-xl">
            Define the structural segments of your capital flow for precise auditing and reporting.
          </p>
        </div>
        
        <Button 
          onClick={() => setIsDialogOpen(true)} 
          className="btn-primary h-16 px-10 rounded-2xl group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <span className="relative flex items-center gap-3 text-lg font-bold">
            <Plus className="h-6 w-6 group-hover:rotate-180 transition-transform duration-700" />
            Create Category
          </span>
        </Button>
      </header>

      {/* Controls Bar */}
      <div className="glass-card flex flex-col md:flex-row items-center gap-6 border-white/10 dark:border-white/5 shadow-medium">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Filter by classification name or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 h-16 bg-background/50 border-white/10 focus:border-primary/50 text-lg rounded-xl shadow-inner transition-all"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 px-6 py-4 bg-muted/30 border border-white/5 rounded-xl">
            <FolderTree className="h-5 w-5 text-muted-foreground" />
            <span className="font-bold text-xl">{categories.length}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Classifications</span>
          </div>
        </div>
      </div>

      {/* Categories Grid Table */}
      <div className="glass-card !p-0 overflow-hidden shadow-strong border-white/10 animate-slide-up rounded-3xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-white/5">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[100px] py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">ID</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Identity & Visuals</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Utilization Metrics</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-60 hidden md:table-cell">Internal Description</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-60 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-96 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                      <p className="text-muted-foreground font-bold tracking-widest animate-pulse uppercase text-[10px]">Synchronizing Financial Elements...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-96 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <div className="h-20 w-20 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
                        <Search className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-xl font-bold">No Classifications Found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow 
                    key={category.id} 
                    className="group border-white/5 hover:bg-primary/[0.03] transition-colors"
                  >
                    <TableCell className="py-8 px-8">
                      <span className="font-mono text-[10px] font-black text-muted-foreground">
                        {category.id.toString().padStart(3, '0')}
                      </span>
                    </TableCell>
                    <TableCell className="py-8">
                      <div className="flex items-center gap-5">
                        <div 
                           className="h-14 w-14 rounded-2xl flex items-center justify-center border border-white/10 shadow-soft group-hover:scale-110 transition-transform duration-500"
                           style={{ backgroundColor: `${category.color}15`, color: category.color, borderColor: `${category.color}30` }}
                        >
                          {renderIcon(category.icon, 24)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-black leading-tight group-hover:text-primary transition-colors">
                            {category.name}
                          </p>
                          <div className="flex items-center gap-2">
                             <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">#{category.color.replace('#', '')}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-8">
                      <div className="space-y-1">
                        <p className="text-xl font-black tracking-tighter">
                          {category._count?.expenses || 0} <span className="text-[10px] font-bold opacity-40">ENTRIES</span>
                        </p>
                        <Badge variant="outline" className="text-[8px] font-black tracking-[0.2em] px-2 py-0 h-4 border-none bg-primary/10 text-primary">
                          LIVE CHANNEL
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-8 hidden md:table-cell max-w-[250px]">
                       <p className="text-sm font-medium text-muted-foreground line-clamp-2 leading-relaxed">
                          {category.description || 'Global classification for Hera Collections expenditures.'}
                       </p>
                    </TableCell>
                    <TableCell className="py-8 pr-8 text-right">
                      <div className="flex justify-end items-center gap-3">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(category)}
                          className="h-12 w-12 rounded-2xl hover:bg-primary/20 hover:text-primary transition-bounce"
                        >
                          <Pencil className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteClick(category)}
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
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none glass-card shadow-strong animate-scale-in">
          <div className="flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-white/5 bg-primary/5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-glow">
                  <FolderTree className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight leading-tight">
                    {isEditing ? 'Modify' : 'Initialize'} <span className="gradient-text">Classification</span>
                  </h2>
                  <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] mt-1">
                    System Architecture Management
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-10">
              <Form {...form}>
                <form id="expense-category-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                  <div className="grid lg:grid-cols-2 gap-10">
                    <div className="space-y-8">
                       <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Classification Identity</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Warehouse Logistics" 
                                {...field} 
                                className="h-14 text-lg font-bold border-white/10 bg-background/50 focus:border-primary px-5 rounded-xl transition-all"
                              />
                            </FormControl>
                            <FormMessage className="text-[10px] font-bold uppercase" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Internal Narrative</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Define what expenditures fall under this segment..." 
                                {...field} 
                                className="bg-background/50 border-white/10 focus:border-primary rounded-xl font-medium min-h-[160px] p-5 leading-relaxed" 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Visual Theme</FormLabel>
                              <div className="flex items-center gap-3">
                                <FormControl>
                                  <div className="relative h-14 w-full">
                                    <Input 
                                      type="color" 
                                      {...field} 
                                      className="h-14 w-full p-1 bg-background/50 border-white/10 rounded-xl cursor-pointer"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                      <div className="h-6 w-6 rounded-lg shadow-glow" style={{ backgroundColor: field.value }} />
                                    </div>
                                  </div>
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="icon"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Lucide Identifier</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                                     {renderIcon(field.value, 18)}
                                  </div>
                                  <Input 
                                    placeholder="Icon Name" 
                                    {...field} 
                                    className="h-14 pl-12 bg-background/50 focus:bg-background border-white/10 rounded-xl transition-all font-mono text-xs uppercase"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-3">
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Real-time Visualization</FormLabel>
                        <div 
                           className="aspect-video rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-6 transition-all duration-700 relative overflow-hidden group shadow-inner"
                           style={{ backgroundColor: `${form.watch('color')}08` }}
                        >
                           <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                           <div 
                            className="h-24 w-24 rounded-[2.5rem] flex items-center justify-center shadow-glow transition-all duration-700 group-hover:rotate-[360deg] group-hover:scale-110"
                            style={{ backgroundColor: `${form.watch('color')}20`, color: form.watch('color'), boxShadow: `0 0 40px ${form.watch('color')}15` }}
                           >
                            {renderIcon(form.watch('icon'), 40)}
                           </div>
                           <div className="text-center">
                            <h4 className="font-black text-2xl tracking-tight" style={{ color: form.watch('color') }}>
                              {form.watch('name') || 'Pending Identity'}
                            </h4>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 mt-1">Infrastructure Preview</p>
                           </div>
                        </div>
                      </div>
                    </div>
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
                Discard
              </Button>
              <Button 
                form="expense-category-form"
                type="submit" 
                disabled={form.formState.isSubmitting}
                className="btn-primary h-14 rounded-xl px-12 font-black uppercase tracking-widest text-[10px] min-w-[220px]"
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : isEditing ? 'Commit Update' : 'Initialize Classification'}
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
        description="This action will permanently remove this classification segment. This is only possible if there are ZERO transactions currently linked to this identity."
      >
        {categoryToDelete && (
          <div className="glass shadow-strong rounded-2xl p-6 mt-4 border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-5">
              <div 
                className="h-20 w-20 rounded-2xl flex items-center justify-center border shrink-0 shadow-soft transition-transform duration-700 hover:rotate-12"
                style={{ backgroundColor: `${categoryToDelete.color}15`, color: categoryToDelete.color, borderColor: `${categoryToDelete.color}30` }}
              >
                {renderIcon(categoryToDelete.icon, 32)}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/70 mb-1">Target Classification</p>
                <p className="font-black text-2xl leading-tight">{categoryToDelete.name}</p>
                <div className="flex items-center gap-2 mt-1">
                   <div className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryToDelete.color }} />
                   <span className="text-xs font-bold opacity-60 uppercase tracking-widest font-mono">#{categoryToDelete.color.replace('#', '')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
};

export default ExpenseCategoryModule;
