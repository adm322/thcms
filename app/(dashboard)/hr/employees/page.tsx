"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Upload, Search, ChevronLeft, ChevronRight, User, Download } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";

export default function HREmployees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/hr/employees?page=${page}&limit=50`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setEmployees(d.data);
          setTotalPages(d.pagination.totalPages);
          setTotal(d.pagination.total);
        } else {
          setEmployees(Array.isArray(d) ? d : []);
          setTotalPages(1);
          setTotal(Array.isArray(d) ? d.length : 0);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter((e) =>
      e.name?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.department?.toLowerCase().includes(q) ||
      e.position?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">{total} total • {filtered.length} showing</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, department..."
              className="pl-9 w-64"
            />
          </div>
          <Link href="/hr/employees/upload">
            <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Bulk Upload</Button>
          </Link>
          <ExportButton apiUrl="/api/hr/employees" filename={`employees-${new Date().toISOString().slice(0,7)}.csv`} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {filtered.map((emp) => (
              <Card key={emp.id} className="group border hover:border-primary/30 hover:shadow-sm transition-all">
                <CardContent className="flex items-center justify-between py-3 px-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-sm text-muted-foreground">{emp.department} • {emp.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground hidden sm:inline">{emp.email}</span>
                    <Badge variant={emp.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">{emp.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {employees.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-center">
                <Users className="mb-4 h-12 w-12 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold">No employees yet</h3>
                <p className="text-sm text-muted-foreground">Upload your employee list to get started.</p>
                <Link href="/hr/employees/upload" className="mt-4">
                  <Button><Upload className="mr-2 h-4 w-4" />Upload Employees</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {employees.length > 0 && filtered.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold">No results found</h3>
                <p className="text-sm text-muted-foreground">No employees match "{search}". Try a different search term.</p>
              </CardContent>
            </Card>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />Previous
              </Button>
              <span className="text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}