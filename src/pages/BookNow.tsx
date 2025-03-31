import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageTransition from '@/components/transitions/PageTransition';
import SalonCard from '@/components/booking/SalonCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MapPin, Search, Filter, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface Salon {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  address: string;
  distance: string;
  image_url: string;
  services: {
    name: string;
    price: number;
    duration: number;
  }[];
  opening_time: string;
  closing_time: string;
  featured: boolean;
  type: 'men' | 'women' | 'unisex';
}

const BookNow = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [distance, setDistance] = useState([5]);
  const [salonType, setSalonType] = useState("all");
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [allSalons, setAllSalons] = useState<Salon[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    setIsLoading(true);
    try {
      // Fetch salons from merchants table
      const { data: merchants, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('status', 'approved');

      if (error) {
        throw error;
      }

      if (merchants) {
        // Transform merchant data to salon format
        const salons: Salon[] = merchants.map(merchant => {
          // Generate random services for each salon
          // In a real app, you'd have a services table related to merchants
          const services = generateRandomServices(merchant.service_category);
          
          return {
            id: merchant.id,
            name: merchant.business_name,
            rating: (4 + Math.random()).toFixed(1), // Random rating between 4.0 and 5.0
            review_count: Math.floor(Math.random() * 300) + 50, // Random review count
            address: merchant.business_address,
            distance: (Math.random() * 5).toFixed(1) + " mi", // Random distance
            image_url: getRandomSalonImage(merchant.service_category),
            services: services,
            opening_time: "9:00 AM", // Default
            closing_time: "7:00 PM", // Default
            featured: Math.random() > 0.7, // 30% chance of being featured
            type: getSalonType(merchant.service_category)
          };
        });

        setAllSalons(salons);
        setFilteredSalons(salons);
      }
    } catch (error) {
      console.error('Error fetching salons:', error);
      toast.error("Failed to load salons. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate random services based on salon type
  const generateRandomServices = (category: string) => {
    const services = [];
    const serviceCount = Math.floor(Math.random() * 3) + 3; // 3-5 services
    
    if (category.toLowerCase().includes('barber') || category.toLowerCase().includes('men')) {
      services.push({ name: "Men's Haircut", price: 30 + Math.floor(Math.random() * 20), duration: 30 });
      services.push({ name: "Beard Trim", price: 15 + Math.floor(Math.random() * 10), duration: 15 });
      if (serviceCount > 2) services.push({ name: "Hair Wash & Style", price: 20 + Math.floor(Math.random() * 10), duration: 20 });
      if (serviceCount > 3) services.push({ name: "Hot Towel Shave", price: 25 + Math.floor(Math.random() * 15), duration: 25 });
      if (serviceCount > 4) services.push({ name: "Hair Coloring", price: 40 + Math.floor(Math.random() * 30), duration: 60 });
    } else if (category.toLowerCase().includes('salon') || category.toLowerCase().includes('women')) {
      services.push({ name: "Women's Haircut", price: 45 + Math.floor(Math.random() * 30), duration: 45 });
      services.push({ name: "Blow Dry & Style", price: 35 + Math.floor(Math.random() * 15), duration: 30 });
      if (serviceCount > 2) services.push({ name: "Hair Coloring", price: 80 + Math.floor(Math.random() * 40), duration: 90 });
      if (serviceCount > 3) services.push({ name: "Deep Conditioning", price: 30 + Math.floor(Math.random() * 15), duration: 30 });
      if (serviceCount > 4) services.push({ name: "Manicure", price: 25 + Math.floor(Math.random() * 15), duration: 45 });
    } else {
      // Unisex or other categories
      services.push({ name: "Haircut", price: 40 + Math.floor(Math.random() * 20), duration: 40 });
      services.push({ name: "Styling", price: 30 + Math.floor(Math.random() * 15), duration: 30 });
      if (serviceCount > 2) services.push({ name: "Color Treatment", price: 70 + Math.floor(Math.random() * 30), duration: 90 });
      if (serviceCount > 3) services.push({ name: "Hair Treatment", price: 50 + Math.floor(Math.random() * 20), duration: 60 });
      if (serviceCount > 4) services.push({ name: "Kid's Haircut", price: 20 + Math.floor(Math.random() * 10), duration: 20 });
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

  const handleSearch = () => {
    let results = [...allSalons];
    
    // Filter by search term
    if (searchTerm) {
      results = results.filter(salon => 
        salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salon.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salon.services.some(service => service.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filter by distance
    results = results.filter(salon => {
      const salonDistance = parseFloat(salon.distance.replace(" mi", ""));
      return salonDistance <= distance[0];
    });
    
    // Filter by salon type
    if (salonType !== "all") {
      results = results.filter(salon => salon.type === salonType);
    }
    
    setFilteredSalons(results);
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow pt-20">
          {/* Hero Section */}
          <section className="bg-gradient-to-r from-salon-men/5 to-salon-women/5 dark:from-salon-men-light/5 dark:to-salon-women-light/5 py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl md:text-4xl font-bold mb-4 gradient-heading"
                >
                  Find and Book the Perfect Salon
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-muted-foreground mb-8"
                >
                  Discover nearby salons with real-time availability and instant booking
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="relative"
                >
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-grow">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        type="text" 
                        placeholder="Search by salon, service, or location"
                        className="pl-10 h-12 rounded-lg bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <AnimatedButton
                      variant="gradient"
                      size="lg"
                      className="md:w-auto"
                      onClick={handleSearch}
                      icon={<Search className="w-4 h-4" />}
                    >
                      Search
                    </AnimatedButton>
                    <AnimatedButton
                      variant="outline"
                      size="icon"
                      className="md:w-12 h-12"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="w-5 h-5" />
                    </AnimatedButton>
                  </div>
                  
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 p-4 bg-background dark:bg-dark-card border border-border rounded-lg shadow-lg"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="mb-2 block">Distance (miles)</Label>
                          <div className="flex flex-col space-y-2">
                            <Slider
                              value={distance}
                              min={1}
                              max={10}
                              step={0.5}
                              onValueChange={setDistance}
                            />
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>1 mi</span>
                              <span>{distance[0]} mi</span>
                              <span>10 mi</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="mb-2 block">Salon Type</Label>
                          <RadioGroup 
                            value={salonType} 
                            onValueChange={setSalonType}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value="all" 
                                id="all"
                                className="text-primary"
                              />
                              <Label htmlFor="all">All</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value="men" 
                                id="men"
                                className="text-salon-men dark:text-salon-men-light"
                              />
                              <Label htmlFor="men">Men</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value="women" 
                                id="women"
                                className="text-salon-women dark:text-salon-women-light"
                              />
                              <Label htmlFor="women">Women</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value="unisex" 
                                id="unisex"
                              />
                              <Label htmlFor="unisex">Unisex</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <AnimatedButton
                          variant="default"
                          size="sm"
                          onClick={handleSearch}
                        >
                          Apply Filters
                        </AnimatedButton>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>
          </section>
          
          {/* Salon Listings */}
          <section className="py-12 px-4">
            <div className="container mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">
                  {isLoading ? 'Loading Salons...' : `${filteredSalons.length} Salons Available`}
                </h2>
                <div className="text-sm text-muted-foreground">
                  Showing results within {distance[0]} miles
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSalons.map((salon, index) => (
                    <motion.div
                      key={salon.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <SalonCard
                        id={salon.id}
                        name={salon.name}
                        rating={salon.rating}
                        reviewCount={salon.review_count}
                        address={salon.address}
                        distance={salon.distance}
                        image={salon.image_url}
                        services={salon.services}
                        openingTime={salon.opening_time}
                        closingTime={salon.closing_time}
                        featured={salon.featured}
                        type={salon.type}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
              
              {!isLoading && filteredSalons.length === 0 && (
                <div className="text-center py-16">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-4"
                  >
                    <Search className="w-16 h-16 mx-auto text-muted-foreground" />
                  </motion.div>
                  <h3 className="text-xl font-medium mb-2">No salons found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search criteria or expanding the distance
                  </p>
                  <AnimatedButton
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setDistance([5]);
                      setSalonType("all");
                      setFilteredSalons(allSalons);
                    }}
                  >
                    Reset Search
                  </AnimatedButton>
                </div>
              )}
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default BookNow;
