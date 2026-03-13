import { PlusCircle, List, Users, MessageSquare, LogOut, BarChart3, Search, Star, UserCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Post a Job", url: "/dashboard/employer", icon: PlusCircle },
  { title: "My Profile", url: "/dashboard/employer/profile", icon: UserCircle },
  { title: "My Listings", url: "/dashboard/employer/listings", icon: List },
  { title: "Applicants", url: "/dashboard/employer/applicants", icon: Users },
  { title: "Find Workers", url: "/dashboard/employer/candidates", icon: Search },
  { title: "Messages", url: "/dashboard/employer/messages", icon: MessageSquare },
  { title: "Rate Workers", url: "/dashboard/employer/ratings", icon: Star },
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
          <img src="/logo.png" alt="LocalHire" className="w-9 h-9 rounded-lg object-contain shrink-0" />
          {!collapsed && <span className="font-bold text-xl text-foreground">Local<span className="text-primary">Hire</span></span>}
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
