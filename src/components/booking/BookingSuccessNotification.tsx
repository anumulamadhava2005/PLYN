import { toast } from '@/components/ui/use-toast';
import { CheckCircle, Calendar, Clock } from 'lucide-react';
export interface BookingSuccessData {
  bookingId: string;
  salonName: string;
  date: string;
  timeSlot: string;
  services: Array<{ name: string; price: number }>;
  totalPrice: number;
}

export const showBookingSuccessNotification = (bookingData: BookingSuccessData) => {
  toast({
    title: (
      <div className="flex items-center">
        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
        <span>Booking Confirmed!</span>
      </div>
    ),
    description: (
      <div className="mt-2 space-y-2">
        <p className="font-medium">{bookingData.salonName}</p>
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-1.5 text-muted-foreground" />
          <span>{new Date(bookingData.date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })}</span>
        </div>
        <div className="flex items-center text-sm">
          <Clock className="h-4 w-4 mr-1.5 text-muted-foreground" />
          <span>{bookingData.timeSlot}</span>
        </div>
      </div>
    ),
    duration: 8000,
  });
};
