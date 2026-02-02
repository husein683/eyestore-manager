import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Eye, Printer, FileText, Receipt } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import SaleReceipt from "@/components/SaleReceipt";
import PrescriptionReceipt from "@/components/PrescriptionReceipt";

const Customers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSales, setCustomerSales] = useState<any[]>([]);
  const [customerPrescriptions, setCustomerPrescriptions] = useState<any[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  
  // Receipt dialogs
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [prescriptionReceiptOpen, setPrescriptionReceiptOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const prescriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCustomers();
    fetchStoreSettings();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [search, customers]);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to fetch customers");
    } else {
      setCustomers(data || []);
    }
  };

  const fetchStoreSettings = async () => {
    const { data } = await supabase
      .from("store_settings")
      .select("*")
      .maybeSingle();
    if (data) setStoreSettings(data);
  };

  const filterCustomers = () => {
    if (!search) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.toLowerCase().includes(search.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
    );

    setFilteredCustomers(filtered);
  };

  const handleViewDetails = async (customer: any) => {
    setSelectedCustomer(customer);
    
    // Fetch customer's sales with items
    const { data: sales } = await supabase
      .from("sales")
      .select(`
        *,
        items:sale_items(
          *,
          product:products(name)
        )
      `)
      .eq("customer_id", customer.id)
      .order("sale_date", { ascending: false });
    
    // Fetch customer's prescriptions
    const { data: prescriptions } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("customer_id", customer.id)
      .order("prescription_date", { ascending: false });
    
    setCustomerSales(sales || []);
    setCustomerPrescriptions(prescriptions || []);
    setDetailsOpen(true);
  };

  const handlePrintReceipt = (sale: any) => {
    // Add customer info to sale for the receipt
    const saleWithCustomer = {
      ...sale,
      customer: selectedCustomer
    };
    setSelectedSale(saleWithCustomer);
    setReceiptOpen(true);
  };

  const handlePrintPrescription = (prescription: any) => {
    // Add customer info to prescription for the receipt
    setSelectedPrescription({
      ...prescription,
      customer: {
        name: selectedCustomer?.name,
        phone: selectedCustomer?.phone
      }
    });
    setPrescriptionReceiptOpen(true);
  };

  const printReceipt = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print receipt");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${selectedSale?.sale_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; }
            .receipt { width: 80mm; max-width: 80mm; margin: 0 auto; padding: 10px; }
            @media print { body { width: 80mm; } .receipt { width: 100%; } }
          </style>
        </head>
        <body>
          <div class="receipt">${printContent.innerHTML}</div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printPrescription = () => {
    const printContent = prescriptionRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print prescription");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: sans-serif; font-size: 12px; }
            @media print { body { width: 210mm; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">View customer information and history</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{customer.address || "-"}</TableCell>
                    <TableCell>{format(new Date(customer.created_at), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(customer)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedCustomer.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedCustomer.phone}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedCustomer.email || "-"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">{selectedCustomer.address || "-"}</p>
                </div>
              </div>

              {/* Balance Summary */}
              {customerSales.length > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Purchases</p>
                      <p className="text-xl font-bold text-primary">
                        Rs.{customerSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0).toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-xl font-bold text-success">
                        Rs.{customerSales.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0).toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Balance</p>
                      <p className={`text-xl font-bold ${
                        customerSales.reduce((sum, s) => sum + Number(s.balance || 0), 0) > 0 
                          ? 'text-destructive' 
                          : 'text-success'
                      }`}>
                        Rs.{customerSales.reduce((sum, s) => sum + Number(s.balance || 0), 0).toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Receipts/Sales Section */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  Receipts ({customerSales.length})
                </h3>
                {customerSales.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No sales recorded for this customer.</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerSales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-mono text-sm">{sale.sale_number}</TableCell>
                            <TableCell>{format(new Date(sale.sale_date), "dd/MM/yyyy")}</TableCell>
                            <TableCell className="capitalize">{sale.payment_method || "Cash"}</TableCell>
                            <TableCell className="font-semibold">Rs.{Number(sale.total_amount).toFixed(0)}</TableCell>
                            <TableCell className="text-success">Rs.{Number(sale.paid_amount || 0).toFixed(0)}</TableCell>
                            <TableCell className={Number(sale.balance || 0) > 0 ? 'text-destructive font-semibold' : ''}>
                              Rs.{Number(sale.balance || 0).toFixed(0)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePrintReceipt(sale)}
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Prescriptions Section */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Prescriptions ({customerPrescriptions.length})
                </h3>
                {customerPrescriptions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No prescriptions recorded for this customer.</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Right Eye (SPH/CYL/AXIS)</TableHead>
                          <TableHead>Left Eye (SPH/CYL/AXIS)</TableHead>
                          <TableHead>Addition</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerPrescriptions.map((rx) => (
                          <TableRow key={rx.id}>
                            <TableCell>{format(new Date(rx.prescription_date), "dd/MM/yyyy")}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {rx.right_eye_sphere || "-"}/{rx.right_eye_cylinder || "-"}/{rx.right_eye_axis || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {rx.left_eye_sphere || "-"}/{rx.left_eye_cylinder || "-"}/{rx.left_eye_axis || "-"}
                            </TableCell>
                            <TableCell>{rx.addition || "-"}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePrintPrescription(rx)}
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Print Dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sale Receipt</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <>
              <div className="border rounded-lg overflow-hidden">
                <SaleReceipt 
                  ref={receiptRef} 
                  sale={selectedSale}
                  shopName={storeSettings?.store_name}
                  shopAddress={storeSettings?.address}
                  shopPhone={storeSettings?.phone}
                  shopEmail={storeSettings?.email}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={printReceipt} className="flex-1">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
                <Button variant="outline" onClick={() => setReceiptOpen(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Prescription Print Dialog */}
      <Dialog open={prescriptionReceiptOpen} onOpenChange={setPrescriptionReceiptOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prescription</DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <>
              <div className="border rounded-lg overflow-hidden">
                <PrescriptionReceipt
                  ref={prescriptionRef}
                  prescription={selectedPrescription}
                  shopName={storeSettings?.store_name}
                  shopAddress={storeSettings?.address}
                  shopPhone={storeSettings?.phone}
                  shopEmail={storeSettings?.email}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={printPrescription} className="flex-1">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Prescription
                </Button>
                <Button variant="outline" onClick={() => setPrescriptionReceiptOpen(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;