
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import BookingCalendar from './BookingCalendar';
import { checkSlotAvailability, bookSlot } from '@/utils/bookingUtils';
import { useAuth } from '@/context/AuthContext';

interface BookingFormProps {
  salonId: string;
  salonName: string;
  selectedServices: any[];
  totalPrice: number;
  totalDuration: number;
}

const BookingForm: React.FC<BookingFormProps> = ({
  salonId,
  salonName,
  selectedServices,
  totalPrice,
  totalDuration
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Prefill email if user is logged in
    if (user) {
      setEmail(user.email || '');
    }
  }, [user]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSelectedSlotId('');
  };

  const handleTimeSelect = (time: string, slotId: string) => {
    setSelectedTime(time);
    setSelectedSlotId(slotId);
  };

  const validateForm = () => {
    if (!selectedDate) {
      toast({
        title: "Date required",
        description: "Please select an appointment date",
        variant: "destructive",
      });
      return false;
    }

    if (!selectedTime) {
      toast({
        title: "Time required",
        description: "Please select an appointment time",
        variant: "destructive",
      });
      return false;
    }

    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return false;
    }

    if (!phone) {
      toast({
        title: "Phone required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login or sign up to book an appointment",
        variant: "destructive",
      });
      
      // Save booking details to sessionStorage before redirecting to login
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        salonId,
        salonName,
        selectedServices,
        totalPrice,
        totalDuration,
        selectedDate: selectedDate.toISOString(),
        selectedTime,
        selectedSlotId,
        email,
        phone,
        notes
      }));
      
      navigate('/auth', { state: { redirectAfterAuth: `/book/${salonId}` } });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Verify slot is still available
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      // Double check availability
      const { available, slotId } = await checkSlotAvailability(
        salonId, 
        formattedDate, 
        selectedTime || ''
      );
      
      if (!available) {
        toast({
          title: "Slot no longer available",
          description: "Sorry, this time slot has just been booked. Please select another time.",
          variant: "destructive",
        });
        setSelectedTime(null);
        setSelectedSlotId('');
        setIsSubmitting(false);
        return;
      }
      
      // Book the slot
      await bookSlot(selectedSlotId);
      
      // Proceed to payment page
      navigate('/payment', {
        state: {
          salonId,
          salonName,
          services: selectedServices,
          date: formattedDate,
          timeSlot: selectedTime,
          email,
          phone,
          notes,
          totalPrice,
          totalDuration,
          slotId: selectedSlotId
        }
      });
    } catch (error: any) {
      console.error("Error proceeding to payment:", error);
      toast({
        title: "Booking error",
        description: error.message || "An error occurred while processing your booking",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <BookingCalendar
              salonId={salonId}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onDateChange={handleDateChange}
              onTimeSelect={handleTimeSelect}
            />
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(123) 456-7890"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or information for your appointment"
              rows={4}
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={!selectedTime || isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default BookingForm;
