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

// Initialize Stripe with public key from environment
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

interface PaymentFormProps {
  branchId: number;
  branchName: string;
  installmentNumber: number;
  amount: number;
  className?: string;
}

const CheckoutForm = ({ amount, branchName, installmentNumber }: { 
  amount: number; 
  branchName: string; 
  installmentNumber: number;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsLoading(true);
    
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
      
      // Navigate to profile page after successful payment
      navigate('/profile');
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['/api/user'],
      });
    } catch (err) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
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
        <PaymentElement />
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
      
      <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center">
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
  const { toast } = useToast();
  
  useEffect(() => {
    // Create payment intent when component loads
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest(
          "POST", 
          "/api/create-payment-intent", 
          { 
            branchId,
            installmentNumber,
          }
        );
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    createPaymentIntent();
  }, [branchId, installmentNumber, toast]);
  
  if (!clientSecret) {
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
              <p className="text-muted-foreground">UPI payment option will be available soon.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="netbanking">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Net Banking option will be available soon.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
