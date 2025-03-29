/* eslint-disable @typescript-eslint/no-explicit-any */

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
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SlotManager from '@/components/merchant/SlotManager';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeView, setActiveView] = useState<'view' | 'create'>('view');
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
    // Filter slots for the selected date
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const filteredSlots = slots.filter(slot => slot.date === formattedDate);

    return filteredSlots.map(slot => ({
      id: slot.id,
      day: new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short' }),
      time: slot.start_time,
      // Fix the status type to match the expected union type
      status: slot.is_booked ? 'booked' : 'available' as 'available' | 'booked' | 'unavailable'
    }));
  }, [slots, selectedDate]);

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
        await loadSlotsForDate(selectedDate);
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


  const loadSlotsForDate = React.useCallback(async (date: Date) => {
    if (!user) return;

    try {
      setIsRefreshing(true);
      const formattedDate = format(date, 'yyyy-MM-dd');

      const { data: slotsData, error: slotsError } = await supabase
        .from('slots')
        .select('*')
        .eq('merchant_id', user.id)
        .eq('date', formattedDate)
        .order('start_time', { ascending: true });

      if (slotsError) {
        throw slotsError;
      }

      // Update slots state with the filtered data
      setSlots(prevSlots => {
        // Remove slots for this date and add the new ones
        const otherSlots = prevSlots.filter(slot => slot.date !== formattedDate);
        return [...otherSlots, ...(slotsData || [])];
      });
    } catch (error: any) {
      console.error('Error loading slots:', error);
      toast({
        title: "Failed to Load Slots",
        description: error.message || "An error occurred while loading slots.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [user, toast]);


  // When selected date changes, load slots for that date
  useEffect(() => {
    if (user && merchantData) {
      loadSlotsForDate(selectedDate);
    }
  }, [selectedDate, user, merchantData, loadSlotsForDate]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleNewSlotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSlots(prev => ({
      ...prev,
      [name]: value
    }));
  };


  // Handle refresh slots button click
  const handleRefreshSlots = () => {
    loadSlotsForDate(selectedDate);
  };
  // Handle slot creation completion
  const handleSlotsUpdated = () => {
    loadSlotsForDate(selectedDate);
    setActiveView('view');
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

              <div>
                <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'view' | 'create')}>
                  <div className="flex justify-between items-center mb-4">
                    <TabsList>
                      <TabsTrigger value="view">View Slots</TabsTrigger>
                      <TabsTrigger value="create">Create Slots</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="view" className="mt-0">
                    <WorkingHoursGrid
                      slots={processedSlots}
                      selectedDate={selectedDate}
                      onDateChange={handleDateChange}
                      onRefresh={handleRefreshSlots}
                      isLoading={isRefreshing}
                    />
                  </TabsContent>

                  <TabsContent value="create" className="mt-0">
                    <SlotManager
                      merchantId={user?.id || ''}
                      onSlotsUpdated={handleSlotsUpdated}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default MerchantDashboard;
