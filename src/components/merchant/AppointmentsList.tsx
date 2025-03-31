import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Clock } from 'lucide-react';

export interface Appointment {
  id: string;
  customerName: string;
  service: string;
  date: string | undefined;
  time: string | undefined;
  duration: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface AppointmentsListProps {
  appointments: Appointment[];
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const AppointmentsList: React.FC<AppointmentsListProps> = ({ 
  appointments, 
  onConfirm, 
  onCancel 
}) => {
  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No appointments found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <Card key={appointment.id}>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <h3 className="font-medium">{appointment.customerName}</h3>
                <p className="text-sm text-muted-foreground">{appointment.service}</p>
                <div className="flex items-center mt-2">
                  <Badge 
                    variant={
                      appointment.status === 'confirmed' 
                        ? 'default' 
                        : appointment.status === 'cancelled' 
                          ? 'destructive' 
                          : 'outline'
                    }
                    className="text-xs"
                  >
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 sm:mt-0 sm:text-right">
                <div className="text-sm">
                  {appointment.date && new Date(appointment.date).toLocaleDateString()}
                </div>
                <div className="text-sm">
                  {appointment.time} • {appointment.duration}
                </div>
                
                {appointment.status === 'pending' && (
                  <div className="flex gap-2 mt-2 sm:justify-end">
                    {onConfirm && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => onConfirm(appointment.id)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Confirm
                      </Button>
                    )}
                    {onCancel && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs text-destructive hover:text-destructive"
                        onClick={() => onCancel(appointment.id)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AppointmentsList;
