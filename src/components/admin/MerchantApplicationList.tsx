
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from 'lucide-react';
import MerchantApplicationCard from './MerchantApplicationCard';

type UserProfile = {
  username: string | null;
  email: string | null;
};

type MerchantApplication = {
  id: string;
  businessName: string;
  businessAddress: string;
  businessEmail: string;
  businessPhone: string;
  serviceCategory: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_profile: UserProfile | null;
};

type MerchantApplicationListProps = {
  applications: MerchantApplication[];
  isLoading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

const MerchantApplicationList: React.FC<MerchantApplicationListProps> = ({
  applications,
  isLoading,
  onApprove,
  onReject
}) => {
  console.log("MerchantApplicationList - Applications:", applications);
  console.log("MerchantApplicationList - Is Loading:", isLoading);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Merchant Applications</CardTitle>
        <CardDescription>
          Review and manage merchant applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full mx-auto mb-4"></div>
            <p>Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">No Pending Applications</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              There are no merchant applications waiting for approval at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(application => (
              <MerchantApplicationCard
                key={application.id}
                id={application.id}
                business_name={application.businessName}
                business_address={application.businessAddress}
                business_email={application.businessEmail}
                business_phone={application.businessPhone}
                service_category={application.serviceCategory}
                created_at={application.created_at}
                user_profile={application.user_profile}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MerchantApplicationList;
