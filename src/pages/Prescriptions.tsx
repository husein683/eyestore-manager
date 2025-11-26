import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Eye, Search } from "lucide-react";
import { toast } from "sonner";

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    prescription_date: new Date().toISOString().split("T")[0],
    right_eye_sphere: "",
    right_eye_cylinder: "",
    right_eye_axis: "",
    right_eye_add: "",
    left_eye_sphere: "",
    left_eye_cylinder: "",
    left_eye_axis: "",
    left_eye_add: "",
    pd_distance: "",
    notes: "",
  });

  useEffect(() => {
    fetchPrescriptions();
    fetchCustomers();
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

    const prescriptionData = {
      customer_id: formData.customer_id,
      prescription_date: formData.prescription_date,
      right_eye_sphere: formData.right_eye_sphere ? parseFloat(formData.right_eye_sphere) : null,
      right_eye_cylinder: formData.right_eye_cylinder ? parseFloat(formData.right_eye_cylinder) : null,
      right_eye_axis: formData.right_eye_axis ? parseInt(formData.right_eye_axis) : null,
      right_eye_add: formData.right_eye_add ? parseFloat(formData.right_eye_add) : null,
      left_eye_sphere: formData.left_eye_sphere ? parseFloat(formData.left_eye_sphere) : null,
      left_eye_cylinder: formData.left_eye_cylinder ? parseFloat(formData.left_eye_cylinder) : null,
      left_eye_axis: formData.left_eye_axis ? parseInt(formData.left_eye_axis) : null,
      left_eye_add: formData.left_eye_add ? parseFloat(formData.left_eye_add) : null,
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
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      prescription_date: new Date().toISOString().split("T")[0],
      right_eye_sphere: "",
      right_eye_cylinder: "",
      right_eye_axis: "",
      right_eye_add: "",
      left_eye_sphere: "",
      left_eye_cylinder: "",
      left_eye_axis: "",
      left_eye_add: "",
      pd_distance: "",
      notes: "",
    });
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Prescription</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Customer *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(val) => setFormData({ ...formData, customer_id: val })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                  <Label>PD Distance (mm)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.pd_distance}
                    onChange={(e) => setFormData({ ...formData, pd_distance: e.target.value })}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Right Eye (OD)
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label>Sphere (SPH)</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={formData.right_eye_sphere}
                      onChange={(e) => setFormData({ ...formData, right_eye_sphere: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cylinder (CYL)</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={formData.right_eye_cylinder}
                      onChange={(e) => setFormData({ ...formData, right_eye_cylinder: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Axis</Label>
                    <Input
                      type="number"
                      min="0"
                      max="180"
                      value={formData.right_eye_axis}
                      onChange={(e) => setFormData({ ...formData, right_eye_axis: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Add</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={formData.right_eye_add}
                      onChange={(e) => setFormData({ ...formData, right_eye_add: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Left Eye (OS)
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label>Sphere (SPH)</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={formData.left_eye_sphere}
                      onChange={(e) => setFormData({ ...formData, left_eye_sphere: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cylinder (CYL)</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={formData.left_eye_cylinder}
                      onChange={(e) => setFormData({ ...formData, left_eye_cylinder: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Axis</Label>
                    <Input
                      type="number"
                      min="0"
                      max="180"
                      value={formData.left_eye_axis}
                      onChange={(e) => setFormData({ ...formData, left_eye_axis: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Add</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={formData.left_eye_add}
                      onChange={(e) => setFormData({ ...formData, left_eye_add: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                <TableHead>Right Eye</TableHead>
                <TableHead>Left Eye</TableHead>
                <TableHead>PD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
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
                    <TableCell className="font-mono text-sm">
                      {prescription.right_eye_sphere && (
                        <div>SPH: {prescription.right_eye_sphere}</div>
                      )}
                      {prescription.right_eye_cylinder && (
                        <div>CYL: {prescription.right_eye_cylinder}</div>
                      )}
                      {prescription.right_eye_axis && (
                        <div>AXIS: {prescription.right_eye_axis}°</div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {prescription.left_eye_sphere && (
                        <div>SPH: {prescription.left_eye_sphere}</div>
                      )}
                      {prescription.left_eye_cylinder && (
                        <div>CYL: {prescription.left_eye_cylinder}</div>
                      )}
                      {prescription.left_eye_axis && (
                        <div>AXIS: {prescription.left_eye_axis}°</div>
                      )}
                    </TableCell>
                    <TableCell>{prescription.pd_distance || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Prescriptions;
