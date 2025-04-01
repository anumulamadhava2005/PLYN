import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardStats } from '@/types/admin';

interface ChartData {
  name: string;
  value: number;
}

interface AnalyticsDashboardProps {
  stats: DashboardStats;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ stats }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    // Prepare chart data based on the stats
    const data: ChartData[] = [
      { name: 'Merchants', value: stats.totalMerchants },
      { name: 'Users', value: stats.totalUsers },
      { name: 'Bookings', value: stats.totalBookings },
      { name: 'Customers', value: stats.totalCustomers || 0 },
      { name: 'Revenue ($)', value: stats.totalRevenue || 0 },
      { name: 'Completed', value: stats.completedBookings || 0 },
      { name: 'Pending', value: stats.pendingBookings || 0 },
      { name: 'Applications', value: stats.pendingApplications }
    ];
    
    setChartData(data);
  }, [stats]);

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="merchants">Merchants</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
        
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Booking Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Detailed booking statistics will be implemented in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="merchants">
          <Card>
            <CardHeader>
              <CardTitle>Merchant Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Detailed merchant statistics will be implemented in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
