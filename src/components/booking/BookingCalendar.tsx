import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { fetchAvailableSlots } from '@/utils/bookingUtils';

interface BookingCalendarProps {
  salonId: string;
  onDateChange: (date: Date) => void;
  onTimeSelect: (time: string, slotId: string) => void;
  selectedDate: Date;
  selectedTime: string | null;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  salonId,
  onDateChange,
  onTimeSelect,
  selectedDate,
  selectedTime
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (salonId && selectedDate) {
      loadAvailableSlots();
    }
  }, [salonId, selectedDate]);

  const loadAvailableSlots = async () => {
    setIsLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const slots = await fetchAvailableSlots(salonId, formattedDate);
      setAvailableSlots(slots);
    } catch (error: any) {
      console.error('Error loading slots:', error);
      toast({
        title: 'Error loading available times',
        description: error.message || 'Could not load available time slots',
        variant: 'destructive',
      });
      setAvailableSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      // Clear selected time when date changes
      onTimeSelect('', '');
    }
  };

  const groupSlotsByHour = () => {
    const grouped: Record<string, any[]> = {};
    
    availableSlots.forEach(slot => {
      const hour = slot.start_time.split(':')[0];
      if (!grouped[hour]) {
        grouped[hour] = [];
      }
      grouped[hour].push(slot);
    });
    
    return Object.entries(grouped).sort(([hourA], [hourB]) => 
      parseInt(hourA) - parseInt(hourB)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Select Date</label>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Available Times</label>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : availableSlots.length > 0 ? (
          <div className="space-y-4">
            {groupSlotsByHour().map(([hour, slots]) => (
              <div key={hour} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {parseInt(hour) < 12 
                    ? `${hour} AM` 
                    : parseInt(hour) === 12 
                      ? '12 PM' 
                      : `${parseInt(hour) - 12} PM`}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <Button
                      key={slot.id}
                      variant={selectedTime === slot.start_time ? "default" : "outline"}
                      size="sm"
                      className="relative"
                      onClick={() => onTimeSelect(slot.start_time, slot.id)}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {slot.start_time}
                      {selectedTime === slot.start_time && (
                        <div className="absolute -top-1 -right-1">
                          <div className="bg-primary rounded-full p-0.5">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/40 rounded-md p-4 text-center">
            <p className="text-muted-foreground">
              {selectedDate 
                ? 'No available time slots for the selected date' 
                : 'Please select a date to see available times'}
            </p>
            {selectedDate && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => {
                  const tomorrow = new Date(selectedDate);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  handleDateSelect(tomorrow);
                }}
              >
                Try tomorrow
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCalendar;
