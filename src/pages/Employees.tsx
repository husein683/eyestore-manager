import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Users, DollarSign, Calendar, Trash2 } from "lucide-react";
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

interface Employee {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  hire_date: string;
  position: string | null;
  salary_type: string;
  base_salary: number;
  notes: string | null;
  created_at: string;
}

interface Payment {
  id: string;
  employee_id: string;
  payment_date: string;
  amount: number;
  payment_type: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  employees: { full_name: string };
}

const Employees = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [employeeForm, setEmployeeForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    hire_date: new Date().toISOString().split("T")[0],
    position: "",
    salary_type: "monthly",
    base_salary: "",
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    employee_id: "",
    payment_date: new Date().toISOString().split("T")[0],
    amount: "",
    payment_type: "monthly",
    payment_method: "cash",
    notes: "",
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchEmployees();
      fetchPayments();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!data) {
      toast.error("Access denied. Admin only.");
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch employees");
      console.error(error);
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  };

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("employee_payments")
      .select("*, employees(full_name)")
      .order("payment_date", { ascending: false });

    if (error) {
      toast.error("Failed to fetch payments");
      console.error(error);
    } else {
      setPayments(data || []);
    }
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from("employees").insert([
      {
        ...employeeForm,
        base_salary: Number(employeeForm.base_salary),
        created_by: user.id,
      },
    ]);

    if (error) {
      toast.error("Failed to add employee");
      console.error(error);
    } else {
      toast.success("Employee added successfully");
      setEmployeeForm({
        full_name: "",
        phone: "",
        email: "",
        address: "",
        hire_date: new Date().toISOString().split("T")[0],
        position: "",
        salary_type: "monthly",
        base_salary: "",
        notes: "",
      });
      fetchEmployees();
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from("employee_payments").insert([
      {
        ...paymentForm,
        amount: Number(paymentForm.amount),
        created_by: user.id,
      },
    ]);

    if (error) {
      toast.error("Failed to add payment");
      console.error(error);
    } else {
      toast.success("Payment recorded successfully");
      setPaymentForm({
        employee_id: "",
        payment_date: new Date().toISOString().split("T")[0],
        amount: "",
        payment_type: "monthly",
        payment_method: "cash",
        notes: "",
      });
      fetchPayments();
    }
  };

  const getMonthlyReport = () => {
    return payments.filter((payment) =>
      payment.payment_date.startsWith(selectedMonth)
    );
  };

  const calculateMonthlyTotal = () => {
    return getMonthlyReport().reduce((sum, payment) => sum + payment.amount, 0);
  };

  const handleDeleteEmployee = async (id: string) => {
    // First delete related payments
    await supabase.from("employee_payments").delete().eq("employee_id", id);
    
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
    } else {
      toast.success("Employee deleted!");
      fetchEmployees();
      fetchPayments();
    }
  };

  const handleDeletePayment = async (id: string) => {
    const { error } = await supabase.from("employee_payments").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
    } else {
      toast.success("Payment deleted!");
      fetchPayments();
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
        <p className="text-muted-foreground">Manage employees and track payments</p>
      </div>

      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList>
          <TabsTrigger value="employees">
            <Users className="w-4 h-4 mr-2" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="payments">
            <DollarSign className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Calendar className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Register New Employee</CardTitle>
              <CardDescription>Add a new employee to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={employeeForm.full_name}
                      onChange={(e) =>
                        setEmployeeForm({ ...employeeForm, full_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={employeeForm.phone}
                      onChange={(e) =>
                        setEmployeeForm({ ...employeeForm, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={employeeForm.email}
                      onChange={(e) =>
                        setEmployeeForm({ ...employeeForm, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={employeeForm.position}
                      onChange={(e) =>
                        setEmployeeForm({ ...employeeForm, position: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hire_date">Hire Date *</Label>
                    <Input
                      id="hire_date"
                      type="date"
                      value={employeeForm.hire_date}
                      onChange={(e) =>
                        setEmployeeForm({ ...employeeForm, hire_date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary_type">Salary Type *</Label>
                    <Select
                      value={employeeForm.salary_type}
                      onValueChange={(value) =>
                        setEmployeeForm({ ...employeeForm, salary_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base_salary">Base Salary *</Label>
                    <Input
                      id="base_salary"
                      type="number"
                      step="0.01"
                      value={employeeForm.base_salary}
                      onChange={(e) =>
                        setEmployeeForm({ ...employeeForm, base_salary: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={employeeForm.address}
                      onChange={(e) =>
                        setEmployeeForm({ ...employeeForm, address: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={employeeForm.notes}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <Button type="submit">Add Employee</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registered Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Salary Type</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.full_name}</TableCell>
                      <TableCell>{employee.position || "N/A"}</TableCell>
                      <TableCell className="capitalize">{employee.salary_type}</TableCell>
                      <TableCell>Rs.{employee.base_salary.toFixed(0)}</TableCell>
                      <TableCell>{employee.phone || "N/A"}</TableCell>
                      <TableCell>{employee.email || "N/A"}</TableCell>
                      <TableCell>{new Date(employee.hire_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Employee?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {employee.full_name} and all their payment records. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteEmployee(employee.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Record Payment</CardTitle>
              <CardDescription>Add a payment for an employee</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Employee *</Label>
                    <Select
                      value={paymentForm.employee_id}
                      onValueChange={(value) =>
                        setPaymentForm({ ...paymentForm, employee_id: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.full_name} ({employee.salary_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_date">Payment Date *</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, payment_date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, amount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_type">Payment Type *</Label>
                    <Select
                      value={paymentForm.payment_type}
                      onValueChange={(value) =>
                        setPaymentForm({ ...paymentForm, payment_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="bonus">Bonus</SelectItem>
                        <SelectItem value="advance">Advance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select
                      value={paymentForm.payment_method}
                      onValueChange={(value) =>
                        setPaymentForm({ ...paymentForm, payment_method: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_notes">Notes</Label>
                  <Textarea
                    id="payment_notes"
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, notes: e.target.value })
                    }
                    rows={2}
                  />
                </div>
                <Button type="submit">Record Payment</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 10).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.employees.full_name}</TableCell>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell>Rs.{payment.amount.toFixed(0)}</TableCell>
                      <TableCell className="capitalize">{payment.payment_type}</TableCell>
                      <TableCell className="capitalize">{payment.payment_method || "N/A"}</TableCell>
                      <TableCell>{payment.notes || "N/A"}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Payment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this payment record. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePayment(payment.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Payment Report</CardTitle>
              <CardDescription>View payment summary by month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="month">Select Month</Label>
                <Input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>

              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-3xl font-bold text-primary">Rs.{calculateMonthlyTotal().toFixed(0)}</p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getMonthlyReport().map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell>{payment.employees.full_name}</TableCell>
                      <TableCell>Rs.{payment.amount.toFixed(0)}</TableCell>
                      <TableCell className="capitalize">{payment.payment_type}</TableCell>
                      <TableCell className="capitalize">{payment.payment_method || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Employees;