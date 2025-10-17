import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CheckCircle, Users, Zap } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <div className="flex justify-center mb-6">
            <Briefcase className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold">WorkPortal</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect clients with talented freelancers. Manage projects, collaborate seamlessly, and deliver exceptional results.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Easy Collaboration</h3>
            <p className="text-muted-foreground">Built-in messaging and file sharing for seamless teamwork</p>
          </div>
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-accent" />
            </div>
            <h3 className="font-semibold text-lg">Track Progress</h3>
            <p className="text-muted-foreground">Monitor deliverables and milestones in real-time</p>
          </div>
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Zap className="h-12 w-12 text-warning" />
            </div>
            <h3 className="font-semibold text-lg">Fast Payments</h3>
            <p className="text-muted-foreground">Simplified invoicing and payment processing</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
