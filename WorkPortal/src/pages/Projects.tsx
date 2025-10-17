import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, User } from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  deadline: string;
  created_at: string;
  client_id: string;
  freelancer_id?: string;
  client?: {
    full_name: string;
    avatar_url?: string;
  };
}

const Projects = () => {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!profile) return;

      try {
        let query = supabase
          .from('projects')
          .select(`
            *,
            client:profiles!client_id (
              full_name,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false });

        if (profile.role === 'client') {
          query = query.eq('client_id', profile.id);
        } else {
          // Freelancers see all open projects and their assigned projects
          query = query.or(`status.eq.open,freelancer_id.eq.${profile.id}`);
        }

        const { data, error } = await query;

        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [profile]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-primary',
      in_progress: 'bg-warning',
      in_review: 'bg-accent',
      completed: 'bg-accent',
      cancelled: 'bg-destructive',
    };
    return colors[status] || 'bg-muted';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {profile?.role === 'client' ? 'My Projects' : 'Browse Projects'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {profile?.role === 'client'
                ? 'Manage your posted projects'
                : 'Find projects that match your skills'}
            </p>
          </div>
          {profile?.role === 'client' && (
            <Button onClick={() => navigate('/projects/new')}>
              Post New Project
            </Button>
          )}
        </div>

        {loading ? (
          <p>Loading projects...</p>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                {profile?.role === 'client'
                  ? 'No projects yet. Create your first project!'
                  : 'No projects available at the moment.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-1">
                      {project.title}
                    </CardTitle>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>${project.budget?.toFixed(2) || 'Not specified'}</span>
                  </div>
                  {project.deadline && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                  {profile?.role === 'freelancer' && project.client && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Client: {project.client.full_name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Projects;