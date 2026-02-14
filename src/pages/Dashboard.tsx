import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => (
  <div className="space-y-6">
    <div>
      <h3>Dashboard</h3>
      <p className="text-muted-foreground">Welcome back, John.</p>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-3xl font-display">2,847</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Revenue</CardDescription>
          <CardTitle className="text-3xl font-display">$48.2K</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Active Projects</CardDescription>
          <CardTitle className="text-3xl font-display">16</CardTitle>
        </CardHeader>
      </Card>
    </div>
  </div>
);

export default Dashboard;
