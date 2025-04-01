/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Plus, X, Loader2, RefreshCw } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TimeSlot, SlotFormData, DisplaySlot } from '@/types/admin';
import { createDynamicTimeSlots } from '@/utils/bookingUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface SlotManagerProps {
  merchantId: string;
  onSlotsUpdated?: () => void;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

const SlotManager: React.FC<SlotManagerProps> = ({
  merchantId,
  onSlotsUpdated,
  selectedDate: propSelectedDate,
  onDateChange
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(propSelectedDate || new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [timeSlots, setTimeSlots] = useState<SlotFormData[]>([
    { startTime: '09:00', endTime: '09:30' }
  ]);
  const [existingSlots, setExistingSlots] = useState<DisplaySlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDynamic, setIsGeneratingDynamic] = useState(false);
  const [serviceDuration, setServiceDuration] = useState("30");
  const { toast } = useToast();

  useEffect(() => {
    if (propSelectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  useEffect(() => {
    fetchExistingSlots();
  }, [selectedDate, merchantId]);

  const fetchExistingSlots = async () => {
    if (!merchantId) return;

    setIsLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('date', formattedDate);

      if (error) throw error;

      const processedSlots: DisplaySlot[] = (data || []).map(slot => ({
        id: slot.id,
        day: new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short' }),
        time: slot.start_time,
        status: slot.is_booked ? 'booked' : 'available'
      }));

      setExistingSlots(processedSlots);
    } catch (error: any) {
      console.error('Error fetching slots:', error);
      toast({
        title: "Failed to fetch slots",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      if (onDateChange) {
        onDateChange(date);
      }
      setShowCalendar(false);
    }
  };

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

      // Refresh the slots display
      fetchExistingSlots();

      // Notify parent component to refresh slots if callback provided
      if (onSlotsUpdated) {
        onSlotsUpdated();
      }
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

  const handleCreateDynamicSlots = async () => {
    if (!merchantId) {
      toast({
        title: "Error",
        description: "Merchant ID is missing",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDynamic(true);

    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      // Get service durations from services offered by this merchant
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('duration')
        .eq('merchant_id', merchantId);

      if (servicesError) throw servicesError;

      // Extract unique durations
      const serviceDurations = servicesData?.map(s => s.duration) || [parseInt(serviceDuration)];
      const uniqueDurations = [...new Set(serviceDurations)];

      // Create dynamic slots
      const data = await createDynamicTimeSlots(merchantId, formattedDate, uniqueDurations);

      toast({
        title: "Success",
        description: `Generated ${data.length} slots for ${format(selectedDate, 'MMMM d, yyyy')} based on your services`,
      });

      // Refresh the slots display
      fetchExistingSlots();

      // Notify parent component to refresh slots if callback provided
      if (onSlotsUpdated) {
        onSlotsUpdated();
      }
    } catch (error: any) {
      console.error('Error creating dynamic slots:', error);
      toast({
        title: "Failed to generate slots",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDynamic(false);
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      onSelect={handleDateChange}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="space-y-2 p-4 bg-background/5 rounded-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Generate Dynamic Slots</h3>
              <div className="w-1/3">
                <Select
                  value={serviceDuration}
                  onValueChange={setServiceDuration}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Create slots from 9:00 AM to 5:00 PM based on your services</p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleCreateDynamicSlots}
              disabled={isGeneratingDynamic}
            >
              {isGeneratingDynamic ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Generate Working Hours (9AM-5PM)
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            <Label className="block">Custom Time Slots</Label>
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
              Add Custom Time Slot
            </Button>
          </div>

          <Button
            className="w-full"
            onClick={handleCreateSlots}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Slots...
              </>
            ) : 'Create Custom Slots'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-black/80 border-border/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Existing Slots for {format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchExistingSlots}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : existingSlots.length > 0 ? (
            <div className="space-y-2">
              {existingSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`p-3 rounded-md flex justify-between items-center ${slot.status === 'booked'
                    ? 'bg-red-900/20 border border-red-500/30'
                    : 'bg-green-900/20 border border-green-500/30'
                    }`}
                >
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{slot.time}</span>
                  </div>
                  <div>
                    {slot.status === 'booked' ? (
                      <span className="text-sm px-2 py-1 rounded-full bg-red-500/20 text-red-300">
                        Booked
                      </span>
                    ) : (
                      <span className="text-sm px-2 py-1 rounded-full bg-green-500/20 text-green-300">
                        Available
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No time slots found for this date
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SlotManager;