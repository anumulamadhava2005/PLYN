import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ServiceSelector from '@/components/booking/ServiceSelector';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageTransition from '@/components/transitions/PageTransition';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface Salon {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  distance: string;
  image: string;
  description: string;
  services: {
    id: string;
    name: string;
    price: number;
    duration: number;
    description: string;
  }[];
  openingTime: string;
  closingTime: string;
  type: 'men' | 'women' | 'unisex';
}

const SalonDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const { user } = useAuth();
  
  const [salon, setSalon] = useState<Salon | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchSalonDetails();
    }
  }, [id]);
  
  const fetchSalonDetails = async () => {
    setLoading(true);
    try {
      // Fetch merchant data from Supabase
      const { data: merchantData, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!merchantData) {
        toast.error("Salon not found");
        navigate('/book-now');
        return;
      }
      
      // Transform merchant data to salon format with required fields
      const salonData: Salon = {
        id: merchantData.id,
        name: merchantData.business_name,
        rating: (4 + Math.random()).toFixed(1) as unknown as number, // Random rating between 4.0 and 5.0
        reviewCount: Math.floor(Math.random() * 300) + 50, // Random review count
        address: merchantData.business_address,
        distance: (Math.random() * 5).toFixed(1) + " mi", // Random distance
        image: getRandomSalonImage(merchantData.service_category),
        description: `${merchantData.business_name} is a premium salon offering top-notch services. Our skilled professionals provide expert services in a stylish and relaxed environment.`,
        services: generateRandomServices(merchantData.service_category),
        openingTime: "9:00 AM", // Default
        closingTime: "7:00 PM", // Default
        type: getSalonType(merchantData.service_category)
      };
      
      setSalon(salonData);
    } catch (error) {
      console.error('Error fetching salon details:', error);
      toast.error("Failed to load salon details");
      navigate('/book-now');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to generate random services based on salon type
  const generateRandomServices = (category: string) => {
    const services = [];
    const serviceCount = Math.floor(Math.random() * 3) + 3; // 3-5 services
    
    if (category.toLowerCase().includes('barber') || category.toLowerCase().includes('men')) {
      services.push({ id: "s1", name: "Men's Haircut", price: 30 + Math.floor(Math.random() * 20), duration: 30, description: "Classic or modern haircut tailored to your style" });
      services.push({ id: "s2", name: "Beard Trim", price: 15 + Math.floor(Math.random() * 10), duration: 15, description: "Precise beard trimming and shaping" });
      if (serviceCount > 2) services.push({ id: "s3", name: "Hair Wash & Style", price: 20 + Math.floor(Math.random() * 10), duration: 20, description: "Thorough wash with styling" });
      if (serviceCount > 3) services.push({ id: "s4", name: "Hot Towel Shave", price: 25 + Math.floor(Math.random() * 15), duration: 25, description: "Traditional hot towel shave for a smooth finish" });
      if (serviceCount > 4) services.push({ id: "s5", name: "Hair Coloring", price: 40 + Math.floor(Math.random() * 30), duration: 60, description: "Professional hair coloring services" });
    } else if (category.toLowerCase().includes('salon') || category.toLowerCase().includes('women')) {
      services.push({ id: "s6", name: "Women's Haircut", price: 45 + Math.floor(Math.random() * 30), duration: 45, description: "Precision cut with style consultation" });
      services.push({ id: "s7", name: "Blow Dry & Style", price: 35 + Math.floor(Math.random() * 15), duration: 30, description: "Professional blow dry with styling" });
      if (serviceCount > 2) services.push({ id: "s8", name: "Hair Coloring", price: 80 + Math.floor(Math.random() * 40), duration: 90, description: "Full hair coloring with premium products" });
      if (serviceCount > 3) services.push({ id: "s9", name: "Deep Conditioning", price: 30 + Math.floor(Math.random() * 15), duration: 30, description: "Intensive hair treatment for damaged hair" });
      if (serviceCount > 4) services.push({ id: "s10", name: "Manicure", price: 25 + Math.floor(Math.random() * 15), duration: 45, description: "Classic manicure with polish" });
    } else {
      // Unisex or other categories
      services.push({ id: "s11", name: "Haircut", price: 40 + Math.floor(Math.random() * 20), duration: 40, description: "Expert cut for all hair types" });
      services.push({ id: "s12", name: "Styling", price: 30 + Math.floor(Math.random() * 15), duration: 30, description: "Professional styling without cutting" });
      if (serviceCount > 2) services.push({ id: "s13", name: "Color Treatment", price: 70 + Math.floor(Math.random() * 30), duration: 90, description: "Professional color service" });
      if (serviceCount > 3) services.push({ id: "s14", name: "Hair Treatment", price: 50 + Math.floor(Math.random() * 20), duration: 60, description: "Nourishing hair treatment" });
      if (serviceCount > 4) services.push({ id: "s15", name: "Kid's Haircut", price: 20 + Math.floor(Math.random() * 10), duration: 20, description: "Gentle haircuts for children" });
    }
    
    return services;
  };

  // Helper function to get salon type based on service category
  const getSalonType = (category: string): 'men' | 'women' | 'unisex' => {
    if (category.toLowerCase().includes('barber') || category.toLowerCase().includes('men')) {
      return 'men';
    } else if (category.toLowerCase().includes('women')) {
      return 'women';
    } else {
      return 'unisex';
    }
  };

  // Helper function to get random salon image
  const getRandomSalonImage = (category: string) => {
    const menSalonImages = [
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
    ];
    
    const womenSalonImages = [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
    ];
    
    const unisexSalonImages = [
      "https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500840216050-6ffa99d75160?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
    ];
    
    if (category.toLowerCase().includes('barber') || category.toLowerCase().includes('men')) {
      return menSalonImages[Math.floor(Math.random() * menSalonImages.length)];
    } else if (category.toLowerCase().includes('women')) {
      return womenSalonImages[Math.floor(Math.random() * womenSalonImages.length)];
    } else {
      return unisexSalonImages[Math.floor(Math.random() * unisexSalonImages.length)];
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 9;
    const endHour = 19;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push({
          id: `slot-${hour}-${minute}`,
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          available: Math.random() > 0.3
        });
      }
    }
    
    return slots;
  };
  
  useEffect(() => {
    if (selectedDate) {
      setFetchingSlots(true);
      setTimeout(() => {
        setTimeSlots(generateTimeSlots());
        setFetchingSlots(false);
      }, 500);
    }
  }, [selectedDate]);
  
  const handleServiceToggle = (selectedIds: string[]) => {
    setSelectedServices(selectedIds);
  };
  
  const handleTimeSlotSelect = (slotId: string) => {
    setSelectedSlot(slotId);
  };
  
  const calculateTotalPrice = () => {
    if (!salon) return 0;
    return salon.services
      .filter((service) => selectedServices.includes(service.id))
      .reduce((total, service) => total + service.price, 0);
  };
  
  const calculateTotalDuration = () => {
    if (!salon) return 0;
    return salon.services
      .filter((service) => selectedServices.includes(service.id))
      .reduce((total, service) => total + service.duration, 0);
  };
  
  const handleProceedToPayment = async () => {
    if (!user) {
      uiToast({
        title: "Authentication Required",
        description: "Please sign in to book an appointment.",
        variant: "destructive",
      });
      navigate('/auth', { state: { redirectTo: `/book/${id}` } });
      return;
    }
    
    if (selectedServices.length === 0) {
      uiToast({
        title: "No Services Selected",
        description: "Please select at least one service to proceed.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedSlot) {
      uiToast({
        title: "No Time Slot Selected",
        description: "Please select a time slot for your appointment.",
        variant: "destructive",
      });
      return;
    }

    navigate(`/payment`, { 
      state: { 
        salonId: id,
        salonName: salon?.name,
        services: selectedServices.map(serviceId => 
          salon?.services.find((s) => s.id === serviceId)
        ),
        date: selectedDate,
        timeSlot: timeSlots.find((slot) => slot.id === selectedSlot)?.time,
        totalPrice: calculateTotalPrice(),
        totalDuration: calculateTotalDuration()
      } 
    });
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow pt-20 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </main>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  if (!salon) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow pt-20 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Salon Not Found</h2>
              <p className="text-muted-foreground mb-6">We couldn't find the salon you're looking for.</p>
              <AnimatedButton variant="default" onClick={() => navigate('/book-now')}>
                Browse Salons
              </AnimatedButton>
            </div>
          </main>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow pt-20">
          <section className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
            <div className="absolute inset-0">
              <img 
                src={salon.image} 
                alt={salon.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-white max-w-3xl"
                >
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{salon.name}</h1>
                  <div className="flex items-center mb-4">
                    <div className="bg-yellow-400 text-yellow-900 rounded px-2 py-0.5 text-sm font-semibold mr-2">
                      {typeof salon.rating === 'number' ? salon.rating.toFixed(1) : salon.rating}
                    </div>
                    <span className="text-sm">({salon.reviewCount} reviews)</span>
                  </div>
                  <p className="text-sm md:text-base opacity-90">{salon.address}</p>
                </motion.div>
              </div>
            </div>
          </section>
          
          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="glass-card p-6 rounded-lg mb-6"
                  >
                    <h2 className="text-xl font-semibold mb-4">About {salon.name}</h2>
                    <p className="text-muted-foreground mb-4">{salon.description}</p>
                    
                    <div className="border-t border-border pt-4 mt-4">
                      <div className="flex items-start mb-3">
                        <Clock className="w-5 h-5 mr-2 mt-0.5 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">Business Hours</h3>
                          <p className="text-sm text-muted-foreground">
                            {salon.openingTime} - {salon.closingTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="sticky top-28"
                  >
                    <div className="glass-card p-6 rounded-lg">
                      <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
                      
                      {selectedServices.length > 0 ? (
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium mb-2">Selected Services</h3>
                            <ul className="space-y-2">
                              {salon.services
                                .filter((service) => selectedServices.includes(service.id))
                                .map((service) => (
                                  <li key={service.id} className="flex justify-between text-sm">
                                    <span>{service.name}</span>
                                    <span className="font-medium">${service.price}</span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                          
                          <div className="border-t border-border pt-4">
                            <div className="flex justify-between">
                              <span className="font-medium">Total</span>
                              <span className="font-bold">${calculateTotalPrice()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground mt-1">
                              <span>Duration</span>
                              <span>{calculateTotalDuration()} min</span>
                            </div>
                          </div>
                          
                          <AnimatedButton
                            variant={salon.type === 'men' ? 'men' : 'women'}
                            className="w-full"
                            onClick={handleProceedToPayment}
                          >
                            Proceed to Payment
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </AnimatedButton>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          <p>Select services to see booking summary</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
                
                <div className="lg:col-span-2">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="glass-card p-6 rounded-lg mb-6"
                  >
                    <h2 className="text-xl font-semibold mb-4">Select Services</h2>
                    <ServiceSelector
                      services={salon.services}
                      selectedServices={selectedServices}
                      onChange={handleServiceToggle}
                      salonType={salon.type}
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="glass-card p-6 rounded-lg"
                  >
                    <h2 className="text-xl font-semibold mb-4">Select Date & Time</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium mb-3">Date</h3>
                        <div className="bg-background/40 rounded-lg p-3">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className={cn(
                                  "w-full flex items-center justify-between p-3 rounded-md border",
                                  "text-left font-normal",
                                  "focus:outline-none focus:ring-2 focus:ring-primary"
                                )}
                              >
                                {selectedDate ? (
                                  format(selectedDate, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="h-4 w-4 opacity-50" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => 
                                  date < new Date() || 
                                  date > new Date(new Date().setDate(new Date().getDate() + 30))
                                }
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-3">Time</h3>
                        <div className="bg-background/40 rounded-lg p-3 max-h-64 overflow-y-auto">
                          {fetchingSlots ? (
                            <div className="flex justify-center py-8">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {timeSlots.map((slot) => (
                                <button
                                  key={slot.id}
                                  onClick={() => slot.available && handleTimeSlotSelect(slot.id)}
                                  className={cn(
                                    "p-2 rounded-md text-sm flex items-center justify-center",
                                    slot.available ? (
                                      selectedSlot === slot.id
                                        ? salon.type === 'men'
                                          ? "bg-salon-men text-white"
                                          : "bg-salon-women text-white"
                                        : "border hover:border-primary"
                                    ) : "bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
                                  )}
                                  disabled={!slot.available}
                                >
                                  {slot.time}
                                  {selectedSlot === slot.id && (
                                    <CheckCircle className="ml-1 h-3 w-3" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default SalonDetails;
