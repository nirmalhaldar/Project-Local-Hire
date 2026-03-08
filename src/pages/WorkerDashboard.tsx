import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { WorkerSidebar } from "@/components/worker/WorkerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import JobSearch from "@/components/worker/JobSearch";
import WorkerProfile from "@/components/worker/WorkerProfile";
import WorkerAvailability from "@/components/worker/WorkerAvailability";
import WorkerPortfolio from "@/components/worker/WorkerPortfolio";

const WorkerDashboard = () => {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth?mode=login" replace />;
  if (userRole !== "worker") return <Navigate to="/" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <WorkerSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4">
            <SidebarTrigger className="mr-4" />
            <span className="text-sm text-muted-foreground">Worker Dashboard</span>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route index element={<JobSearch />} />
              <Route path="profile" element={<WorkerProfile />} />
              <Route path="availability" element={<WorkerAvailability />} />
              <Route path="portfolio" element={<WorkerPortfolio />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default WorkerDashboard;
