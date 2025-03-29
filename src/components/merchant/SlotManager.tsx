/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Plus, X } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SlotManagerProps {
  merchantId: string;
  onSlotsUpdated: () => void;
}

const SlotManager: React.FC<SlotManagerProps> = ({ merchantId, onSlotsUpdated }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [timeSlots, setTimeSlots] = useState<{ startTime: string; endTime: string }[]>([
    { startTime: '09:00', endTime: '09:30' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { startTime: '09:00', endTime: '09:30' }]);
  };

  const removeTimeSlot = (index: number) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots.splice(index, 1);
    setTimeSlots(newTimeSlots);
  };

  const handleTimeChange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index][field] = value;
    setTimeSlots(newTimeSlots);
  };

  const handleCreateSlots = async () => {
    if (!merchantId) {
      toast({
        title: "Error",
        description: "Merchant ID is missing",
        variant: "destructive",
      });
      return;
    }

    if (timeSlots.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one time slot",
        variant: "destructive",
      });
      return;
    }

    // Validate time slots
    for (const slot of timeSlots) {
      if (!slot.startTime || !slot.endTime) {
        toast({
          title: "Error",
          description: "Please provide both start and end times for all slots",
          variant: "destructive",
        });
        return;
      }

      // Check that end time is after start time
      if (slot.startTime >= slot.endTime) {
        toast({
          title: "Error",
          description: "End time must be after start time",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const slotsToInsert = timeSlots.map(slot => ({
        merchant_id: merchantId,
        date: formattedDate,
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_booked: false,
        service_duration: calculateDuration(slot.startTime, slot.endTime)
      }));

      const { data, error } = await supabase
        .from('slots')
        .insert(slotsToInsert)
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Created ${data.length} slots for ${format(selectedDate, 'MMMM d, yyyy')}`,
      });

      // Reset form
      setTimeSlots([{ startTime: '09:00', endTime: '09:30' }]);
      
      // Notify parent component to refresh slots
      onSlotsUpdated();
    } catch (error: any) {
      console.error('Error creating slots:', error);
      toast({
        title: "Failed to create slots",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    return endMinutes - startMinutes;
  };

  return (
    <Card className="bg-black/80 border-border/20">
      <CardHeader>
        <CardTitle>Create Availability Slots</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Label htmlFor="date" className="mb-2 block">Select Date</Label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 border border-input bg-background px-3 py-2 rounded-md">
                {format(selectedDate, 'MMMM d, yyyy')}
              </div>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setShowCalendar(false);
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="block">Time Slots</Label>
          {timeSlots.map((slot, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`startTime-${index}`} className="sr-only">Start Time</Label>
                    <Input
                      id={`startTime-${index}`}
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`endTime-${index}`} className="sr-only">End Time</Label>
                    <Input
                      id={`endTime-${index}`}
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTimeSlot(index)}
                disabled={timeSlots.length === 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 w-full"
            onClick={addTimeSlot}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Time Slot
          </Button>
        </div>

        <Button 
          className="w-full" 
          onClick={handleCreateSlots}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Slots...' : 'Create Slots'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SlotManager;