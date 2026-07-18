"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Users, Flag, Ban, Activity, Shield, RefreshCw } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  pendingReports: number;
  activeBans: number;
  matchesToday: number;
  moderationLogs: Array<{
    id: string;
    action: string;
    details: string | null;
    createdAt: string;
    moderator: { name: string | null };
  }>;
}

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  reporter: { name: string | null; email: string };
  reported: { id: string; name: string | null; email: string };
}

interface TopInterest {
  rank: number;
  interestId: string;
  name: string;
  userCount: number;
  percentage: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "reports" | "logs">("overview");
  const [topInterests, setTopInterests] = useState<TopInterest[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [interestsError, setInterestsError] = useState<string | null>(null);
  const [interestsUpdatedAt, setInterestsUpdatedAt] = useState<string | null>(null);

  const loadInterestAnalytics = useCallback(async () => {
    setInterestsLoading(true);
    setInterestsError(null);
    try {
      const res = await fetch("/api/admin/analytics/interests");
      const data = await res.json();
      if (!res.ok) {
        setInterestsError(data.error || "Failed to load interest analytics");
        setTopInterests([]);
        return;
      }
      setTopInterests(Array.isArray(data.interests) ? data.interests : []);
      setInterestsUpdatedAt(data.updatedAt ?? null);
    } catch {
      setInterestsError("Failed to load interest analytics");
      setTopInterests([]);
    } finally {
      setInterestsLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/reports/review").then((r) => r.json()),
    ]).then(([statsData, reportsData]) => {
      setStats(statsData);
      setReports(Array.isArray(reportsData) ? reportsData : []);
      setLoading(false);
    });
    void loadInterestAnalytics();
  }, [loadInterestAnalytics]);

  const handleReview = async (reportId: string, status: string, banUser = false) => {
    await fetch("/api/reports/review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId,
        status,
        banUser,
        banType: banUser ? "TEMPORARY" : undefined,
        banDuration: banUser ? 24 : undefined,
      }),
    });
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    if (stats) {
      setStats({ ...stats, pendingReports: stats.pendingReports - 1 });
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-400" },
    { label: "Pending Reports", value: stats?.pendingReports || 0, icon: Flag, color: "text-yellow-400" },
    { label: "Active Bans", value: stats?.activeBans || 0, icon: Ban, color: "text-red-400" },
    { label: "Matches Today", value: stats?.matchesToday || 0, icon: Activity, color: "text-green-400" },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="text-bear-gold" size={28} />
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["overview", "reports", "logs"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                  tab === t ? "bg-bear-brown text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(({ label, value, icon: Icon, color }) => (
                  <Card key={label}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/40">{label}</p>
                        <p className="text-3xl font-bold text-white mt-1">{value}</p>
                      </div>
                      <Icon size={24} className={color} />
                    </div>
                  </Card>
                ))}
              </div>

              <Card>
                <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Top 5 Most Used Interests
                    </h2>
                    <p className="text-sm text-white/40 mt-1">
                      Unique users currently selecting each interest
                    </p>
                    {interestsUpdatedAt && (
                      <p className="text-xs text-white/30 mt-1">
                        Last updated {new Date(interestsUpdatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void loadInterestAnalytics()}
                    disabled={interestsLoading}
                    aria-label="Refresh interest analytics"
                  >
                    <RefreshCw size={14} className={interestsLoading ? "animate-spin" : undefined} />
                    Refresh
                  </Button>
                </div>

                {interestsLoading && (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner text="Loading interests..." />
                  </div>
                )}

                {!interestsLoading && interestsError && (
                  <p className="text-center text-red-400 py-8" role="alert">
                    {interestsError}
                  </p>
                )}

                {!interestsLoading && !interestsError && topInterests.length === 0 && (
                  <p className="text-center text-white/40 py-8">
                    No interests have been selected yet
                  </p>
                )}

                {!interestsLoading && !interestsError && topInterests.length > 0 && (
                  <ol className="space-y-3" aria-label="Top five interests by unique users">
                    {topInterests.map((item) => (
                      <li key={item.interestId}>
                        <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
                          <span className="text-white font-medium">
                            {item.rank}. {item.name}
                          </span>
                          <span className="text-white/50 whitespace-nowrap">
                            {item.userCount} users — {item.percentage}%
                          </span>
                        </div>
                        <div
                          className="h-2 rounded-full bg-white/5 overflow-hidden"
                          role="progressbar"
                          aria-valuenow={item.percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${item.name} usage`}
                        >
                          <div
                            className="h-full rounded-full bg-bear-gold/80"
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            </div>
          )}

          {tab === "reports" && (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <Card><p className="text-center text-white/40 py-8">No pending reports</p></Card>
              ) : (
                reports.map((report) => (
                  <Card key={report.id}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-white font-medium">{report.reason}</p>
                        <p className="text-sm text-white/40 mt-1">
                          Reported: {report.reported.name || report.reported.email}
                        </p>
                        <p className="text-sm text-white/40">
                          By: {report.reporter.name || report.reporter.email}
                        </p>
                        {report.description && (
                          <p className="text-sm text-white/50 mt-2">{report.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="secondary" onClick={() => handleReview(report.id, "DISMISSED")}>
                          Dismiss
                        </Button>
                        <Button size="sm" variant="primary" onClick={() => handleReview(report.id, "RESOLVED")}>
                          Resolve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReview(report.id, "RESOLVED", true)}>
                          Ban User
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === "logs" && (
            <Card>
              <div className="space-y-3">
                {stats?.moderationLogs?.length === 0 ? (
                  <p className="text-center text-white/40 py-8">No moderation logs</p>
                ) : (
                  stats?.moderationLogs?.map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-sm text-white">{log.action.replace(/_/g, " ")}</p>
                        <p className="text-xs text-white/40">
                          by {log.moderator.name} — {log.details}
                        </p>
                      </div>
                      <span className="text-xs text-white/30">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
