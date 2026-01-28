import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, BarChart3, TrendingUp, Calendar } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-description">
          Advanced analytics and reporting (Coming Soon)
        </p>
      </div>

      {/* Coming Soon State */}
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <PieChart className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Analytics Module</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Advanced analytics and reporting features are under development. 
              This module will include:
            </p>
            
            <div className="grid grid-cols-2 gap-3 text-left">
              <FeaturePreview
                icon={BarChart3}
                title="Trend Analysis"
                description="Historical data trends"
              />
              <FeaturePreview
                icon={PieChart}
                title="Breakdown Analysis"
                description="Failure pattern insights"
              />
              <FeaturePreview
                icon={TrendingUp}
                title="Predictive Analytics"
                description="Maintenance forecasting"
              />
              <FeaturePreview
                icon={Calendar}
                title="Custom Reports"
                description="Scheduled reporting"
              />
            </div>

            <p className="text-xs text-muted-foreground pt-4">
              Stay tuned for upcoming updates
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeaturePreview({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="p-3 bg-secondary/50 rounded-lg">
      <Icon className="h-4 w-4 text-primary mb-2" />
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  );
}
