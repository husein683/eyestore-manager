import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Eye, Search, Printer, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import PrescriptionReceipt from "@/components/PrescriptionReceipt";

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    prescription_date: new Date().toISOString().split("T")[0],
    // D.V. (Distance Vision) - Right Eye
    right_eye_sphere: "",
    right_eye_cylinder: "",
    right_eye_axis: "",
    right_eye_va: "",
    // D.V. (Distance Vision) - Left Eye
    left_eye_sphere: "",
    left_eye_cylinder: "",
    left_eye_axis: "",
    left_eye_va: "",
    // N.V. (Near Vision) - Right Eye
    right_eye_nv_sphere: "",
    right_eye_nv_cylinder: "",
    right_eye_nv_axis: "",
    right_eye_nv_va: "",
    // N.V. (Near Vision) - Left Eye
    left_eye_nv_sphere: "",
    left_eye_nv_cylinder: "",
    left_eye_nv_axis: "",
    left_eye_nv_va: "",
    // Lens Options
    emr_coating: false,
    blue_cut: false,
    plastic: false,
    tint: false,
    anti_glare: false,
    polycarbonate: false,
    // Lens Type
    bifocal: false,
    progressive: false,
    // IPD
    pd_distance: "",
    notes: "",
  });

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  useEffect(() => {
    fetchPrescriptions();
    fetchCustomers();
    fetchStoreSettings();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [search, prescriptions]);

  const fetchPrescriptions = async () => {
    const { data, error } = await supabase
      .from("prescriptions")
      .select(`
        *,
        customer:customers(name, phone)
      `)
      .order("prescription_date", { ascending: false });

    if (error) {
      toast.error("Failed to fetch prescriptions");
    } else {
      setPrescriptions(data || []);
    }
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("*");
    setCustomers(data || []);
  };

  const fetchStoreSettings = async () => {
    const { data } = await supabase.from("store_settings").select("*").limit(1).maybeSingle();
    if (data) {
      setStoreSettings(data);
    }
  };

  const handlePrintPrescription = (prescription: any) => {
    setSelectedPrescription(prescription);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const filterPrescriptions = () => {
    if (!search) {
      setFilteredPrescriptions(prescriptions);
      return;
    }

    const filtered = prescriptions.filter(
      (p) => p.customer?.name.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredPrescriptions(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let customerId = formData.customer_id;

    // If creating new customer, add them first
    if (isNewCustomer && formData.customer_name && formData.customer_phone) {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert([{
          name: formData.customer_name,
          phone: formData.customer_phone,
          email: formData.customer_email || null,
        }])
        .select()
        .single();

      if (customerError) {
        toast.error("Failed to create customer: " + customerError.message);
        return;
      }

      customerId = newCustomer.id;
      toast.success("Customer created successfully!");
    }

    if (!customerId) {
      toast.error("Please select or create a customer");
      return;
    }

    const prescriptionData = {
      customer_id: customerId,
      prescription_date: formData.prescription_date,
      // D.V. Right Eye
      right_eye_sphere: formData.right_eye_sphere ? parseFloat(formData.right_eye_sphere) : null,
      right_eye_cylinder: formData.right_eye_cylinder ? parseFloat(formData.right_eye_cylinder) : null,
      right_eye_axis: formData.right_eye_axis ? parseInt(formData.right_eye_axis) : null,
      right_eye_va: formData.right_eye_va || null,
      // D.V. Left Eye
      left_eye_sphere: formData.left_eye_sphere ? parseFloat(formData.left_eye_sphere) : null,
      left_eye_cylinder: formData.left_eye_cylinder ? parseFloat(formData.left_eye_cylinder) : null,
      left_eye_axis: formData.left_eye_axis ? parseInt(formData.left_eye_axis) : null,
      left_eye_va: formData.left_eye_va || null,
      // N.V. Right Eye
      right_eye_nv_sphere: formData.right_eye_nv_sphere ? parseFloat(formData.right_eye_nv_sphere) : null,
      right_eye_nv_cylinder: formData.right_eye_nv_cylinder ? parseFloat(formData.right_eye_nv_cylinder) : null,
      right_eye_nv_axis: formData.right_eye_nv_axis ? parseInt(formData.right_eye_nv_axis) : null,
      right_eye_nv_va: formData.right_eye_nv_va || null,
      // N.V. Left Eye
      left_eye_nv_sphere: formData.left_eye_nv_sphere ? parseFloat(formData.left_eye_nv_sphere) : null,
      left_eye_nv_cylinder: formData.left_eye_nv_cylinder ? parseFloat(formData.left_eye_nv_cylinder) : null,
      left_eye_nv_axis: formData.left_eye_nv_axis ? parseInt(formData.left_eye_nv_axis) : null,
      left_eye_nv_va: formData.left_eye_nv_va || null,
      // Lens Options
      emr_coating: formData.emr_coating,
      blue_cut: formData.blue_cut,
      plastic: formData.plastic,
      tint: formData.tint,
      anti_glare: formData.anti_glare,
      polycarbonate: formData.polycarbonate,
      // Lens Type
      bifocal: formData.bifocal,
      progressive: formData.progressive,
      // IPD & Notes
      pd_distance: formData.pd_distance ? parseFloat(formData.pd_distance) : null,
      notes: formData.notes || null,
    };

    const { error } = await supabase.from("prescriptions").insert([prescriptionData]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Prescription added successfully!");
      setOpen(false);
      resetForm();
      fetchPrescriptions();
      fetchCustomers();
    }
  };

  const resetForm = () => {
    setIsNewCustomer(false);
    setFormData({
      customer_id: "",
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      prescription_date: new Date().toISOString().split("T")[0],
      right_eye_sphere: "",
      right_eye_cylinder: "",
      right_eye_axis: "",
      right_eye_va: "",
      left_eye_sphere: "",
      left_eye_cylinder: "",
      left_eye_axis: "",
      left_eye_va: "",
      right_eye_nv_sphere: "",
      right_eye_nv_cylinder: "",
      right_eye_nv_axis: "",
      right_eye_nv_va: "",
      left_eye_nv_sphere: "",
      left_eye_nv_cylinder: "",
      left_eye_nv_axis: "",
      left_eye_nv_va: "",
      emr_coating: false,
      blue_cut: false,
      plastic: false,
      tint: false,
      anti_glare: false,
      polycarbonate: false,
      bifocal: false,
      progressive: false,
      pd_distance: "",
      notes: "",
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("prescriptions").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
    } else {
      toast.success("Prescription deleted!");
      fetchPrescriptions();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-muted-foreground mt-1">Manage customer eye prescriptions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Prescription</DialogTitle>
              <DialogDescription>
                Enter the customer's complete eye prescription details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-semibold">Customer *</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsNewCustomer(!isNewCustomer);
                      setFormData({ ...formData, customer_id: "", customer_name: "", customer_phone: "", customer_email: "" });
                    }}
                  >
                    {isNewCustomer ? "Select Existing" : "Add New Customer"}
                  </Button>
                </div>
                
                {!isNewCustomer ? (
                  <Select
                    value={formData.customer_id}
                    onValueChange={(val) => setFormData({ ...formData, customer_id: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="grid grid-cols-3 gap-3 border rounded-lg p-3">
                    <div className="space-y-2">
                      <Label>Customer Name *</Label>
                      <Input
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone *</Label>
                      <Input
                        value={formData.customer_phone}
                        onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email (Optional)</Label>
                      <Input
                        type="email"
                        value={formData.customer_email}
                        onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Date and IPD */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prescription Date *</Label>
                  <Input
                    type="date"
                    value={formData.prescription_date}
                    onChange={(e) => setFormData({ ...formData, prescription_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>IPD (Interpupillary Distance) mm</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.pd_distance}
                    onChange={(e) => setFormData({ ...formData, pd_distance: e.target.value })}
                    placeholder="e.g., 62"
                  />
                </div>
              </div>

              {/* D.V. Section - Distance Vision */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                  <Eye className="w-5 h-5 text-primary" />
                  D.V. (Distance Vision)
                </h3>
                
                {/* Right Eye OD */}
                <div className="mb-4">
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Right Eye (OD)</Label>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Spherical</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={formData.right_eye_sphere}
                        onChange={(e) => setFormData({ ...formData, right_eye_sphere: e.target.value })}
                        placeholder="±0.00"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cylindrical</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={formData.right_eye_cylinder}
                        onChange={(e) => setFormData({ ...formData, right_eye_cylinder: e.target.value })}
                        placeholder="±0.00"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Axis</Label>
                      <Input
                        type="number"
                        min="0"
                        max="180"
                        value={formData.right_eye_axis}
                        onChange={(e) => setFormData({ ...formData, right_eye_axis: e.target.value })}
                        placeholder="0-180"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">VA</Label>
                      <Input
                        value={formData.right_eye_va}
                        onChange={(e) => setFormData({ ...formData, right_eye_va: e.target.value })}
                        placeholder="6/6"
                      />
                    </div>
                  </div>
                </div>

                {/* Left Eye OS */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Left Eye (OS)</Label>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Spherical</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={formData.left_eye_sphere}
                        onChange={(e) => setFormData({ ...formData, left_eye_sphere: e.target.value })}
                        placeholder="±0.00"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cylindrical</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={formData.left_eye_cylinder}
                        onChange={(e) => setFormData({ ...formData, left_eye_cylinder: e.target.value })}
                        placeholder="±0.00"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Axis</Label>
                      <Input
                        type="number"
                        min="0"
                        max="180"
                        value={formData.left_eye_axis}
                        onChange={(e) => setFormData({ ...formData, left_eye_axis: e.target.value })}
                        placeholder="0-180"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">VA</Label>
                      <Input
                        value={formData.left_eye_va}
                        onChange={(e) => setFormData({ ...formData, left_eye_va: e.target.value })}
                        placeholder="6/6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* N.V. Section - Near Vision */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                  <Eye className="w-5 h-5 text-primary" />
                  N.V. (Near Vision / Reading)
                </h3>
                
                {/* Right Eye OD */}
                <div className="mb-4">
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Right Eye (OD)</Label>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Spherical</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={formData.right_eye_nv_sphere}
                        onChange={(e) => setFormData({ ...formData, right_eye_nv_sphere: e.target.value })}
                        placeholder="±0.00"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cylindrical</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={formData.right_eye_nv_cylinder}
                        onChange={(e) => setFormData({ ...formData, right_eye_nv_cylinder: e.target.value })}
                        placeholder="±0.00"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Axis</Label>
                      <Input
                        type="number"
                        min="0"
                        max="180"
                        value={formData.right_eye_nv_axis}
                        onChange={(e) => setFormData({ ...formData, right_eye_nv_axis: e.target.value })}
                        placeholder="0-180"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">VA</Label>
                      <Input
                        value={formData.right_eye_nv_va}
                        onChange={(e) => setFormData({ ...formData, right_eye_nv_va: e.target.value })}
                        placeholder="N6"
                      />
                    </div>
                  </div>
                </div>

                {/* Left Eye OS */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Left Eye (OS)</Label>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Spherical</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={formData.left_eye_nv_sphere}
                        onChange={(e) => setFormData({ ...formData, left_eye_nv_sphere: e.target.value })}
                        placeholder="±0.00"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cylindrical</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={formData.left_eye_nv_cylinder}
                        onChange={(e) => setFormData({ ...formData, left_eye_nv_cylinder: e.target.value })}
                        placeholder="±0.00"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Axis</Label>
                      <Input
                        type="number"
                        min="0"
                        max="180"
                        value={formData.left_eye_nv_axis}
                        onChange={(e) => setFormData({ ...formData, left_eye_nv_axis: e.target.value })}
                        placeholder="0-180"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">VA</Label>
                      <Input
                        value={formData.left_eye_nv_va}
                        onChange={(e) => setFormData({ ...formData, left_eye_nv_va: e.target.value })}
                        placeholder="N6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lens Options */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4 text-lg">Lens Options</h3>
                <div className="grid grid-cols-2 gap-6">
                  {/* Coatings */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-3 block">Coatings & Materials</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="emr_coating"
                          checked={formData.emr_coating}
                          onCheckedChange={(checked) => setFormData({ ...formData, emr_coating: checked as boolean })}
                        />
                        <Label htmlFor="emr_coating" className="cursor-pointer">EMR Coating</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="blue_cut"
                          checked={formData.blue_cut}
                          onCheckedChange={(checked) => setFormData({ ...formData, blue_cut: checked as boolean })}
                        />
                        <Label htmlFor="blue_cut" className="cursor-pointer">Blue Cut</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="plastic"
                          checked={formData.plastic}
                          onCheckedChange={(checked) => setFormData({ ...formData, plastic: checked as boolean })}
                        />
                        <Label htmlFor="plastic" className="cursor-pointer">Plastic</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="tint"
                          checked={formData.tint}
                          onCheckedChange={(checked) => setFormData({ ...formData, tint: checked as boolean })}
                        />
                        <Label htmlFor="tint" className="cursor-pointer">Tint</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="anti_glare"
                          checked={formData.anti_glare}
                          onCheckedChange={(checked) => setFormData({ ...formData, anti_glare: checked as boolean })}
                        />
                        <Label htmlFor="anti_glare" className="cursor-pointer">Anti-Glare</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="polycarbonate"
                          checked={formData.polycarbonate}
                          onCheckedChange={(checked) => setFormData({ ...formData, polycarbonate: checked as boolean })}
                        />
                        <Label htmlFor="polycarbonate" className="cursor-pointer">Polycarbonate</Label>
                      </div>
                    </div>
                  </div>

                  {/* Lens Type */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-3 block">Lens Type</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="bifocal"
                          checked={formData.bifocal}
                          onCheckedChange={(checked) => setFormData({ ...formData, bifocal: checked as boolean })}
                        />
                        <Label htmlFor="bifocal" className="cursor-pointer">Bifocal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="progressive"
                          checked={formData.progressive}
                          onCheckedChange={(checked) => setFormData({ ...formData, progressive: checked as boolean })}
                        />
                        <Label htmlFor="progressive" className="cursor-pointer">Progressive</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Remarks / Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional remarks..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full">Add Prescription</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>D.V. (Right)</TableHead>
                <TableHead>D.V. (Left)</TableHead>
                <TableHead>IPD</TableHead>
                <TableHead>Lens Options</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No prescriptions found. Add your first prescription!
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell>
                      <div className="font-medium">{prescription.customer?.name}</div>
                      <div className="text-sm text-muted-foreground">{prescription.customer?.phone}</div>
                    </TableCell>
                    <TableCell>{new Date(prescription.prescription_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {prescription.right_eye_sphere !== null && (
                        <div>SPH: {prescription.right_eye_sphere}</div>
                      )}
                      {prescription.right_eye_cylinder !== null && (
                        <div>CYL: {prescription.right_eye_cylinder}</div>
                      )}
                      {prescription.right_eye_axis !== null && (
                        <div>AXIS: {prescription.right_eye_axis}°</div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {prescription.left_eye_sphere !== null && (
                        <div>SPH: {prescription.left_eye_sphere}</div>
                      )}
                      {prescription.left_eye_cylinder !== null && (
                        <div>CYL: {prescription.left_eye_cylinder}</div>
                      )}
                      {prescription.left_eye_axis !== null && (
                        <div>AXIS: {prescription.left_eye_axis}°</div>
                      )}
                    </TableCell>
                    <TableCell>{prescription.pd_distance || "-"}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-wrap gap-1">
                        {prescription.blue_cut && <span className="bg-muted px-1.5 py-0.5 rounded">Blue Cut</span>}
                        {prescription.anti_glare && <span className="bg-muted px-1.5 py-0.5 rounded">Anti-Glare</span>}
                        {prescription.progressive && <span className="bg-muted px-1.5 py-0.5 rounded">Progressive</span>}
                        {prescription.bifocal && <span className="bg-muted px-1.5 py-0.5 rounded">Bifocal</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintPrescription(prescription)}
                        >
                          <Printer className="w-4 h-4 mr-1" />
                          Print
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Prescription?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this prescription for {prescription.customer?.name}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(prescription.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Hidden print component */}
      <div className="hidden">
        <PrescriptionReceipt
          ref={printRef}
          prescription={selectedPrescription || {}}
          shopName={storeSettings?.store_name}
          shopAddress={storeSettings?.address}
          shopPhone={storeSettings?.phone}
          shopEmail={storeSettings?.email}
        />
      </div>
    </div>
  );
};

export default Prescriptions;
