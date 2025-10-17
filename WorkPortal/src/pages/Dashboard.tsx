import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface Stats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalEarnings: number;
}

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return;

      try {
        const isClient = profile.role === 'client';
        const query = supabase
          .from('projects')
          .select('*', { count: 'exact' });

        if (isClient) {
          query.eq('client_id', profile.id);
        } else {
          query.eq('freelancer_id', profile.id);
        }

        const { data: projects, error } = await query;

        if (error) throw error;

        const activeProjects = projects?.filter(
          (p) => p.status === 'in_progress' || p.status === 'in_review'
        ).length || 0;

        const completedProjects = projects?.filter(
          (p) => p.status === 'completed'
        ).length || 0;

        // Fetch earnings for freelancers
        let earnings = 0;
        if (!isClient) {
          const { data: invoices } = await supabase
            .from('invoices')
            .select('amount')
            .eq('freelancer_id', profile.id)
            .eq('status', 'paid');

          earnings = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
        }

        setStats({
          totalProjects: projects?.length || 0,
          activeProjects,
          completedProjects,
          totalEarnings: earnings,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile]);

  const isClient = profile?.role === 'client';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name}!</h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your {isClient ? 'projects' : 'work'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Projects
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {isClient ? 'Posted projects' : 'Assigned projects'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Projects
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully finished
              </p>
            </CardContent>
          </Card>

          {!isClient && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Earnings
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.totalEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From completed projects
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {isClient
                ? 'Post a new project to find talented freelancers'
                : 'Browse available projects and start working'}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;