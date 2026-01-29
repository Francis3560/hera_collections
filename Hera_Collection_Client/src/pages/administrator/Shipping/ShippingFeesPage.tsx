import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Truck, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Loader2,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ShippingService from "@/api/shipping.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ShippingFeesPage() {
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    fee: "",
    estimatedDays: "",
    description: "",
    isActive: true
  });

  const fetchRegions = async () => {
    setLoading(true);
    try {
      const data = await ShippingService.getAllRegions();
      setRegions(data);
    } catch (error) {
      console.error("Failed to fetch regions", error);
      toast.error("Failed to load shipping regions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  const handleOpenAddDialog = () => {
    setCurrentRegion(null);
    setFormData({
      name: "",
      fee: "",
      estimatedDays: "",
      description: "",
      isActive: true
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (region: any) => {
    setCurrentRegion(region);
    setFormData({
      name: region.name,
      fee: region.fee.toString(),
      estimatedDays: region.estimatedDays || "",
      description: region.description || "",
      isActive: region.isActive
    });
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (region: any) => {
    setCurrentRegion(region);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveRegion = async () => {
    if (!formData.name || !formData.fee) {
      toast.error("Please fill in all required fields");
      return;
    }

    setActionLoading(true);
    try {
      if (currentRegion) {
        await ShippingService.updateRegion(currentRegion.id, formData);
        toast.success("Shipping region updated successfully");
      } else {
        await ShippingService.createRegion(formData);
        toast.success("Shipping region created successfully");
      }
      setIsDialogOpen(false);
      fetchRegions();
    } catch (error) {
      console.error("Failed to save region", error);
      toast.error("Failed to save shipping region");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRegion = async () => {
    if (!currentRegion) return;
    
    setActionLoading(true);
    try {
      await ShippingService.deleteRegion(currentRegion.id);
      toast.success("Shipping region deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchRegions();
    } catch (error) {
      console.error("Failed to delete region", error);
      toast.error("Failed to delete shipping region");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRegions = regions.filter(region => 
    region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (region.description && region.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipping Fees</h1>
          <p className="text-muted-foreground">Manage shipping regions and their corresponding fees.</p>
        </div>
        <Button onClick={handleOpenAddDialog} className="gradient-primary hover-lift">
          <Plus className="mr-2 h-4 w-4" /> Add Region
        </Button>
      </div>

      <Card className="border-none shadow-elegant bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search regions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm border-none bg-muted/50 focus-visible:ring-primary/20"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading shipping data...</p>
            </div>
          ) : filteredRegions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-lg">No regions found</h3>
              <p className="text-muted-foreground max-w-xs">
                {searchTerm ? "No regions match your search term." : "Get started by adding your first shipping region."}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold">Region Name</TableHead>
                    <TableHead className="font-bold">Shipping Fee</TableHead>
                    <TableHead className="font-bold">Delivery Time</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegions.map((region) => (
                    <TableRow key={region.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{region.name}</span>
                          {region.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">{region.description}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        KES {Number(region.fee).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {region.estimatedDays || "N/A"}
                      </TableCell>
                      <TableCell>
                        {region.isActive ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenEditDialog(region)}
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenDeleteDialog(region)}
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>{currentRegion ? "Edit Region" : "Add New Shipping Region"}</DialogTitle>
            <DialogDescription>
              Set a name and fee for this shipping destination.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Region Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3 rounded-xl"
                placeholder="e.g. Nairobi CBD"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fee" className="text-right">Shipping Fee (KES)</Label>
              <Input
                id="fee"
                type="number"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                className="col-span-3 rounded-xl"
                placeholder="e.g. 200"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="estimatedDays" className="text-right">Est. Delivery</Label>
              <Input
                id="estimatedDays"
                value={formData.estimatedDays}
                onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                className="col-span-3 rounded-xl"
                placeholder="e.g. 24 - 48 hours"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3 rounded-xl resize-none"
                placeholder="Details about covered areas or service levels..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">Active</Label>
              <div className="col-span-3">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveRegion} disabled={actionLoading} className="gradient-primary rounded-xl px-8">
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentRegion ? "Update Region" : "Create Region"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> Confirm Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the shipping region <strong>{currentRegion?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteRegion} disabled={actionLoading} className="rounded-xl px-8">
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
