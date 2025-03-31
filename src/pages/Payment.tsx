/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, Coins } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageTransition from '@/components/transitions/PageTransition';
import { useAuth } from '@/context/AuthContext';
import { 
  createBooking, 
  createPayment, 
  checkSlotAvailability, 
  bookSlot, 
  initializeDatabase,
  updateUserCoins,
  getUserCoins
} from '@/utils/bookingUtils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { showBookingSuccessNotification } from '@/components/booking/BookingSuccessNotification';
import BookingSummary from '@/components/payment/BookingSummary';
import PaymentForm, { PaymentFormValues } from '@/components/payment/PaymentForm';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [userCoins, setUserCoins] = useState(0);
  const [useCoins, setUseCoins] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState("credit_card");

  const bookingData = location.state;
  
  useEffect(() => {
    const initDb = async () => {
      if (process.env.NODE_ENV === 'development') {
        try {
          const result = await initializeDatabase();
          console.log('Database initialization result:', result);
        } catch (error) {
          console.error('Failed to initialize database:', error);
        }
      }
    };
    
    initDb();
  }, []);

  useEffect(() => {
    const fetchUserCoins = async () => {
      if (user) {
        try {
          const coins = await getUserCoins(user.id);
          setUserCoins(coins);
          console.log('User coins:', coins);
        } catch (error) {
          console.error('Failed to fetch user coins:', error);
        }
      }
    };

    fetchUserCoins();
  }, [user]);

  useEffect(() => {
    if (bookingData && userCoins > 0) {
      const maxCoinsForPayment = Math.min(userCoins, bookingData.totalPrice * 2);
      setCoinsToUse(useCoins ? maxCoinsForPayment : 0);
    }
  }, [useCoins, userCoins, bookingData]);
  
  if (!bookingData) {
    navigate('/book-now');
    return null;
  }
  
  const defaultValues = {
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    phone: userProfile?.phoneNumber || "",
    email: user?.email || "",
    paymentMethod: "credit_card",
    notes: "",
  };

  const getAmountAfterCoins = () => {
    if (!useCoins || coinsToUse <= 0) return bookingData.totalPrice;
    
    const coinValueInDollars = coinsToUse / 2;
    return Math.max(0, bookingData.totalPrice - coinValueInDollars);
  };

  const getCoinsToEarn = () => {
    const paymentAmount = getAmountAfterCoins();
    return currentPaymentMethod === 'plyn_coins' ? 0 : Math.round(paymentAmount / 10);
  };
  
  const handlePayment = async (values: PaymentFormValues) => {
    try {
      setIsSubmitting(true);
      setPaymentError(null);
      
      // Update the current payment method for coin earning calculation
      setCurrentPaymentMethod(values.paymentMethod);
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to book an appointment.",
          variant: "destructive",
        });
        navigate('/auth', { state: { redirectTo: `/payment` } });
        return;
      }
      
      const slotCheck = await checkSlotAvailability(
        bookingData.salonId,
        new Date(bookingData.date).toISOString().split('T')[0],
        bookingData.timeSlot
      );
      
      if (!slotCheck.available) {
        setPaymentError("Sorry, this time slot is no longer available. Please select another time.");
        setIsSubmitting(false);
        return;
      }

      // Calculate the final payment amount (after using coins)
      let finalPaymentAmount = bookingData.totalPrice;
      let coinsApplied = 0;
      
      // Handle payment with PLYN coins
      if (values.paymentMethod === 'plyn_coins') {
        const requiredCoins = bookingData.totalPrice * 2;
        
        if (userCoins < requiredCoins) {
          // If not enough coins, show error message
          setPaymentError(`You need ${requiredCoins} PLYN coins for this payment. You currently have ${userCoins} coins.`);
          setIsSubmitting(false);
          return;
        }
        
        coinsApplied = requiredCoins;
        finalPaymentAmount = 0; // Full payment with coins
      } else if (useCoins && coinsToUse > 0) {
        // Partial payment with coins (alongside other payment method)
        coinsApplied = coinsToUse;
        finalPaymentAmount = getAmountAfterCoins();
      }
      

      const coinsEarned = values.paymentMethod === 'plyn_coins' ? 0 : Math.round(finalPaymentAmount / 10);
      
      console.log("Creating booking with:", {
        finalPaymentAmount,
        coinsApplied,
        coinsEarned,
        paymentMethod: values.paymentMethod
      });
            
      const newBooking = await createBooking({
        userId: user.id,
        salonId: bookingData.salonId,
        salonName: bookingData.salonName,
        serviceName: bookingData.services.map((s: any) => s.name).join(", "),
        date: new Date(bookingData.date).toISOString().split('T')[0],
        timeSlot: bookingData.timeSlot,
        email: values.email,
        phone: values.phone,
        totalPrice: finalPaymentAmount,
        totalDuration: bookingData.totalDuration,
        slotId: slotCheck.slotId,
        notes: values.notes,
        coinsUsed: coinsApplied,
        coinsEarned: coinsEarned
      });
      
      const payment = await createPayment({
        bookingId: newBooking.id,
        userId: user.id,
        amount: finalPaymentAmount,
        paymentMethod: values.paymentMethod,
        coinsUsed: coinsApplied,
        coinsEarned: coinsEarned
      });
      
      await bookSlot(slotCheck.slotId);

      const newCoinsBalance = await updateUserCoins(user.id, coinsEarned, coinsApplied);
      console.log("New coins balance:", newCoinsBalance);

      // Show appropriate message based on payment method
      const successMessage = values.paymentMethod === 'plyn_coins' 
        ? `Your appointment has been booked using ${coinsApplied} PLYN coins!`
        : `Your appointment has been booked! ${coinsEarned > 0 ? `You earned ${coinsEarned} PLYN coins!` : ''}`;
      
      toast({
        title: "Payment Successful",
        description: successMessage,
      });
      
      showBookingSuccessNotification({
        ...bookingData,
        date: new Date(bookingData.date),
        timeSlot: bookingData.timeSlot
      });
      
      navigate('/booking-confirmation', { 
        state: {
          ...bookingData,
          bookingId: newBooking.id,
          coinsUsed: coinsApplied,
          coinsEarned: coinsEarned,
          finalPrice: finalPaymentAmount,
          paymentDetails: {
            cardName: values.cardName,
            cardNumber: values.cardNumber ? values.cardNumber.slice(-4).padStart(16, '*') : '',
            expiryDate: values.expiryDate,
            paymentMethod: values.paymentMethod
          }
        }
      });
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentError("There was an error processing your payment. Please try again.");
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCoins = (checked: boolean) => {
    setUseCoins(checked);
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow pt-20">
          <section className="py-8 px-4">
            <div className="container mx-auto max-w-5xl">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-2xl md:text-3xl font-bold mb-8 text-center"
              >
                Complete Your Booking
              </motion.h1>
              
              {paymentError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{paymentError}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <BookingSummary 
                    salonName={bookingData.salonName}
                    services={bookingData.services}
                    date={bookingData.date}
                    timeSlot={bookingData.timeSlot}
                    totalDuration={bookingData.totalDuration}
                    totalPrice={bookingData.totalPrice}
                  />

                  <div className="mt-6 bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Coins className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">PLYN Coins</h3>
                      </div>
                      <span className="text-sm bg-primary/10 px-2 py-1 rounded-full">
                        Balance: {userCoins} coins
                      </span>
                    </div>
                    
                    {userCoins > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Checkbox 
                            id="use-coins" 
                            checked={useCoins}
                            onCheckedChange={handleToggleCoins}
                            disabled={userCoins <= 0}
                          />
                          <Label htmlFor="use-coins" className="text-sm">
                            Use my PLYN coins for this payment
                          </Label>
                        </div>
                        
                        {useCoins && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Using {coinsToUse} coins (${(coinsToUse / 2).toFixed(2)} value)
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="text-sm space-y-1">
                      <p className="flex justify-between">
                        <span>Original Price:</span>
                        <span>${bookingData.totalPrice.toFixed(2)}</span>
                      </p>
                      
                      {useCoins && coinsToUse > 0 && (
                        <p className="flex justify-between text-green-600">
                          <span>Coin Discount:</span>
                          <span>-${(coinsToUse / 2).toFixed(2)}</span>
                        </p>
                      )}
                      
                      <p className="flex justify-between font-medium pt-1 border-t border-primary/10">
                        <span>Final Price:</span>
                        <span>${getAmountAfterCoins().toFixed(2)}</span>
                      </p>
                      
                      <p className="flex justify-between text-primary mt-2">
                        <span>Coins you'll earn:</span>
                        <span>+{getCoinsToEarn()} coins</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="glass-card p-6 rounded-lg">
                    <PaymentForm 
                      defaultValues={defaultValues}
                      onSubmit={handlePayment}
                      isSubmitting={isSubmitting}
                      totalPrice={getAmountAfterCoins()}
                      userCoins={userCoins}
                      plyCoinsEnabled={userCoins >= bookingData.totalPrice * 2}
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Payment;
