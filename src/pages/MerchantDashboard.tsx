/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MerchantSidebar from '@/components/merchant/MerchantSidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppointmentsList from '@/components/merchant/AppointmentsList';
import DashboardMetrics from '@/components/merchant/DashboardMetrics';
import SlotManager from '@/components/merchant/SlotManager';
import PageTransition from '@/components/transitions/PageTransition';
import { format } from 'date-fns';
import { updateBookingStatus, fetchMerchantSlots } from '@/utils/bookingUtils';

const MerchantDashboard = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const { user, loading } = useAuth();
  const [merchantData, setMerchantData] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication and merchant status on load
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
  useEffect(() => {
    const checkAuth = async () => {
      if (loading) return;

      if (!user) {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate('/merchant-login');
          return;
        }
      }

      // Check merchant status from localStorage or database
      const storedMerchantStatus = window.localStorage.getItem('merchant_status');

      if (storedMerchantStatus === 'pending') {
        navigate('/merchant-pending');
        return;
      } else if (storedMerchantStatus === 'rejected') {
        toast({
          title: "Application Rejected",
          description: "Your merchant application has been rejected. Please contact support.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      loadMerchantData();
    };

    checkAuth();
  }, [user, loading, navigate, toast]);

  // Load merchant data
  const loadMerchantData = async () => {
    setIsLoading(true);

    try {
      if (!user) {
        console.error("No user available to load merchant data");
        return;
      }

      // Load merchant profile data
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', user.id)
        .single();

      if (merchantError) {
        console.error("Error loading merchant data:", merchantError);
        toast({
          title: "Data Error",
          description: "Could not load your merchant profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setMerchantData(merchantData);

      // Load slots data
      const slotsData = await fetchMerchantSlots(user.id);
      setSlots(slotsData);

      // Load bookings data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          user_profile:profiles(username, phone_number)
        `)
        .eq('merchant_id', user.id);

      if (bookingsError) {
        console.error("Error loading bookings data:", bookingsError);
        toast({
          title: "Data Error",
          description: "Could not load your bookings. Please try again.",
          variant: "destructive",
        });
      } else {
        setBookings(bookingsData || []);
      }
    } catch (error: any) {
      console.error("Error in loadMerchantData:", error);
      toast({
        title: "Error",
        description: error.message || "There was an error loading your merchant data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadMerchantData().finally(() => {
      setIsRefreshing(false);
    });
  };

  const handleConfirmAppointment = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, 'confirmed');
      toast({
        title: "Appointment Confirmed",
        description: "The appointment has been confirmed successfully.",
      });
      handleRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm appointment",
        variant: "destructive",
      });
    }
  };

  const handleCancelAppointment = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, 'cancelled');
      toast({
        title: "Appointment Cancelled",
        description: "The appointment has been cancelled successfully.",
      });
      handleRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel appointment",
        variant: "destructive",
      });
    }
  };

  // Process data for components
  const processedAppointments = bookings.map(booking => ({
    id: booking.id,
    customerName: booking.user_profile?.username || 'Unknown User',
    service: booking.service_name,
    date: booking.booking_date,
    time: booking.time_slot,
    duration: `${booking.service_duration || 30} min`,
    status: (booking.status === 'confirmed'
      ? 'confirmed'
      : booking.status === 'cancelled'
        ? 'cancelled'
        : 'pending')
  }));

  const today = new Date().toISOString().split('T')[0];

  const metrics = {
    totalAppointments: bookings.length,
    todayAppointments: bookings.filter(b => b.booking_date === today).length,
    totalClients: [...new Set(bookings.map(b => b.user_id))].length,
    availableSlots: slots.filter(s => !s.is_booked).length
  };

  if (loading || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex h-screen">
        <MerchantSidebar />

        <div className="flex-1 overflow-auto p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
              <p className="text-muted-foreground">
                {merchantData?.business_name && `Welcome, ${merchantData.business_name}`}
              </p>
            </div>
            <div>
              <Button
                onClick={handleLogout}
                variant='outline'
                disabled={isRefreshing}
                style={{backgroundColor: 'red', color: 'white', marginRight: 8}}
              >
                Logout
              </Button>

              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={isRefreshing}
              >
                {isRefreshing ? "Refreshing..." : "Refresh Data"}
              </Button></div>
          </div>

          <Tabs value={activeTab} defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-5 max-w-xl">
              <TabsTrigger value="overview" onClick={() => navigate('/merchant-dashboard?tab=overview')}>Overview</TabsTrigger>
              <TabsTrigger value="appointments" onClick={() => navigate('/merchant-dashboard?tab=appointments')}>Appointments</TabsTrigger>
              <TabsTrigger value="availability" onClick={() => navigate('/merchant-dashboard?tab=availability')}>Availability</TabsTrigger>
              <TabsTrigger value="services" onClick={() => navigate('/merchant-dashboard?tab=services')}>Services</TabsTrigger>
              <TabsTrigger value="settings" onClick={() => navigate('/merchant-dashboard?tab=settings')}>Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <DashboardMetrics
                totalAppointments={metrics.totalAppointments}
                todayAppointments={metrics.todayAppointments}
                totalClients={metrics.totalClients}
                availableSlots={metrics.availableSlots}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                  <h2 className="text-xl font-semibold mb-4">Recent Appointments</h2>
                  <AppointmentsList
                    appointments={processedAppointments.slice(0, 5)}
                    onConfirm={handleConfirmAppointment}
                    onCancel={handleCancelAppointment}
                  />
                </div>

                <div className="lg:col-span-4">
                  <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
                  {/* Display today's appointments */}
                  <div className="bg-muted/50 rounded-lg p-6">
                    {processedAppointments
                      .filter(app => app.date === today)
                      .length > 0 ? (
                      <div className="space-y-2">
                        {processedAppointments
                          .filter(app => app.date === today)
                          .slice(0, 5)
                          .map((app, i) => (
                            <div
                              key={app.id}
                              className={`p-3 rounded-md ${i % 2 === 0 ? 'bg-background' : 'bg-muted'
                                }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{app.customerName}</p>
                                  <p className="text-sm text-muted-foreground">{app.service}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{app.time}</p>
                                  <p className="text-sm text-muted-foreground">{app.duration}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">No appointments today</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appointments">
              <h2 className="text-xl font-semibold mb-4">All Appointments</h2>
              <AppointmentsList
                appointments={processedAppointments}
                onConfirm={handleConfirmAppointment}
                onCancel={handleCancelAppointment}
              />
            </TabsContent>

            <TabsContent value="availability">
              <h2 className="text-xl font-semibold mb-4">Manage Availability</h2>
              <SlotManager
                merchantId={user?.id || ''}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onSlotsUpdated={handleRefresh}
              />
            </TabsContent>

            <TabsContent value="services">
              <h2 className="text-xl font-semibold mb-4">Your Services</h2>
              <p>Service management coming soon...</p>
            </TabsContent>

            <TabsContent value="settings">
              <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
              <p>Settings management coming soon...</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
};

export default MerchantDashboard;