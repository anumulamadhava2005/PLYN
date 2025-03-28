
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Helmet } from 'react-helmet';
import MerchantSidebar from '@/components/merchant/MerchantSidebar';
import { DashboardMetrics } from '@/components/merchant/DashboardMetrics';
import { AppointmentsList } from '@/components/merchant/AppointmentsList';
import { WorkingHoursGrid } from '@/components/merchant/WorkingHoursGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import PageTransition from '@/components/transitions/PageTransition';

// Define the missing BookingData type
interface BookingData {
  id: string;
  user_id: string;
  merchant_id: string;
  slot_id: string;
  service_name: string;
  booking_date?: string;
  time_slot?: string;
  service_duration?: number;
  status: string;
  user_profile?: {
    username: string;
    phone_number?: string;
  };
  slot?: {
    date: string;
    start_time: string;
    end_time: string;
  };
}

const MerchantDashboard = () => {
  const { user, userProfile, isMerchant } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const [merchantData, setMerchantData] = useState<any>(null);
  const [merchantStatus, setMerchantStatus] = useState<string | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({
    date: '',
    startTime: '',
    endTime: '',
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });

      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Logout Failed",
        description: error.message || "An error occurred while logging out.",
        variant: "destructive",
      });
    }
  };

  const processedAppointments = useMemo(() => {
    return bookings.map(booking => ({
      id: booking.id,
      customerName: booking.user_profile?.username || 'Unknown User',
      service: booking.service_name,
      date: booking.booking_date,
      time: booking.time_slot,
      duration: `${booking.service_duration} min`,
      // Convert the string status to the expected union type
      status: (booking.status === 'confirmed'
        ? 'confirmed'
        : booking.status === 'cancelled'
          ? 'cancelled'
          : 'pending') as 'pending' | 'confirmed' | 'cancelled'
    }));
  }, [bookings]);

  const processedSlots = useMemo(() => {
    return slots.map(slot => ({
      id: slot.id,
      day: new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short' }),
      time: slot.start_time,
      // Fix the status type to match the expected union type
      status: slot.is_booked ? 'booked' : 'available' as 'available' | 'booked' | 'unavailable'
    }));
  }, [slots]);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return {
      totalAppointments: bookings.length,
      todayAppointments: bookings.filter(b => b.booking_date === today).length,
      totalClients: [...new Set(bookings.map(b => b.user_id))].length,
      availableSlots: slots.filter(s => !s.is_booked).length
    };
  }, [bookings, slots]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }
      console.log(isMerchant);

      if (user && !isMerchant) {
        toast({
          title: "Access Denied",
          description: "This page is only available to merchant accounts.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      if (user && isMerchant) {
        // Check if merchant is approved
        try {
          const { data: merchantData, error } = await supabase
            .from('merchants')
            .select('status')
            .eq('id', user.id)
            .single();

          if (error) throw error;

          setMerchantStatus(merchantData?.status || null);

          if (merchantData?.status !== 'approved') {
            toast({
              title: "Access Restricted",
              description: "Your merchant account has not been approved yet.",
              variant: "destructive",
            });
            navigate('/merchant-pending');
            return;
          }

          loadMerchantData();
        } catch (error) {
          console.error("Error checking merchant status:", error);
          toast({
            title: "Error",
            description: "Failed to verify merchant status. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    checkAuth();
  }, [user, isMerchant, navigate]);

  const loadMerchantData = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', user.id)
        .single();

      if (merchantError) {
        throw merchantError;
      }

      if (merchantData) {
        setMerchantData(merchantData);

        const { data: slotsData, error: slotsError } = await supabase
          .from('slots')
          .select('*')
          .eq('merchant_id', user.id)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (slotsError) {
          throw slotsError;
        }

        setSlots(slotsData || []);

        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('merchant_id', user.id);

        if (bookingsError) {
          throw bookingsError;
        }

        const enhancedBookings: BookingData[] = [];

        for (const booking of bookingsData || []) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, phone_number')
            .eq('id', booking.user_id)
            .single();

          const { data: slotData } = await supabase
            .from('slots')
            .select('date, start_time, end_time')
            .eq('id', booking.slot_id)
            .single();

          enhancedBookings.push({
            ...booking,
            user_profile: profileData || { username: 'Unknown User' },
            slot: slotData || undefined
          });
        }

        setBookings(enhancedBookings);
      } else {
        toast({
          title: "Complete Your Profile",
          description: "Please complete your merchant profile first.",
        });
        navigate('/merchant-signup');
      }
    } catch (error: any) {
      console.error('Error loading merchant data:', error);
      toast({
        title: "Failed to Load Data",
        description: error.message || "An error occurred while loading your merchant dashboard.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSlotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSlot(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateSlot = async () => {
    if (!user || !merchantData) return;

    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      toast({
        title: "Missing Information",
        description: "Please provide all required slot details.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('slots')
        .insert({
          merchant_id: user.id,
          date: newSlot.date,
          start_time: newSlot.startTime,
          end_time: newSlot.endTime,
          is_booked: false
        })
        .select();

      if (error) {
        throw error;
      }

      if (data) {
        setSlots(prev => [...prev, data[0]]);
        setNewSlot({
          date: '',
          startTime: '',
          endTime: '',
        });

        toast({
          title: "Slot Created",
          description: "Your new availability slot has been added.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to Create Slot",
        description: error.message || "An error occurred while creating the slot.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        throw error;
      }

      setBookings(prev =>
        prev.map(booking =>
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        )
      );

      toast({
        title: "Booking Updated",
        description: `Booking status updated to ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Update Booking",
        description: error.message || "An error occurred while updating the booking.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const timeParts = timeString.split(':');
    let hour = parseInt(timeParts[0]);
    const min = timeParts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12; // Convert 0 to 12
    return `${hour}:${min} ${ampm}`;
  };

  // if (isLoading) {
  //   return (
  //     <PageTransition>
  //       <div className="min-h-screen flex flex-col">
  //         <div className="flex-grow pt-24 pb-12 px-4 flex items-center justify-center">
  //           <div className="text-center">
  //             <div className="animate-spin mb-4 mx-auto h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
  //             <p>Loading your merchant dashboard...</p>
  //           </div>
  //         </div>
  //       </div>
  //     </PageTransition>
  //   );
  // }

  if (merchantStatus && merchantStatus !== 'approved') {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col">
          <div className="flex-grow pt-24 pb-12 px-4 flex items-center justify-center">
            <div className="text-center max-w-md">
              <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold mb-4">Account Pending Approval</h2>
              <p className="mb-6">Your merchant account is currently {merchantStatus}. You'll gain access to the dashboard once approved by an administrator.</p>
              <Button onClick={() => navigate('/')}>Return to Home</Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Helmet>
        <title>Merchant Dashboard | PLYN</title>
      </Helmet>
      <div className="flex h-screen bg-black text-white overflow-hidden">
        <MerchantSidebar />

        <div className="flex-1 overflow-auto bg-gradient-to-br from-black to-gray-900">
          <div className="p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Merchant Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {userProfile?.username || 'Merchant'}
              </p>
            </div>

            <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
              Logout
            </Button>

            <Button className="bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Appointment
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <DashboardMetrics
              totalAppointments={metrics.totalAppointments}
              todayAppointments={metrics.todayAppointments}
              totalClients={metrics.totalClients}
              availableSlots={metrics.availableSlots}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppointmentsList
                appointments={processedAppointments}
                onUpdateStatus={handleUpdateBookingStatus}
              />

              <WorkingHoursGrid
                slots={processedSlots}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default MerchantDashboard;
