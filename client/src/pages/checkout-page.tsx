import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/header';
import { PaymentForm } from '@/components/payment-form';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Loader2, Home, CreditCard } from 'lucide-react';
import { calculateInstallment } from '@/lib/utils';
import { IBranch } from '@shared/schema';

interface BranchData {
  branch: IBranch;
}

export default function CheckoutPage() {
  const { branchId, installment } = useParams();
  const [, navigate] = useLocation();
  
  const branchIdNum = parseInt(branchId || '0');
  const installmentNum = parseInt(installment || '0');
  
  // Fetch branch data
  const { data: branchData, isLoading } = useQuery<BranchData>({
    queryKey: [`/api/branches/${branchIdNum}`],
  });
  
  // Calculate amount based on installment number
  const calculateAmount = () => {
    if (!branchData) return 0;
    
    const branch = branchData.branch;
    switch (installmentNum) {
      case 1:
        return calculateInstallment(branch.price, 40); // 40% for first installment
      case 2:
      case 3:
        return calculateInstallment(branch.price, 30); // 30% for second and third installments
      default:
        return 0;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="h-4 w-4 mr-1" />
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/branch/${branchId}`}>
                {isLoading ? 'Loading...' : branchData?.branch.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>
                <CreditCard className="h-4 w-4 mr-1" />
                Checkout
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : branchData ? (
          <PaymentForm
            branchId={branchIdNum}
            branchName={branchData.branch.name}
            installmentNumber={installmentNum}
            amount={calculateAmount()}
          />
        ) : (
          <div className="text-center py-12 text-destructive">
            <p>Branch not found. Please select a valid branch.</p>
          </div>
        )}
      </main>
    </div>
  );
}
