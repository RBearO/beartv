"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Avatar from "@/components/ui/Avatar";

interface ReportItem {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  reported: { id: string; name: string | null; image: string | null };
}

const statusVariant: Record<string, "default" | "warning" | "success" | "danger"> = {
  PENDING: "warning",
  REVIEWING: "default",
  RESOLVED: "success",
  DISMISSED: "danger",
};

export default function ReportPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((data) => {
        setReports(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Report History</h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : reports.length === 0 ? (
            <Card>
              <p className="text-center text-white/40 py-8">No reports submitted yet.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={report.reported.image} name={report.reported.name} />
                      <div>
                        <p className="text-white font-medium">{report.reported.name || "Unknown"}</p>
                        <p className="text-sm text-white/40">{report.reason}</p>
                      </div>
                    </div>
                    <Badge variant={statusVariant[report.status] || "default"}>
                      {report.status}
                    </Badge>
                  </div>
                  {report.description && (
                    <p className="text-sm text-white/50 mt-3 pl-13">{report.description}</p>
                  )}
                  <p className="text-xs text-white/30 mt-2">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
