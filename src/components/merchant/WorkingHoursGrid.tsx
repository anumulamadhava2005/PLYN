import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';

type TimeSlot = {
  id: string;
  time: string;
  day: string;
  status: 'available' | 'booked' | 'unavailable';
};

type WorkingHoursGridProps = {
  slots: TimeSlot[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
};

export const WorkingHoursGrid = ({ 
  slots, 
  selectedDate, 
  onDateChange,
  onRefresh,
  isLoading = false
}: WorkingHoursGridProps) => {
  console.log("WorkingHoursGrid - Slots:", slots);
  console.log("WorkingHoursGrid - Selected Date:", selectedDate);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = [
    '9:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00'
  ];

  const renderStatusBadge = (status: TimeSlot['status']) => {
    const styles = {
      available: "bg-green-500/20 text-green-500 hover:bg-green-500/30 cursor-pointer",
      booked: "bg-primary/90 text-white",
      unavailable: "bg-gray-800/50 text-gray-500"
    };

    const labels = {
      available: "Available",
      booked: "Booked",
      unavailable: "Unavailable"
    };

    return (
      <div className={cn(
        "w-full py-2 text-center text-sm rounded transition-colors",
        styles[status]
      )}>
        {labels[status]}
      </div>
    );
  };

  const getSlotForDayAndTime = (day: string, time: string) => {
    console.log("getSlotForDayAndTime - Day:", day, "Time:", time);
    const matchingSlot = slots.find(slot => 
      slot.day.toLowerCase() === day.toLowerCase() && 
      slot.time === (parseInt(time, 10) < 10 ? `0${time}:00` : `${time}:00`)
    );
    console.log(slots);
    console.log("getSlotForDayAndTime - Matching Slot:", matchingSlot);
    
    if (matchingSlot) {
      return matchingSlot;
    }
    
    return {
      id: `${day}-${time}`,
      day,
      time,
      status: 'unavailable' as const
    };
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? subDays(selectedDate, 1)
      : addDays(selectedDate, 1);
    onDateChange(newDate);
  };

  const summarizeAvailability = () => {
    const available = slots.filter(slot => slot.status === 'available').length;
    const booked = slots.filter(slot => slot.status === 'booked').length;
    return { available, booked };
  };

  const { available, booked } = summarizeAvailability();

  return (
    <Card className="bg-black/80 border-border/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Working Hours</CardTitle>
          <div className="text-muted-foreground text-sm mt-1 flex flex-col sm:flex-row sm:items-center gap-2">
            <span>{format(selectedDate, 'MMM dd, yyyy')}</span>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/20">
                {available} Available
              </Badge>
              <Badge variant="default">{booked} Booked</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                    onDateChange(date);
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
            <span className="sr-only">Previous day</span>
            &lt;
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
            <span className="sr-only">Next day</span>
            &gt;
          </Button>
          {onRefresh && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onRefresh} 
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max grid grid-cols-8 gap-2">
            {/* Header row */}
            <div className="text-center text-muted-foreground py-2"></div>
            {days.map(day => (
              <div key={day} className="text-center font-medium py-2">
                {day}
              </div>
            ))}
            
            {/* Time slots grid */}
            {hours.map(time => (
              <React.Fragment key={time}>
                <div className="text-right pr-4 py-2 text-muted-foreground">
                  {time}
                </div>
                {days.map(day => {
                  const slot = getSlotForDayAndTime(day, time);
                  return (
                    <div key={`${day}-${time}`} className="py-2">
                      {renderStatusBadge(slot.status)}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkingHoursGrid;