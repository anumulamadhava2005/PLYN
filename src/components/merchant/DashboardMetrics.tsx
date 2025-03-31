import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, Clock, CreditCard } from 'lucide-react';

export interface DashboardMetricsProps {
  totalAppointments: number;
  todayAppointments: number;
  totalClients: number;
  availableSlots: number;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  totalAppointments,
  todayAppointments,
  totalClients,
  availableSlots
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-sm">Total Appointments</p>
              <h3 className="text-3xl font-bold mt-1">{totalAppointments}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-full">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-sm">Today's Appointments</p>
              <h3 className="text-3xl font-bold mt-1">{todayAppointments}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-full">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-sm">Total Clients</p>
              <h3 className="text-3xl font-bold mt-1">{totalClients}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-full">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-sm">Available Slots</p>
              <h3 className="text-3xl font-bold mt-1">{availableSlots}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-full">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardMetrics;
