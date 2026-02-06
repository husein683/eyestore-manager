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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Users, DollarSign, Calendar, Trash2, Plus, Shield, ShieldAlert,
  UserCheck, UserX, KeyRound, Briefcase,
} from "lucide-react";

// ─── Types ───
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

// ─── Main Component ───
const StaffManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Accounts state
  const [users, setUsers] = useState<any[]>([]);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    email: "", password: "", full_name: "", phone: "", role: "employee" as "admin" | "employee",
  });

  // Employees state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeForm, setEmployeeForm] = useState({
    full_name: "", phone: "", email: "", address: "",
    hire_date: new Date().toISOString().split("T")[0],
    position: "", salary_type: "monthly", base_salary: "", notes: "",
  });

  // Payments state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentForm, setPaymentForm] = useState({
    employee_id: "", payment_date: new Date().toISOString().split("T")[0],
    amount: "", payment_type: "monthly", payment_method: "cash", notes: "",
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    checkAdminAndLoad();
  }, [user]);

  const checkAdminAndLoad = async () => {
    if (!user) { navigate("/auth"); return; }
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
    if (!data) { toast.error("Access denied. Admin only."); navigate("/dashboard"); return; }
    setIsAdmin(true);
    setLoading(false);
    fetchAll();
  };

  const fetchAll = () => { fetchUsers(); fetchEmployees(); fetchPayments(); };

  // ─── Accounts logic ───
  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*, user_roles(role)").order("created_at", { ascending: false });
    setUsers(data || []);
  };

  const handleToggleApproval = async (userId: string, approved: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_approved: !approved }).eq("id", userId);
    if (error) toast.error("Failed: " + error.message);
    else { toast.success(approved ? "Access revoked" : "User approved!"); fetchUsers(); }
  };

  const handleResetPassword = async (email: string, name: string) => {
    setResettingPassword(email);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
    if (error) toast.error("Failed: " + error.message);
    else toast.success(`Reset email sent to ${name}`);
    setResettingPassword(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: userForm.email, password: userForm.password,
      options: { data: { full_name: userForm.full_name } },
    });
    if (signUpError) { toast.error(signUpError.message); return; }
    if (!authData.user) { toast.error("Failed to create user"); return; }
    if (userForm.phone) await supabase.from("profiles").update({ phone: userForm.phone }).eq("id", authData.user.id);
    const { error: roleError } = await supabase.from("user_roles").insert([{ user_id: authData.user.id, role: userForm.role }]);
    if (roleError) toast.error("User created but role failed: " + roleError.message);
    else toast.success("User created!");
    setCreateUserOpen(false);
    setUserForm({ email: "", password: "", full_name: "", phone: "", role: "employee" });
    fetchUsers();
  };

  // ─── Employee logic ───
  const fetchEmployees = async () => {
    const { data, error } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Failed to fetch employees");
    else setEmployees(data || []);
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("employees").insert([{ ...employeeForm, base_salary: Number(employeeForm.base_salary), created_by: user.id }]);
    if (error) toast.error("Failed to add employee");
    else {
      toast.success("Employee added!");
      setEmployeeForm({ full_name: "", phone: "", email: "", address: "", hire_date: new Date().toISOString().split("T")[0], position: "", salary_type: "monthly", base_salary: "", notes: "" });
      fetchEmployees();
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    await supabase.from("employee_payments").delete().eq("employee_id", id);
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) toast.error("Failed: " + error.message);
    else { toast.success("Employee deleted!"); fetchEmployees(); fetchPayments(); }
  };

  // ─── Payment logic ───
  const fetchPayments = async () => {
    const { data, error } = await supabase.from("employee_payments").select("*, employees(full_name)").order("payment_date", { ascending: false });
    if (error) toast.error("Failed to fetch payments");
    else setPayments(data || []);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("employee_payments").insert([{ ...paymentForm, amount: Number(paymentForm.amount), created_by: user.id }]);
    if (error) toast.error("Failed to add payment");
    else {
      toast.success("Payment recorded!");
      setPaymentForm({ employee_id: "", payment_date: new Date().toISOString().split("T")[0], amount: "", payment_type: "monthly", payment_method: "cash", notes: "" });
      fetchPayments();
    }
  };

  const handleDeletePayment = async (id: string) => {
    const { error } = await supabase.from("employee_payments").delete().eq("id", id);
    if (error) toast.error("Failed: " + error.message);
    else { toast.success("Payment deleted!"); fetchPayments(); }
  };

  const getMonthlyReport = () => payments.filter((p) => p.payment_date.startsWith(selectedMonth));
  const calculateMonthlyTotal = () => getMonthlyReport().reduce((s, p) => s + p.amount, 0);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
        <p className="text-muted-foreground">Manage user accounts, employees, salaries & payments</p>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts"><Shield className="w-4 h-4 mr-2" />Accounts</TabsTrigger>
          <TabsTrigger value="employees"><Briefcase className="w-4 h-4 mr-2" />Staff Register</TabsTrigger>
          <TabsTrigger value="payments"><DollarSign className="w-4 h-4 mr-2" />Payments</TabsTrigger>
          <TabsTrigger value="reports"><Calendar className="w-4 h-4 mr-2" />Reports</TabsTrigger>
        </TabsList>

        {/* ─── ACCOUNTS TAB ─── */}
        <TabsContent value="accounts" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Create User</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2"><Label>Full Name *</Label><Input value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Email *</Label><Input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Password *</Label><Input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required minLength={6} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Role *</Label>
                    <Select value={userForm.role} onValueChange={(v: "admin" | "employee") => setUserForm({ ...userForm, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Create User</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="p-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No users found.</TableCell></TableRow>
                  ) : users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.phone || "-"}</TableCell>
                      <TableCell>
                        {u.user_roles?.map((ur: any) => (
                          <Badge key={ur.role} variant={ur.role === "admin" ? "default" : "secondary"} className="mr-1">
                            {ur.role === "admin" ? <ShieldAlert className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                            {ur.role}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell><Badge variant={u.is_approved ? "default" : "destructive"}>{u.is_approved ? "Approved" : "Pending"}</Badge></TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {u.id !== user?.id && (
                          <div className="flex gap-1">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className={u.is_approved ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-700"}>
                                  {u.is_approved ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{u.is_approved ? "Revoke Access?" : "Approve User?"}</AlertDialogTitle>
                                  <AlertDialogDescription>{u.is_approved ? `This will prevent ${u.full_name} from logging in.` : `This will allow ${u.full_name} to access the system.`}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleToggleApproval(u.id, u.is_approved)} className={u.is_approved ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
                                    {u.is_approved ? "Revoke" : "Approve"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" disabled={resettingPassword === u.email}><KeyRound className="w-4 h-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset Password?</AlertDialogTitle>
                                  <AlertDialogDescription>This will send a password reset email to {u.email}.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleResetPassword(u.email, u.full_name)}>Send Reset Email</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="p-4 bg-warning/10 border-warning">
            <div className="flex gap-3">
              <ShieldAlert className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-warning">User Approval Required</p>
                <p className="text-sm text-muted-foreground">New users require admin approval before they can log in.</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ─── STAFF REGISTER TAB ─── */}
        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Register New Staff</CardTitle><CardDescription>Add a new staff member for salary tracking</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Full Name *</Label><Input value={employeeForm.full_name} onChange={(e) => setEmployeeForm({ ...employeeForm, full_name: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={employeeForm.phone} onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Position</Label><Input value={employeeForm.position} onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Hire Date *</Label><Input type="date" value={employeeForm.hire_date} onChange={(e) => setEmployeeForm({ ...employeeForm, hire_date: e.target.value })} required /></div>
                  <div className="space-y-2">
                    <Label>Salary Type *</Label>
                    <Select value={employeeForm.salary_type} onValueChange={(v) => setEmployeeForm({ ...employeeForm, salary_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Base Salary *</Label><Input type="number" step="0.01" value={employeeForm.base_salary} onChange={(e) => setEmployeeForm({ ...employeeForm, base_salary: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Address</Label><Input value={employeeForm.address} onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={employeeForm.notes} onChange={(e) => setEmployeeForm({ ...employeeForm, notes: e.target.value })} rows={3} /></div>
                <Button type="submit">Add Staff</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Registered Staff</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead><TableHead>Position</TableHead><TableHead>Salary Type</TableHead>
                    <TableHead>Base Salary</TableHead><TableHead>Phone</TableHead><TableHead>Hire Date</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No staff registered yet.</TableCell></TableRow>
                  ) : employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.full_name}</TableCell>
                      <TableCell>{emp.position || "N/A"}</TableCell>
                      <TableCell className="capitalize">{emp.salary_type}</TableCell>
                      <TableCell>Rs.{emp.base_salary.toFixed(0)}</TableCell>
                      <TableCell>{emp.phone || "N/A"}</TableCell>
                      <TableCell>{new Date(emp.hire_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Staff?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete {emp.full_name} and all payment records.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteEmployee(emp.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
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

        {/* ─── PAYMENTS TAB ─── */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Record Payment</CardTitle><CardDescription>Add a payment for a staff member</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Staff Member *</Label>
                    <Select value={paymentForm.employee_id} onValueChange={(v) => setPaymentForm({ ...paymentForm, employee_id: v })} required>
                      <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                      <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name} ({e.salary_type})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Payment Date *</Label><Input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Amount *</Label><Input type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required /></div>
                  <div className="space-y-2">
                    <Label>Payment Type *</Label>
                    <Select value={paymentForm.payment_type} onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="bonus">Bonus</SelectItem><SelectItem value="advance">Advance</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="check">Check</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} rows={2} /></div>
                <Button type="submit">Record Payment</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Payments</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead><TableHead>Method</TableHead><TableHead>Notes</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 10).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.employees.full_name}</TableCell>
                      <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell>Rs.{p.amount.toFixed(0)}</TableCell>
                      <TableCell className="capitalize">{p.payment_type}</TableCell>
                      <TableCell className="capitalize">{p.payment_method || "N/A"}</TableCell>
                      <TableCell>{p.notes || "N/A"}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Payment?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePayment(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
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

        {/* ─── REPORTS TAB ─── */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Monthly Payment Report</CardTitle><CardDescription>View payment summary by month</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Select Month</Label><Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} /></div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-3xl font-bold text-primary">Rs.{calculateMonthlyTotal().toFixed(0)}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Date</TableHead><TableHead>Staff</TableHead><TableHead>Amount</TableHead><TableHead>Type</TableHead><TableHead>Method</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {getMonthlyReport().map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell>{p.employees.full_name}</TableCell>
                      <TableCell>Rs.{p.amount.toFixed(0)}</TableCell>
                      <TableCell className="capitalize">{p.payment_type}</TableCell>
                      <TableCell className="capitalize">{p.payment_method || "N/A"}</TableCell>
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

export default StaffManagement;
