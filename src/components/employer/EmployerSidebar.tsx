import { PlusCircle, List, Users, MessageSquare, LogOut, BarChart3 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Post a Job", url: "/dashboard/employer", icon: PlusCircle },
  { title: "My Listings", url: "/dashboard/employer/listings", icon: List },
  { title: "Applicants", url: "/dashboard/employer/applicants", icon: Users },
  { title: "Messages", url: "/dashboard/employer/messages", icon: MessageSquare },
  { title: "Analytics", url: "/dashboard/employer/analytics", icon: BarChart3 },
];

export function EmployerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-lg">L</span>
          </div>
          {!collapsed && <span className="font-bold text-lg text-foreground">Local<span className="text-primary">Hire</span></span>}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Employer</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/dashboard/employer"} className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
