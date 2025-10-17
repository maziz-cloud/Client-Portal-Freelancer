import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, MessageSquare, FileText, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  deadline: string;
  client_id: string;
  freelancer_id?: string;
  created_at: string;
}

const ProjectDetail = () => {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, toast]);

  const handleApply = async () => {
    if (!project || !profile) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          freelancer_id: profile.id,
          status: 'in_progress',
        })
        .eq('id', project.id);

      if (error) throw error;

      // Create notification for client
      await supabase.from('notifications').insert({
        user_id: project.client_id,
        title: 'Project Application',
        message: `${profile.full_name} has applied to your project: ${project.title}`,
        type: 'application',
        link: `/projects/${project.id}`,
      });

      toast({
        title: 'Success',
        description: 'You have successfully applied to this project!',
      });

      navigate('/my-work');
    } catch (error) {
      console.error('Error applying to project:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply to project',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <p>Loading project...</p>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <p>Project not found</p>
      </DashboardLayout>
    );
  }

  const isClient = profile?.id === project.client_id;
  const isAssigned = profile?.id === project.freelancer_id;
  const canApply = profile?.role === 'freelancer' && project.status === 'open' && !isAssigned;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/projects')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{project.title}</CardTitle>
                <CardDescription className="mt-2">
                  Posted on {format(new Date(project.created_at), 'MMMM dd, yyyy')}
                </CardDescription>
              </div>
              <Badge>{project.status.replace('_', ' ')}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Project Description</h3>
              <p className="text-muted-foreground">{project.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-semibold">
                    ${project.budget?.toFixed(2) || 'Not specified'}
                  </p>
                </div>
              </div>
              {project.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Deadline</p>
                    <p className="font-semibold">
                      {format(new Date(project.deadline), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {canApply && (
              <Button onClick={handleApply} className="w-full md:w-auto">
                Apply to Project
              </Button>
            )}

            {(isClient || isAssigned) && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/messages?project=${project.id}`)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </Button>
                {isAssigned && (
                  <Button onClick={() => navigate(`/projects/${project.id}/submit`)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Submit Work
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {(isClient || isAssigned) && (
          <Tabs defaultValue="deliverables">
            <TabsList>
              <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            <TabsContent value="deliverables">
              <Card>
                <CardHeader>
                  <CardTitle>Project Deliverables</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Deliverables will be displayed here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Project Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Timeline milestones will be displayed here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetail;