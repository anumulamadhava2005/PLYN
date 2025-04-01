import React from 'react';
import { toast } from '@/hooks/use-toast';
import { Check, Calendar, Clock } from 'lucide-react';

interface BookingDetails {
  salonName: string;
  serviceName: string;
  date: string;
  time: string;
}

export const showBookingSuccessNotification = (booking: BookingDetails) => {
  toast({
    title: "Booking Confirmed!",
    description: (
      <div className="flex flex-col gap-1">
        <p>Your appointment has been successfully booked!</p>
        <div className="flex items-center gap-2 mt-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span>{booking.date}</span>
          <Clock className="h-4 w-4 ml-2 text-primary" />
          <span>{booking.time}</span>
        </div>
        <p className="font-medium mt-1">{booking.salonName} - {booking.serviceName}</p>
      </div>
    ),
    variant: "default"
  });
};