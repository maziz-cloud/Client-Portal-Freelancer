import { useAuth } from '@/hooks/useAuth';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Bell,
  FileText,
  User,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;

  const clientItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'My Projects', url: '/projects', icon: Briefcase },
    { title: 'Post Project', url: '/projects/new', icon: PlusCircle },
    { title: 'Messages', url: '/messages', icon: MessageSquare },
    { title: 'Invoices', url: '/invoices', icon: FileText },
  ];

  const freelancerItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Browse Projects', url: '/projects', icon: Briefcase },
    { title: 'My Work', url: '/my-work', icon: FileText },
    { title: 'Messages', url: '/messages', icon: MessageSquare },
    { title: 'Earnings', url: '/earnings', icon: FileText },
  ];

  const items = profile?.role === 'client' ? clientItems : freelancerItems;

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarHeader className="border-b p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">WorkPortal</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/notifications')}>
                  <NavLink to="/notifications">
                    <Bell className="h-4 w-4" />
                    {!collapsed && <span>Notifications</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/profile')}>
                  <NavLink to="/profile">
                    <User className="h-4 w-4" />
                    {!collapsed && <span>Profile</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {!collapsed && profile && (
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback>{profile.full_name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
            </div>
          </div>
        )}
        <Button
          variant="outline"
          onClick={signOut}
          className="w-full"
          size={collapsed ? 'icon' : 'default'}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}