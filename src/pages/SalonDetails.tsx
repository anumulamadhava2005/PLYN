/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, Phone, Mail, Star, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/context/AuthContext';
import { showBookingSuccessNotification } from '@/components/booking/BookingSuccessNotification';
import PageTransition from '@/components/transitions/PageTransition';

const SalonDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [salon, setSalon] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  
  useEffect(() => {
    if (id) {
      fetchSalonDetails();
    }
  }, [id]);
  
  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedService, selectedDate]);
  
  const fetchSalonDetails = async () => {
    try {
      setIsLoading(true);
      
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', id)
        .single();
        
      if (merchantError) throw merchantError;
      
      setSalon(merchantData);
      
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('merchant_id', id);
        
      if (servicesError) throw servicesError;
      
      setServices(servicesData || []);
    } catch (error: any) {
      console.error('Error fetching salon details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load salon details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchAvailableSlots = async () => {
    if (!id || !selectedDate || !selectedService) return;
    
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .eq('merchant_id', id)
        .eq('date', formattedDate)
        .eq('is_booked', false);
        
      if (error) throw error;
      
      setAvailableSlots(data || []);
    } catch (error: any) {
      console.error('Error fetching available slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available time slots.',
        variant: 'destructive',
      });
    }
  };
  
  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    setSelectedSlot(null);
    setActiveTab('booking');
  };
  
  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot);
  };
  
  const handleBookAppointment = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to book an appointment.',
        variant: 'default',
      });
      navigate('/login', { state: { from: `/salon/${id}` } });
      return;
    }
    
    if (!selectedService || !selectedSlot) {
      toast({
        title: 'Incomplete Booking',
        description: 'Please select a service and time slot.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsBooking(true);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          user_profile_id: profileData.id,
          merchant_id: id || '',
          salon_id: id || '',
          salon_name: salon.business_name,
          service_name: selectedService.name,
          service_price: String(selectedService.price),
          service_duration: selectedService.duration,
          slot_id: selectedSlot.id,
          booking_date: selectedSlot.date,
          time_slot: selectedSlot.start_time,
          status: 'pending',
          coins_earned: 0,
          coins_used: 0
        })
        .select()
        .single();
        
      if (bookingError) throw bookingError;
      
      const { error: slotError } = await supabase
        .from('slots')
        .update({ is_booked: true })
        .eq('id', selectedSlot.id);
        
      if (slotError) throw slotError;
      
      showBookingSuccessNotification({
        salonName: salon.business_name,
        serviceName: selectedService.name,
        date: format(new Date(selectedSlot.date), 'MMMM d, yyyy'),
        time: selectedSlot.start_time,
        services: [{ name: selectedService.name, price: selectedService.price }],
        totalPrice: selectedService.price
      });
      
      setSelectedService(null);
      setSelectedSlot(null);
      
      navigate('/bookings');
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      toast({
        title: 'Booking Failed',
        description: error.message || 'Failed to book appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsBooking(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full mx-auto mb-4"></div>
          <p>Loading salon details...</p>
        </div>
      </div>
    );
  }
  
  if (!salon) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Salon Not Found</h1>
        <p className="mb-6">The salon you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }
  
  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{salon.business_name}</CardTitle>
                  <CardDescription className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {salon.business_address}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{salon.business_phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>{salon.business_email}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-500" />
                      <span>4.8 (120 reviews)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <div className="mt-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="services">Services</TabsTrigger>
                  <TabsTrigger value="booking" disabled={!selectedService}>Booking</TabsTrigger>
                </TabsList>
                
                <TabsContent value="services" className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Available Services</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {services.length > 0 ? (
                      services.map((service) => (
                        <Card key={service.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>{service.name}</CardTitle>
                                <CardDescription className="mt-1">{service.description}</CardDescription>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold">${String(service.price)}</span>
                                <p className="text-sm text-muted-foreground">{service.duration} min</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardFooter className="pt-2">
                            <Button 
                              onClick={() => handleServiceSelect(service)}
                              className="w-full"
                            >
                              Book Now
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No services available at the moment.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="booking" className="mt-6">
                  {selectedService && (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Selected Service</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{selectedService.name}</h3>
                              <p className="text-sm text-muted-foreground">{selectedService.duration} minutes</p>
                            </div>
                            <div>
                              <span className="text-lg font-bold">${String(selectedService.price)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Select Date</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                              disabled={(date) => 
                                date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                                date > new Date(new Date().setMonth(new Date().getMonth() + 2))
                              }
                              className="rounded-md border"
                            />
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Available Time Slots</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {availableSlots.length > 0 ? (
                              <div className="grid grid-cols-2 gap-2">
                                {availableSlots.map((slot) => (
                                  <Button
                                    key={slot.id}
                                    variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                                    className="justify-start"
                                    onClick={() => handleSlotSelect(slot)}
                                  >
                                    <Clock className="mr-2 h-4 w-4" />
                                    {slot.start_time}
                                  </Button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">No available slots for the selected date.</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        size="lg"
                        disabled={!selectedSlot || isBooking}
                        onClick={handleBookAppointment}
                      >
                        {isBooking ? "Processing..." : "Book Appointment"}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>About {salon.business_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {salon.business_name} is a premier salon offering a wide range of beauty and wellness services. 
                  Our experienced professionals are dedicated to providing exceptional service in a relaxing environment.
                </p>
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Business Hours</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>9:00 AM - 5:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Saturday</span>
                      <span>10:00 AM - 4:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Map view coming soon</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {salon.business_address}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default SalonDetails;
