import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
    AlertDialog, AlertDialogAction, AlertDialogCancel, 
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
    AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import customerService from '@/api/customer.service';
import { 
    Eye, Search, Filter, Loader2, Mail, Phone, MoreVertical, 
    Plus, Pencil, Trash2, Send 
} from 'lucide-react';
import { format } from "date-fns";

const CustomersList = () => {
    // Data State
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Modal States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Forms
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    const [emailData, setEmailData] = useState({
        subject: '',
        message: ''
    });

    useEffect(() => {
        fetchCustomers();
    }, [search]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (search) params.search = search;
            
            const res = await customerService.getCustomers(params);
            // Handle both array direct return or paginated object
            const data = Array.isArray(res) ? res : (res.items || res.data || []);
            setCustomers(data);
        } catch (error) {
            console.error(error);
            toast({ 
                title: "Error", 
                description: "Failed to load customers", 
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---

    const handleCreate = async () => {
        if (!formData.email || !formData.name || !formData.password) {
            toast({ title: "Validation Error", description: "Name, Email and Password are required", variant: "destructive" });
            return;
        }
        setActionLoading(true);
        try {
            await customerService.createCustomer({
                ...formData,
                full_name: formData.name, // compatibility
                role: 'USER'
            });
            toast({ title: "Success", description: "Customer created successfully" });
            setIsAddOpen(false);
            setFormData({ name: '', email: '', phone: '', password: '' });
            fetchCustomers();
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to create customer", variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedCustomer) return;
        setActionLoading(true);
        try {
            const updatePayload: any = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            };
            // Only send password if provided
            if (formData.password) updatePayload.password = formData.password;

            await customerService.updateCustomer(selectedCustomer.id, updatePayload);
            toast({ title: "Success", description: "Customer updated successfully" });
            setIsEditOpen(false);
            fetchCustomers();
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to update customer", variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedCustomer) return;
        setActionLoading(true);
        try {
            await customerService.deleteCustomer(selectedCustomer.id);
            toast({ title: "Success", description: "Customer deleted successfully" });
            setIsDeleteOpen(false);
            fetchCustomers();
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to delete customer", variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendEmail = async () => {
        if (!selectedCustomer) return;
        if (!emailData.subject || !emailData.message) {
            toast({ title: "Error", description: "Subject and Message are required", variant: "destructive" });
            return;
        }
        setActionLoading(true);
        try {
            await customerService.sendEmail(selectedCustomer.id, emailData);
            toast({ title: "Success", description: `Email sent to ${selectedCustomer.email}` });
            setIsEmailOpen(false);
            setEmailData({ subject: '', message: '' });
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to send email", variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };

    // --- Format Utils ---
    const openEdit = (customer: any) => {
        setSelectedCustomer(customer);
        setFormData({
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            password: '' // Don't prefill password
        });
        setIsEditOpen(true);
    };

    const openEmail = (customer: any) => {
        setSelectedCustomer(customer);
        setIsEmailOpen(true);
    };

    const openDelete = (customer: any) => {
        setSelectedCustomer(customer);
        setIsDeleteOpen(true);
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Customers
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your customer base, send emails, and track activity.
                    </p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="shadow-lg hover:shadow-xl transition-all">
                    <Plus className="mr-2 h-4 w-4" /> Add Customer
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or phone..."
                        className="pl-9 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="hidden sm:flex" disabled>
                    <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Contact Info</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-center">Orders</TableHead>
                            <TableHead>Joined Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center">
                                    <div className="flex flex-col justify-center items-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="text-muted-foreground text-sm">Loading customer data...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                    No customers found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((customer: any) => (
                                <TableRow key={customer.id} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        #{customer.id}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-primary font-bold text-sm shadow-sm">
                                                {customer.name ? customer.name.substring(0, 2).toUpperCase() : 'CU'}
                                            </div>
                                            <div>
                                                <div className="font-medium">{customer.name || 'Guest/Unknown'}</div>
                                                <div className="text-xs text-muted-foreground hidden sm:block">
                                                    {customer.provider === 'GOOGLE' ? 'Via Google' : 'Registered'}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{customer.email}</span>
                                            </div>
                                            {customer.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span>{customer.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Badge variant={customer.isVerified ? "default" : "secondary"}>
                                                {customer.isVerified ? "Verified" : "Unverified"}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {customer.status}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="font-mono">
                                            {customer._count?.orders || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => openEdit(customer)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEmail(customer)}>
                                                    <Mail className="mr-2 h-4 w-4" /> Send Email
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    onClick={() => openDelete(customer)}
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            
            <div className="flex items-center justify-between px-2">
                <div className="text-sm text-muted-foreground">
                    Showing {customers.length} results
                </div>
            </div>

            {/* --- Modals --- */}

            {/* Create Customer Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                        <DialogDescription>Create a new customer account manually.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input 
                                placeholder="John Doe" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input 
                                type="email"
                                placeholder="john@example.com" 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone (Optional)</Label>
                            <Input 
                                placeholder="+1234567890" 
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input 
                                type="password"
                                placeholder="******" 
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Customer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Customer Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Customer</DialogTitle>
                        <DialogDescription>Update customer details.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input 
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label>New Password (Optional)</Label>
                            <Input 
                                type="password"
                                placeholder="Leave blank to keep current" 
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Email Dialog */}
            <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Send Email</DialogTitle>
                        <DialogDescription>
                            Sending to <span className="font-semibold text-foreground">{selectedCustomer?.email}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Input 
                                placeholder="Important update regarding..." 
                                value={emailData.subject}
                                onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Message</Label>
                            <Textarea 
                                placeholder="Type your message here..." 
                                className="min-h-[150px]"
                                value={emailData.message}
                                onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEmailOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendEmail} disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Send Email
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete 
                            <span className="font-semibold text-foreground"> {selectedCustomer?.name}</span>'s 
                            account and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => { e.preventDefault(); handleDelete(); }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            disabled={actionLoading}
                        >
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default CustomersList;
