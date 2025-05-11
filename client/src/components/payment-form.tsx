import React, { useEffect, useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

// Initialize Stripe with error handling
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx',
  {
    betas: ['process_order_beta_3'],
    locale: 'en'
  }
).catch((error) => {
  console.error('Failed to initialize Stripe:', error);
  return null;
});

interface PaymentFormProps {
  branchId: number;
  branchName: string;
  installmentNumber: number;
  amount: number;
  className?: string;
}

const CheckoutForm = ({ 
  amount, 
  branchName, 
  installmentNumber 
}: { 
  amount: number; 
  branchName: string; 
  installmentNumber: number;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsLoading(true);
    setNetworkError(false);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });
      
      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Payment successful
      toast({
        title: "Payment Successful",
        description: "Thank you for your enrollment!",
      });
      
      navigate('/profile');
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (err) {
      setNetworkError(true);
      toast({
        title: "Network Error",
        description: "Connection failed. Please check your internet.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (networkError) {
    return (
      <div className="text-center p-6">
        <p className="text-red-500 mb-2">Connection Lost</p>
        <p className="text-sm text-muted-foreground mb-4">
          Please check your internet connection and try again
        </p>
        <Button className="outline" onClick={handleRetry}>
          Retry Payment
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="text-center mb-6">
        <p className="text-lg mb-1">{branchName}</p>
        <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
        <p className="text-sm text-muted-foreground">
          {installmentNumber === 1 ? 'First Installment (40%)' : 
           installmentNumber === 2 ? 'Second Installment (30%)' : 
           'Third Installment (30%)'}
        </p>
      </div>
      
      <div className="mb-6">
        <PaymentElement options={{
          fields: {
            billingDetails: {
              email: 'never',
              phone: 'never',
            }
          }
        }} />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${formatCurrency(amount)}`
        )}
      </Button>
      
      <p className="text-center text-xs text-muted-foreground mt-4">
        <span className="material-icons text-muted-foreground mr-1 text-sm">lock</span>
        Secure payment processed by Stripe
      </p>
    </form>
  );
};

export const PaymentForm: React.FC<PaymentFormProps> = ({
  branchId,
  branchName,
  installmentNumber,
  amount,
  className,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [initializationError, setInitializationError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check Stripe initialization status
    stripePromise?.then(() => setStripeLoaded(true)).catch(() => {
      setInitializationError(true);
    });
  }, []);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest(
          "POST", 
          "/api/create-payment-intent", 
          { branchId, installmentNumber }
        );
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        toast({
          title: "Initialization Error",
          description: "Failed to start payment process",
          variant: "destructive",
        });
      }
    };

    if (stripeLoaded) {
      createPaymentIntent();
    }
  }, [branchId, installmentNumber, toast, stripeLoaded]);

  if (initializationError) {
    return (
      <div className="text-center p-6">
        <p className="text-red-500 mb-2">Payment System Unavailable</p>
        <p className="text-sm text-muted-foreground">
          Please try again later or contact support
        </p>
      </div>
    );
  }

  if (!clientSecret || !stripeLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="card">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="card" className="flex-1">Credit/Debit Card</TabsTrigger>
            <TabsTrigger value="upi" className="flex-1">UPI</TabsTrigger>
            <TabsTrigger value="netbanking" className="flex-1">Net Banking</TabsTrigger>
          </TabsList>
          
          <TabsContent value="card">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm 
                amount={amount}
                branchName={branchName}
                installmentNumber={installmentNumber}
              />
            </Elements>
          </TabsContent>
          
          <TabsContent value="upi">
            <div className="text-center py-8">
              <p className="text-muted-foreground">UPI payments coming soon</p>
            </div>
          </TabsContent>
          
          <TabsContent value="netbanking">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Net Banking coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};