import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { EmployerSidebar } from "@/components/employer/EmployerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import PostJob from "@/components/employer/PostJob";
import ManageListings from "@/components/employer/ManageListings";
import EmployerApplicants from "@/components/employer/EmployerApplicants";
import CandidateSearch from "@/components/employer/CandidateSearch";
import EmployerMessages from "@/components/employer/EmployerMessages";
import WorkerRatings from "@/components/employer/WorkerRatings";
import EmployerAnalytics from "@/components/employer/EmployerAnalytics";

const EmployerDashboard = () => {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth?mode=login" replace />;
  if (userRole !== "employer") return <Navigate to="/" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <EmployerSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4">
            <SidebarTrigger className="mr-4" />
            <span className="text-sm text-muted-foreground">Employer Dashboard</span>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route index element={<PostJob />} />
              <Route path="listings" element={<ManageListings />} />
              <Route path="applicants" element={<EmployerApplicants />} />
              <Route path="candidates" element={<CandidateSearch />} />
              <Route path="messages" element={<EmployerMessages />} />
              <Route path="ratings" element={<WorkerRatings />} />
              <Route path="analytics" element={<EmployerAnalytics />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EmployerDashboard;
