/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { showBookingSuccessNotification } from "@/components/booking/BookingSuccessNotification";
import { addMinutes, format, parseISO } from "date-fns";

// Interface for booking data
export interface BookingData {
  userId: string;
  salonId: string;
  salonName: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  email: string;
  phone: string;
  totalPrice: number;
  totalDuration: number;
  slotId: string;
  notes?: string;
  coinsUsed?: number;
  coinsEarned?: number;
  services: {
    name: any;
    price: any;
  }[] // Optional field for services
}

// Interface for payment data
export interface PaymentData {
  bookingId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  coinsUsed?: number;
  coinsEarned?: number;
}

// Mock function for initializing database (for development purposes)
export const initializeDatabase = async () => {
  console.log("Database initialization function called (development mock)");
  return { success: true, message: "Mock initialization - no actual changes made" };
};

// Function to create a new booking in the database
export const createBooking = async (bookingData: BookingData) => {
  try {
    console.log("Creating booking with data:", bookingData);

    const { data: newBooking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: bookingData.userId,
        merchant_id: bookingData.salonId,
        salon_id: bookingData.salonId,
        salon_name: bookingData.salonName,
        service_name: bookingData.serviceName,
        booking_date: bookingData.date,
        time_slot: bookingData.timeSlot,
        customer_email: bookingData.email,
        customer_phone: bookingData.phone,
        service_price: bookingData.totalPrice,
        service_duration: bookingData.totalDuration,
        slot_id: bookingData.slotId,
        status: "upcoming",
        additional_notes: bookingData.notes || "",
        coins_used: bookingData.coinsUsed || 0,
        coins_earned: bookingData.coinsEarned || 0,
        user_profile_id: bookingData.userId // Set user_profile_id to the user's id
      })
      .select()
      .single();


    if (bookingError) {
      console.error("Error in createBooking:", bookingError);
      throw bookingError;
    }

    console.log("Booking created successfully:", newBooking);

    return newBooking;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

// Function to create a payment record
export const createPayment = async (paymentData: PaymentData) => {
  try {
    console.log("Creating payment with data:", paymentData);

    // For development purposes, always create a successful payment
    const { data: newPayment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        booking_id: paymentData.bookingId,
        user_id: paymentData.userId,
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod,
        payment_status: "completed", // Always completed for development
        transaction_id: `DEV-${Math.floor(Math.random() * 1000000)}`,
        coins_used: paymentData.coinsUsed || 0,
        coins_earned: paymentData.coinsEarned || 0
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error in createPayment:", paymentError);
      throw paymentError;
    }

    // Update the booking with the payment ID
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ payment_id: newPayment.id })
      .eq("id", paymentData.bookingId);

    if (updateError) {
      console.error("Error updating booking with payment_id:", updateError);
      throw updateError;
    }

    console.log("Payment created successfully:", newPayment);

    return newPayment;
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
};

// Function to get user's PLYN coins
export const getUserCoins = async (userId: string) => {
  try {
    console.log("Fetching coins for user:", userId);

    const { data, error } = await supabase
      .from("profiles")
      .select("coins")
      .eq("id", userId)
      .single();


    if (error) {
      console.error("Error in getUserCoins:", error);
      throw error;
    }

    // Handle the coins property safely
    const coins = data?.coins || 0;
    console.log("User coins retrieved:", coins);
    return coins;
  } catch (error) {
    console.error("Error fetching user coins:", error);
    return 0; // Default to 0 coins if there's an error
  }
};

// Function to update user's PLYN coins
export const updateUserCoins = async (userId: string, coinsEarned: number, coinsUsed: number) => {
  try {
    console.log(`Updating coins for user ${userId}: earned ${coinsEarned}, used ${coinsUsed}`);

    // First get current coin balance
    const { data: userData, error: fetchError } = await supabase
      .from("profiles")
      .select("coins")
      .eq("id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching current coin balance:", fetchError);
      throw fetchError;
    }

    // Safely access the coins property
    const currentCoins = userData?.coins || 0;
    const newCoinsBalance = currentCoins + coinsEarned - coinsUsed;

    // Update the user's coin balance
    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({ coins: newCoinsBalance })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating coin balance:", updateError);
      throw updateError;
    }

    console.log("Coins updated successfully. New balance:", newCoinsBalance);

    return newCoinsBalance;
  } catch (error) {
    console.error("Error updating user coins:", error);
    throw error;
  }
};

// Function to fetch user's bookings - update to use the correct relationship
export const fetchUserBookings = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        profiles:user_profile_id(*)
      `)
      .eq("user_id", userId)
      .order("booking_date", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
};

// Function to update a booking status
export const updateBookingStatus = async (bookingId: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
};

// Enhanced function to check slot availability with database locking
export const checkSlotAvailability = async (salonId: string, date: string, timeSlot: string) => {
  try {
    console.log(`Checking slot availability for salon ${salonId} on ${date} at ${timeSlot}`);

    // Begin transaction
    const { data, error } = await supabase
      .from("slots")
      .select("*")
      .eq("merchant_id", salonId)
      .eq("date", date)
      .eq("start_time", timeSlot)
      .eq("is_booked", false)
      .limit(1);


    if (error) {
      console.error("Error checking slot availability:", error);
      throw error;
    }

    // If no slots are found, or if the slot is already booked
    if (!data || data.length === 0) {
      console.log("No available slots found");

      return {
        available: false,
        slotId: null
      };
    }
    console.log("Available slot found:", data[0]);

    return {
      available: true,
      slotId: data[0].id
    };
  } catch (error) {
    console.error("Error checking slot availability:", error);
    throw error;
  }
};

// Enhanced function to mark a slot as booked with atomic update
export const bookSlot = async (slotId: string) => {
  try {
    console.log("Booking slot:", slotId);

    // First check if slot is still available
    const { data: checkData, error: checkError } = await supabase
      .from("slots")
      .select("*")
      .eq("id", slotId)
      .eq("is_booked", false)
      .single();

    if (checkError) {
      if (checkError.code === "PGRST116") {
        // No rows returned, slot is already booked
        console.error("Slot is already booked");
        throw new Error("This slot has already been booked by another customer.");
      }
      console.error("Error checking slot availability:", checkError);
      throw checkError;
    }

    // If we got here, slot is available, so mark it as booked with optimistic locking
    const { data, error } = await supabase
      .from("slots")
      .update({ is_booked: true })
      .eq("id", slotId)
      .eq("is_booked", false) // Ensure it hasn't been booked in the meantime
      .select()
      .single();


    if (error) {
      console.error("Error booking slot:", error);
      throw error;
    }

    if (!data) {
      throw new Error("Slot was booked by someone else while processing your request.");
    }

    return data;
  } catch (error) {
    console.error("Error booking slot:", error);
    throw error;
  }
};

// Function to fetch available slots for a salon on a specific date
export const fetchAvailableSlots = async (salonId: string, date: string) => {
  try {
    const { data, error } = await supabase
      .from("slots")
      .select("*")
      .eq("merchant_id", salonId)
      .eq("date", date)
      .eq("is_booked", false)
      .order("start_time");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching available slots:", error);
    throw error;
  }
};

// Function to fetch all slots for a merchant (for admin/merchant view)
export const fetchMerchantSlots = async (merchantId: string) => {
  try {
    const { data, error } = await supabase
      .from("slots")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching merchant slots:", error);
    throw error;
  }
};

// Function to delete a slot (for merchant use)
// New function to optimize slot creation based on working hours (9:00-17:00)
export const createDynamicTimeSlots = async (merchantId: string, date: string, serviceDurations: number[] = [30]) => {
  try {
    // Default working hours from 9:00 to 17:00 (5:00 PM)
    const workingStartHour = 9;
    const workingEndHour = 17;

    // Get existing slots for this date to avoid duplicates
    const { data: existingSlots, error: existingError } = await supabase
      .from("slots")
      .select("*")
      .eq("merchant_id", merchantId)
      .eq("date", date);

    if (existingError) throw existingError;

    // If slots already exist for this date, don't create duplicates
    if (existingSlots && existingSlots.length > 0) {
      console.log(`${existingSlots.length} slots already exist for ${date}`);
      return existingSlots;
    }

    // Create slots based on all possible service durations
    const slots = [];
    const slotsSeen = new Set(); // To avoid duplicate slots

    // Ensure we have at least one service duration
    if (serviceDurations.length === 0) {
      serviceDurations = [30]; // Default 30 minute slots
    }

    // Create slots for each service duration
    for (const duration of serviceDurations) {
      // Start at 9:00 AM
      let currentDate = new Date(`${date}T09:00:00`);
      const endTime = new Date(`${date}T${workingEndHour}:00:00`);

      // Create slots until we reach the end of working hours
      while (currentDate < endTime) {
        const startTimeStr = format(currentDate, "HH:mm");

        // Only create a slot if there's enough time left in the workday
        const potentialEndTime = addMinutes(currentDate, duration);
        if (potentialEndTime <= endTime) {
          const endTimeStr = format(potentialEndTime, "HH:mm");

          // Create a unique key to avoid duplicate slots
          const slotKey = `${startTimeStr}-${endTimeStr}`;

          if (!slotsSeen.has(slotKey)) {
            slots.push({
              merchant_id: merchantId,
              date: date,
              start_time: startTimeStr,
              end_time: endTimeStr,
              is_booked: false,
              service_duration: duration
            });

            slotsSeen.add(slotKey);
          }
        }

        // Move to the next potential slot (30 minute increments for flexibility)
        currentDate = addMinutes(currentDate, 30);
      }
    }

    // If we have slots to create, insert them
    if (slots.length > 0) {
      const { data, error } = await supabase
        .from("slots")
        .insert(slots)
        .select();

      if (error) throw error;

      console.log(`Created ${data.length} dynamic slots for ${date}`);
      return data;
    }

    return [];
  } catch (error) {
    console.error("Error creating dynamic time slots:", error);
    throw error;
  }
};

// Subscribe to real-time updates for slot availability
export const subscribeToSlotUpdates = (salonId: string, date: string, callback: (payload: any) => void) => {
  const channel = supabase
    .channel('slot-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'slots',
        filter: `merchant_id=eq.${salonId}~and~date=eq.${date}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
