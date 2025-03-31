import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, Building, ArrowDownToLine, QrCode, Settings, Coins } from 'lucide-react';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  plyCoinsEnabled?: boolean;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ 
  selectedMethod, 
  onMethodChange,
  plyCoinsEnabled = true
}) => {
  // Basic payment methods always available
  const basicPaymentMethods = [
    {
      id: 'credit_card',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="h-5 w-5" />,
      description: 'Pay securely with your credit or debit card'
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      icon: <Smartphone className="h-5 w-5 text-indigo-600" />,
      description: 'Pay using PhonePe mobile wallet'
    },
    {
      id: 'paytm',
      name: 'Paytm',
      icon: <Smartphone className="h-5 w-5 text-blue-600" />,
      description: 'Pay using Paytm wallet or UPI'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: <Building className="h-5 w-5 text-green-600" />,
      description: 'Pay directly from your bank account'
    },
    {
      id: 'razorpay',
      name: 'RazorPay',
      icon: <ArrowDownToLine className="h-5 w-5 text-blue-500" />,
      description: 'Pay using RazorPay payment gateway'
    },
    {
      id: 'qr_code',
      name: 'QR Code',
      icon: <QrCode className="h-5 w-5" />,
      description: 'Scan and pay using any UPI app'
    },
    {
      id: 'other',
      name: 'Other Payment Methods',
      icon: <Settings className="h-5 w-5" />,
      description: 'Choose from other available payment options'
    }
  ];
  
  // PLYN Coins payment method (only shown if enabled)
  const plyCoinsMethod = {
    id: 'plyn_coins',
    name: 'PLYN Coins',
    icon: <Coins className="h-5 w-5 text-primary" />,
    description: 'Pay using your PLYN Coins (2 coins = $1)'
  };
  
  // Combine payment methods based on whether PLYN Coins are enabled
  const paymentMethods = plyCoinsEnabled 
  ? [plyCoinsMethod, ...basicPaymentMethods]
    : basicPaymentMethods;

  return (
    <RadioGroup value={selectedMethod} onValueChange={onMethodChange} className="space-y-3">
      {paymentMethods.map((method) => (
        <div key={method.id} className="flex items-center">
          <RadioGroupItem 
            value={method.id} 
            id={method.id}
            className="peer sr-only" 
          />
          <Label
            htmlFor={method.id}
            className="flex items-center gap-3 w-full p-4 cursor-pointer rounded-lg border border-border peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 transition-colors"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/40">
              {method.icon}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{method.name}</p>
              <p className="text-xs text-muted-foreground">{method.description}</p>
            </div>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};

export default PaymentMethodSelector;
