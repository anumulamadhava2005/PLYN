/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { format, addMinutes, addDays, parseISO, subDays } from "date-fns";
import { TimeSlot, SlotAvailability } from "@/types/admin";

// Generate time slots for a salon
export const generateSalonTimeSlots = async (salonId: string, date: Date) => {
  try {
    // Format the date for database queries
    const formattedDate = format(date, "yyyy-MM-dd");
    
    // First check if slots already exist for this date and salon
    const { data: existingSlots, error: checkError } = await supabase
      .from("slots")
      .select("*")
      .eq("merchant_id", salonId)
      .eq("date", formattedDate);
    
    if (checkError) throw checkError;
    
    // If slots already exist, return them
    if (existingSlots && existingSlots.length > 0) {
      console.log(`Found ${existingSlots.length} existing slots for ${formattedDate}`);
      return existingSlots;
    }
    
    console.log(`Generating new slots for ${formattedDate}`);
    
    // Otherwise, create new slots for this date
    const startHour = 9; // 9 AM
    const endHour = 19; // 7 PM
    const slotDuration = 30; // 30 minute intervals
    
    const slots = [];
    let currentTime = new Date(date);
    currentTime.setHours(startHour, 0, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(endHour, 0, 0, 0);
    
    while (currentTime < endTime) {
      const startTimeStr = format(currentTime, "HH:mm");
      const endTimeStr = format(addMinutes(currentTime, slotDuration), "HH:mm");
      
      // Randomly mark some slots as booked for testing purposes
      const randomBooked = Math.random() < 0.3; // 30% chance of being booked
      
      slots.push({
        merchant_id: salonId,
        date: formattedDate,
        start_time: startTimeStr,
        end_time: endTimeStr,
        is_booked: randomBooked,
        service_duration: slotDuration
      });
      
      currentTime = addMinutes(currentTime, slotDuration);
    }
    
    // Insert the slots into the database
    const { data: insertedSlots, error: insertError } = await supabase
      .from("slots")
      .insert(slots)
      .select();
    
    if (insertError) throw insertError;
    
    console.log(`Created ${insertedSlots.length} new slots for ${formattedDate}`);
    return insertedSlots;
  } catch (error) {
    console.error("Error generating salon time slots:", error);
    throw error;
  }
};

// Get available time slots for a salon
export const getAvailableTimeSlots = async (salonId: string, date: Date) => {
  try {
    // Ensure slots exist for this date
    await generateSalonTimeSlots(salonId, date);
    
    // Format the date for database queries
    const formattedDate = format(date, "yyyy-MM-dd");
    
    // Get available slots
    const { data: availableSlots, error } = await supabase
      .from("slots")
      .select("*")
      .eq("merchant_id", salonId)
      .eq("date", formattedDate)
      .eq("is_booked", false)
      .order("start_time");
    
    if (error) throw error;
    
    console.log(`Found ${availableSlots?.length || 0} available slots for ${formattedDate}`);
    return availableSlots || [];
  } catch (error) {
    console.error("Error getting available time slots:", error);
    throw error;
  }
};

// Format time slots for display
export const formatSlotsForDisplay = (slots: any[]) => {
  return slots.map(slot => ({
    id: slot.id,
    time: slot.start_time,
    available: !slot.is_booked
  }));
};

// Add default data for development purposes
export const seedDefaultData = async () => {
  // ... keep existing code (seed data functionality)
};

// Helper function to generate slots for merchants
async function generateSlotsForMerchants(merchants: any[]) {
  // ... keep existing code (generate slots helper)
}

// Create some test bookings for development
async function createTestBookings(merchants: any[]) {
  // ... keep existing code (test bookings functionality)
}

// New function to support real-time updates
export const enableRealtimeForSlots = async () => {
  try {
    // Enable realtime for slots table; casting to any to bypass TypeScript checking
    const { data, error } = await (supabase.rpc as any)(
      'supabase_realtime' as any,
      {
        table_name: 'slots',
        action: 'enable'
      }
    );
    
    if (error) throw error;
    console.log("Realtime enabled for slots table");
    return data;
  } catch (error) {
    console.error("Error enabling realtime:", error);
    // Don't throw the error, just log it as this is not critical
    return null;
  }
};

// New function for bulk creating time slots
export const createBulkTimeSlots = async (
  merchantId: string,
  date: string,
  slots: { startTime: string; endTime: string }[]
): Promise<TimeSlot[]> => {
  try {
    const slotsToCreate = slots.map(slot => {
      // Calculate duration in minutes
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      const duration = endMinutes - startMinutes;
      
      return {
        merchant_id: merchantId,
        date,
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_booked: false,
        service_duration: duration
      };
    });
    
    const { data, error } = await supabase
      .from("slots")
      .insert(slotsToCreate)
      .select();
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error creating bulk time slots:", error);
    throw error;
  }
};

// Get slot availability summary by date
export const getSlotAvailabilitySummary = async (
  merchantId: string, 
  startDate: Date, 
  endDate: Date
): Promise<SlotAvailability[]> => {
  try {
    const formattedStartDate = format(startDate, "yyyy-MM-dd");
    const formattedEndDate = format(endDate, "yyyy-MM-dd");
    
    const { data, error } = await supabase
      .from("slots")
      .select("date, is_booked")
      .eq("merchant_id", merchantId)
      .gte("date", formattedStartDate)
      .lte("date", formattedEndDate);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Group by date and count available/booked slots
    const dateMap = new Map<string, { available: number; booked: number }>();
    
    data.forEach(slot => {
      if (!dateMap.has(slot.date)) {
        dateMap.set(slot.date, { available: 0, booked: 0 });
      }
      
      const dateStats = dateMap.get(slot.date)!;
      if (slot.is_booked) {
        dateStats.booked += 1;
      } else {
        dateStats.available += 1;
      }
    });
    
    // Convert map to array
    const result: SlotAvailability[] = Array.from(dateMap.entries()).map(([date, slots]) => ({
      date,
      slots
    }));
    
    // Sort by date
    result.sort((a, b) => a.date.localeCompare(b.date));
    
    return result;
  } catch (error) {
    console.error("Error getting slot availability summary:", error);
    throw error;
  }
};