"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";

interface SalesData {
  realized: number; unrealized: number; overdue: number; pendingBookingValue: number;
  monthlyRevenue: { month: string; realized: number; unrealized: number }[];
  forecastEOM: number; forecastEOY: number; dailyRunRate: number;
  categoryRevenue: { category: string; amount: number }[];
  companyRevenue: { company: string; amount: number }[];
  paymentBreakdown: { paid: { count: number; amount: number }; sent: { count: number; amount: number }; pending: { count: number; amount: number }; overdue: { count: number; amount: number } };
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];
const PIE_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#f97316"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <strong>RM {p.value.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
}

export default function SalesPanel() {
  const [data, setData] = useState<SalesData | null>(null);

  useEffect(() => {
    fetch("/api/admin/sales").then(r => r.json()).then(setData).catch(console.error);
  }, []);

  if (!data) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-muted rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
      </div>
      <div className="h-80 bg-muted rounded-xl" />
    </div>
  );

  const total = data.realized + data.unrealized;
  const realizedPct = total > 0 ? Math.round((data.realized / total) * 100) : 0;

  // Transform data for charts
  const monthlyChartData = data.monthlyRevenue.map(m => ({
    month: m.month,
    Realized: m.realized,
    Unrealized: m.unrealized,
  }));

  const pieData = [
    { name: "Paid", value: data.paymentBreakdown.paid.amount },
    { name: "Sent", value: data.paymentBreakdown.sent.amount },
    { name: "Pending", value: data.paymentBreakdown.pending.amount },
    { name: "Overdue", value: data.paymentBreakdown.overdue.amount },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground text-sm">Revenue analytics & forecasts</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Daily run rate</span>
          <span className="font-semibold">RM {data.dailyRunRate.toLocaleString()}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-emerald-100 text-xs font-medium uppercase tracking-wider">
                <DollarSign className="h-3.5 w-3.5" /> Realized
              </div>
              <p className="text-3xl font-bold mt-2 tabular-nums">RM {data.realized.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2 text-emerald-100 text-xs">
                <ArrowUpRight className="h-3 w-3" /> {realizedPct}% collection rate
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-amber-600 text-xs font-medium uppercase tracking-wider">
              <TrendingDown className="h-3.5 w-3.5" /> Unrealized
            </div>
            <p className="text-3xl font-bold mt-2 tabular-nums">RM {data.unrealized.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
              <ArrowDownRight className="h-3 w-3" /> RM {data.overdue.toLocaleString()} overdue
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-blue-600 text-xs font-medium uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" /> EOM Forecast
            </div>
            <p className="text-3xl font-bold mt-2 tabular-nums">RM {data.forecastEOM.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-2">End of month projection</p>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-violet-600 text-xs font-medium uppercase tracking-wider">
              <TrendingUp className="h-3.5 w-3.5" /> Year Forecast
            </div>
            <p className="text-3xl font-bold mt-2 tabular-nums">RM {data.forecastEOY.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-2">Projected year-end</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Bar */}
      <Card className="border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Revenue Pipeline</h3>
            <span className="text-xs text-muted-foreground">{realizedPct}% collected</span>
          </div>
          <div className="h-4 w-full rounded-full bg-muted overflow-hidden flex">
            <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: `${realizedPct}%` }} />
            <div className="h-full bg-red-400" style={{ width: `${total > 0 ? Math.round((data.overdue / total) * 100) : 0}%` }} />
            <div className="h-full bg-amber-400" style={{ width: `${total > 0 ? Math.round(((data.unrealized - data.overdue) / total) * 100) : 0}%` }} />
            <div className="h-full bg-blue-300 rounded-r-full" style={{ width: `${total > 0 ? Math.round((data.pendingBookingValue / (total + data.pendingBookingValue || 1)) * 100) : 0}%` }} />
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500 inline-block" />Paid</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400 inline-block" />Overdue</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400 inline-block" />Pending</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-300 inline-block" />Pipeline</span>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">📈 Revenue Trend</TabsTrigger>
          <TabsTrigger value="breakdown">🥧 Payment Split</TabsTrigger>
          <TabsTrigger value="category">📊 By Category</TabsTrigger>
        </TabsList>

        {/* Line Chart — Monthly Revenue */}
        <TabsContent value="monthly" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-4">Monthly Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={monthlyChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ebebeb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#888" }} axisLine={{ stroke: "#ebebeb" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} tickFormatter={(v) => `RM ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Line type="monotone" dataKey="Realized" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: "#10b981" }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Unrealized" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: "#f59e0b" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pie Chart — Payment Split */}
        <TabsContent value="breakdown" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-4">Payment Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment counts */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-4">Invoice Status</h3>
                <div className="space-y-4">
                  {[
                    { label: "Paid", count: data.paymentBreakdown.paid.count, amount: data.paymentBreakdown.paid.amount, color: "bg-emerald-500" },
                    { label: "Sent", count: data.paymentBreakdown.sent.count, amount: data.paymentBreakdown.sent.amount, color: "bg-blue-500" },
                    { label: "Pending", count: data.paymentBreakdown.pending.count, amount: data.paymentBreakdown.pending.amount, color: "bg-amber-500" },
                    { label: "Overdue", count: data.paymentBreakdown.overdue.count, amount: data.paymentBreakdown.overdue.amount, color: "bg-red-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className={`h-3 w-3 rounded-full flex-shrink-0 ${item.color}`} />
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="text-sm text-muted-foreground">{item.count} invoices</span>
                        <span className="text-sm font-semibold tabular-nums w-32 text-right">RM {item.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pending Bookings Value</span>
                    <span className="font-semibold text-blue-600">RM {data.pendingBookingValue.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bar Chart — By Category + Companies */}
        <TabsContent value="category" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-4">Revenue by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.categoryRevenue} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ebebeb" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} tickFormatter={(v) => `RM ${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
                      {data.categoryRevenue.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-4">Top Companies by Spend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.companyRevenue.map(c => ({ name: c.company.length > 15 ? c.company.slice(0, 14) + "…" : c.company, amount: c.amount }))} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ebebeb" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} tickFormatter={(v) => `RM ${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20} fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
