import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  MapPin, 
  CreditCard, 
  Printer,
  Download,
  Home,
  Coins
} from 'lucide-react';
import { format } from 'date-fns';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageTransition from '@/components/transitions/PageTransition';
import { useEffect } from 'react';
import { showBookingSuccessNotification } from '@/components/booking/BookingSuccessNotification';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get booking data from location state
  const bookingData = location.state;
  
  useEffect(() => {
    // Show success notification when component mounts
    if (bookingData) {
      showBookingSuccessNotification(bookingData);
    }
  }, [bookingData]);
  
  // If no booking data, redirect to book now page
  if (!bookingData) {
    navigate('/book-now');
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  // Format payment method for display
  const getFormattedPaymentMethod = (method) => {
    if (!method) return 'Payment complete';
    
    const methodMap = {
      'credit_card': 'Credit Card',
      'plyn_coins': 'PLYN Coins',
      'phonepe': 'PhonePe',
      'paytm': 'Paytm',
      'netbanking': 'Net Banking',
      'razorpay': 'RazorPay',
      'qr_code': 'QR Code',
      'other': 'Other Payment Method'
    };
    
    return methodMap[method] || method.replace('_', ' ');
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow pt-20 print:pt-0">
          <section className="py-8 px-4 print:py-2">
            <div className="container mx-auto max-w-2xl">
              <div className="print:hidden">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex justify-center mb-6"
                >
                  <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-4">
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-center mb-8"
                >
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">Booking Confirmed!</h1>
                  <p className="text-muted-foreground">
                    Your appointment has been successfully booked.
                  </p>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass-card p-6 md:p-8 rounded-lg mb-6 print:shadow-none print:border print:border-gray-300"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">Booking Details</h2>
                    <p className="text-sm text-muted-foreground">Reference: {bookingData.bookingId}</p>
                  </div>
                  <div className="print:hidden flex gap-2">
                    <button onClick={handlePrint} className="p-2 rounded-md hover:bg-accent/50">
                      <Printer className="h-5 w-5" />
                    </button>
                    <button className="p-2 rounded-md hover:bg-accent/50">
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className={`rounded-md p-2 mr-3 ${
                      bookingData.salonName.includes("Men") || bookingData.salonName.includes("Barber") 
                        ? "bg-salon-men/10 text-salon-men print:bg-gray-100" 
                        : "bg-salon-women/10 text-salon-women print:bg-gray-100"
                    }`}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{bookingData.salonName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {bookingData.services.length} service(s)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-primary/10 text-primary rounded-md p-2 mr-3 print:bg-gray-100">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {bookingData.date && format(new Date(bookingData.date), "EEEE, MMMM d, yyyy")}
                      </h3>
                      <p className="text-sm text-muted-foreground">Appointment date</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-primary/10 text-primary rounded-md p-2 mr-3 print:bg-gray-100">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{bookingData.timeSlot}</h3>
                      <p className="text-sm text-muted-foreground">
                        Duration: {bookingData.totalDuration} minutes
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-primary/10 text-primary rounded-md p-2 mr-3 print:bg-gray-100">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">Salon Location</h3>
                      <p className="text-sm text-muted-foreground">
                        123 Main Street, City, State ZIP
                      </p>
                    </div>
                  </div>
                  
                  <hr className="border-border" />
                  
                  <div>
                    <h3 className="font-medium mb-3">Services Booked</h3>
                    <ul className="space-y-2">
                      {bookingData.services.map((service: any, index: number) => (
                        <li key={index} className="flex justify-between text-sm">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            <span>{service.name}</span>
                          </div>
                          <span className="font-medium">${service.price}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <hr className="border-border" />
                  
                  {/* PLYN Coins Section */}
                  {(bookingData.coinsUsed > 0 || bookingData.coinsEarned > 0) && (
                    <>
                      <div>
                        <h3 className="font-medium mb-3 flex items-center">
                          <Coins className="h-4 w-4 mr-2 text-primary" />
                          PLYN Coins
                        </h3>
                        <div className="space-y-2 text-sm">
                          {bookingData.coinsUsed > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Coins Used:</span>
                              <span className="font-medium text-green-600">-{bookingData.coinsUsed} coins (${(bookingData.coinsUsed / 2).toFixed(2)})</span>
                            </div>
                          )}
                          
                          {bookingData.coinsEarned > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Coins Earned:</span>
                              <span className="font-medium text-primary">+{bookingData.coinsEarned} coins</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <hr className="border-border" />
                    </>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Payment</h3>
                      <p className="text-sm text-muted-foreground">
                        {bookingData.paymentDetails?.paymentMethod 
                          ? `Paid with ${getFormattedPaymentMethod(bookingData.paymentDetails.paymentMethod)}`
                          : bookingData.paymentDetails?.cardNumber
                            ? `Card ending in ${bookingData.paymentDetails.cardNumber.slice(-4)}`
                            : "Payment complete"
                        }
                      </p>
                    </div>
                    <div className="text-xl font-bold">
                      ${bookingData.finalPrice !== undefined ? bookingData.finalPrice.toFixed(2) : bookingData.totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="print:hidden bg-muted/20 p-4 rounded-lg border border-border mb-6"
              >
                <h3 className="font-medium mb-2">Important Information</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                    <span>Please arrive 10 minutes before your appointment time.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                    <span>Cancellations must be made at least 24 hours in advance.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                    <span>A confirmation email has been sent to your email address.</span>
                  </li>
                </ul>
              </motion.div>
              
              <div className="print:hidden flex justify-center space-x-4">
                <Link to="/">
                  <AnimatedButton variant="outline" className="px-4">
                    <Home className="mr-2 h-4 w-4" />
                    Return Home
                  </AnimatedButton>
                </Link>
                
                <Link to="/book-now">
                  <AnimatedButton variant="default" className="px-4">
                    Book Another Appointment
                  </AnimatedButton>
                </Link>
              </div>
            </div>
          </section>
        </main>
        
        <Footer className="print:hidden" />
      </div>
    </PageTransition>
  );
};

export default BookingConfirmation;
