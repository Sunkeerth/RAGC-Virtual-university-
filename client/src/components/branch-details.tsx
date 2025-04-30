import React from 'react';
import { cn, formatCurrency, calculateInstallment } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Branch, EquipmentKit, Specialization } from '@shared/schema';

interface BranchDetailsProps {
  branch: Branch;
  equipmentKits: EquipmentKit[];
  specializations: Specialization[];
  className?: string;
}

interface KitItemProps {
  kit: EquipmentKit;
}

interface SpecializationItemProps {
  specialization: Specialization;
}

const KitItem: React.FC<KitItemProps> = ({ kit }) => {
  const getIconComponent = () => {
    return (
      <span className="material-icons text-primary mr-3">{kit.icon}</span>
    );
  };
  
  return (
    <div className="bg-muted p-3 rounded-lg flex items-start">
      {getIconComponent()}
      <div>
        <h4 className="font-medium">{kit.name}</h4>
        <p className="text-sm text-muted-foreground">{kit.description}</p>
      </div>
    </div>
  );
};

const SpecializationItem: React.FC<SpecializationItemProps> = ({ specialization }) => {
  return (
    <div className="bg-muted p-3 rounded-lg">
      <h4 className="font-medium">{specialization.name}</h4>
      <p className="text-sm text-muted-foreground mb-2">{specialization.description}</p>
      <div className="flex items-center text-xs text-muted-foreground">
        <span className="material-icons text-xs mr-1">school</span>
        <span>{specialization.teachersCount} Teachers</span>
        <span className="mx-2">•</span>
        <span>{specialization.modulesCount} Modules</span>
      </div>
    </div>
  );
};

export const BranchDetails: React.FC<BranchDetailsProps> = ({ 
  branch, 
  equipmentKits, 
  specializations, 
  className 
}) => {
  const [, navigate] = useLocation();
  
  const handleEnroll = () => {
    navigate(`/checkout/${branch.id}/1`);
  };
  
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-6', className)}>
      <div className="lg:col-span-2">
        <img 
          src={branch.image} 
          alt={branch.name} 
          className="w-full h-60 object-cover rounded-lg mb-4"
        />
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">About this Branch</h3>
          <p className="text-muted-foreground">
            {branch.name} is a branch of engineering that focuses on {branch.description.toLowerCase()}. 
            Our program provides a comprehensive understanding of both theoretical concepts and practical applications, 
            preparing students for successful careers in the industry.
          </p>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Learning Outcomes</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-1">
            <li>Master technical concepts and methodologies</li>
            <li>Design and analyze complex systems</li>
            <li>Develop practical solutions for real-world problems</li>
            <li>Implement industry-standard best practices</li>
            <li>Apply advanced techniques in specialized areas</li>
            <li>Gain hands-on experience with professional tools</li>
          </ul>
        </div>
        
        {/* Equipment Kit */}
        {equipmentKits.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Core Equipment Kit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {equipmentKits.map((kit) => (
                <KitItem key={kit.id} kit={kit} />
              ))}
            </div>
          </div>
        )}
        
        {/* Specializations */}
        {specializations.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Specializations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {specializations.map((spec) => (
                <SpecializationItem key={spec.id} specialization={spec} />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Enrollment sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-muted p-4 rounded-lg sticky top-4">
          <h3 className="text-lg font-medium mb-3">Enroll in this Branch</h3>
          
          <div className="mb-4">
            <div className="text-2xl font-bold mb-1">{formatCurrency(branch.price)}</div>
            <p className="text-muted-foreground text-sm">Complete program fee</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-2">Program Includes:</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start">
                <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                <span>24 months of access to all course materials</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                <span>Complete hardware kit with VR headset</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                <span>250+ hours of video lectures</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                <span>Real-time project experience</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                <span>Industry certification</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                <span>Placement assistance</span>
              </li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-2">Installment Plan:</h4>
            <div className="bg-card p-3 rounded-lg text-sm">
              <div className="flex justify-between mb-2">
                <span>First Installment (40%)</span>
                <span className="font-medium">{formatCurrency(calculateInstallment(branch.price, 40))}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Second Installment (30%)</span>
                <span className="font-medium">{formatCurrency(calculateInstallment(branch.price, 30))}</span>
              </div>
              <div className="flex justify-between">
                <span>Third Installment (30%)</span>
                <span className="font-medium">{formatCurrency(calculateInstallment(branch.price, 30))}</span>
              </div>
            </div>
          </div>
          
          <Button 
            className="w-full bg-primary hover:bg-primary/90"
            onClick={handleEnroll}
          >
            Enroll Now
          </Button>
          
          <p className="text-center text-xs text-muted-foreground mt-3">
            By enrolling, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};
