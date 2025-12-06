import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/supabase";
import { format, startOfMonth, endOfMonth } from "date-fns";

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    expense_date: format(new Date(), "yyyy-MM-dd"),
    category: "",
    description: "",
    amount: "",
    payment_method: "cash" as "cash" | "card" | "online",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchMonthlyReport();
    }
  }, [user, selectedMonth]);

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Failed to fetch expenses");
    } else {
      setExpenses(data || []);
    }
  };

  const fetchMonthlyReport = async () => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .gte("expense_date", format(start, "yyyy-MM-dd"))
      .lte("expense_date", format(end, "yyyy-MM-dd"))
      .order("expense_date", { ascending: true });

    if (error) {
      toast.error("Failed to fetch monthly report");
    } else {
      // Group by date
      const grouped = data?.reduce((acc: any, expense: any) => {
        const date = expense.expense_date;
        if (!acc[date]) {
          acc[date] = { date, total: 0, expenses: [] };
        }
        acc[date].total += Number(expense.amount);
        acc[date].expenses.push(expense);
        return acc;
      }, {});

      setMonthlyReport(Object.values(grouped || {}));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("expenses").insert([
      {
        ...formData,
        amount: Number(formData.amount),
        created_by: user?.id,
      },
    ]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Expense added successfully!");
      setOpen(false);
      setFormData({
        expense_date: format(new Date(), "yyyy-MM-dd"),
        category: "",
        description: "",
        amount: "",
        payment_method: "cash",
        notes: "",
      });
      fetchExpenses();
      fetchMonthlyReport();
    }
  };

  const totalMonthlyExpense = monthlyReport.reduce((sum, day) => sum + day.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Daily Expenses</h1>
          <p className="text-muted-foreground mt-1">Track and analyze daily expenditures</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Rent, Utilities, Supplies"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(val: "cash" | "card" | "online") =>
                    setFormData({ ...formData, payment_method: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>
              <Button type="submit" className="w-full">
                Add Expense
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Monthly Report Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Total
            </CardTitle>
            <TrendingDown className="w-5 h-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              Rs.{totalMonthlyExpense.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(selectedMonth, "MMMM yyyy")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Days with Expenses
            </CardTitle>
            <Calendar className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{monthlyReport.length}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily Average
            </CardTitle>
            <TrendingDown className="w-5 h-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              Rs.{monthlyReport.length > 0 ? (totalMonthlyExpense / monthlyReport.length).toFixed(0) : "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per expense day</p>
          </CardContent>
        </Card>
      </div>

      {/* Month Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <Label>Select Month:</Label>
          <Input
            type="month"
            value={format(selectedMonth, "yyyy-MM")}
            onChange={(e) => setSelectedMonth(new Date(e.target.value + "-01"))}
            className="w-48"
          />
        </div>

        <h3 className="text-lg font-semibold mb-4">Daily Breakdown</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyReport.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No expenses recorded for this month
                  </TableCell>
                </TableRow>
              ) : (
                monthlyReport.map((dayData) =>
                  dayData.expenses.map((expense: any, idx: number) => (
                    <TableRow key={expense.id}>
                      {idx === 0 && (
                        <TableCell
                          rowSpan={dayData.expenses.length}
                          className="font-semibold bg-muted/30"
                        >
                          <div>{format(new Date(dayData.date), "MMM dd, yyyy")}</div>
                          <div className="text-sm text-muted-foreground">
                            Total: Rs.{dayData.total.toFixed(0)}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell className="font-semibold">
                        Rs.{Number(expense.amount).toFixed(0)}
                      </TableCell>
                      <TableCell className="capitalize">{expense.payment_method}</TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Recent Expenses */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Recent Expenses (Last 50)</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No expenses found. Add your first expense!
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.expense_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="font-medium">{expense.category}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="font-semibold">
                      Rs.{Number(expense.amount).toFixed(0)}
                    </TableCell>
                    <TableCell className="capitalize">{expense.payment_method}</TableCell>
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

export default Expenses;
