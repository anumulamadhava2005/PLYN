
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MerchantApplication, DashboardStats } from '@/types/admin';

// Define interface for merchant data from RPC
interface MerchantData {
  id: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  status: string;
  created_at: string;
  [key: string]: any; // For any additional fields
}

export const useAdminDashboard = () => {
  const [pendingApplications, setPendingApplications] = useState<MerchantApplication[]>([]);
  const [approvedApplications, setApprovedApplications] = useState<MerchantApplication[]>([]);
  const [rejectedApplications, setRejectedApplications] = useState<MerchantApplication[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalMerchants: 0,
    totalUsers: 0,
    totalBookings: 0,
    pendingApplications: 0,
    rejectedApplications: 0,
    totalServices: 0,
    totalRevenue: 0
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is admin
  const checkAdminStatus = () => {
    const isAdminLoggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';
    const adminEmail = sessionStorage.getItem('adminEmail');

    console.log("Checking admin status:", { isAdminLoggedIn, adminEmail });

    if (!isAdminLoggedIn || adminEmail !== 'srimanmudavath@gmail.com') {
      console.log("Not admin - redirecting to login");
      window.location.href = '/admin-login';
      return false;
    }

    return true;
  };

  // Fetch merchant applications
  const fetchMerchantApplications = async () => {
    setLoading(true);

    try {
      console.log("Fetching merchant applications using direct RPC method");

      // Fetch merchant applications directly from the database
      const { data: allMerchants, error } = await supabase
        .from('merchants')
        .select('*');

      if (error) {
        console.error("Error fetching merchants:", error.message);
        return;
      }


      if (allMerchants) {
        console.log("Merchants data retrieved:", allMerchants);

        // Process merchants by status
        const pending = allMerchants.filter(m => m.status === 'pending').map(merchant => ({
          id: merchant.id,
          businessName: merchant.business_name,
          businessEmail: merchant.business_email,
          businessPhone: merchant.business_phone,
          serviceCategory: merchant.service_category,
          businessAddress: merchant.business_address,
          submittedAt: new Date(merchant.created_at).toLocaleDateString(),
          status: 'pending' as 'pending' | 'approved' | 'rejected'
        }));

        const approved = allMerchants.filter(m => m.status === 'approved').map(merchant => ({
          id: merchant.id,
          businessName: merchant.business_name,
          businessEmail: merchant.business_email,
          businessPhone: merchant.business_phone,
          serviceCategory: merchant.service_category,
          submittedAt: new Date(merchant.created_at).toLocaleDateString(),
          status: 'approved' as 'pending' | 'approved' | 'rejected'
        }));

        const rejected = allMerchants.filter(m => m.status === 'rejected').map(merchant => ({
          id: merchant.id,
          businessName: merchant.business_name,
          businessEmail: merchant.business_email,
          businessPhone: merchant.business_phone,
          serviceCategory: merchant.service_category,
          submittedAt: new Date(merchant.created_at).toLocaleDateString(),
          status: 'rejected' as 'pending' | 'approved' | 'rejected'
        }));

        setPendingApplications(pending);
        setApprovedApplications(approved);
        setRejectedApplications(rejected);

        // Update stats
        setStats({
          totalMerchants: approved.length,
          pendingApplications: pending.length,
          rejectedApplications: rejected.length,
          totalUsers: 0,
          totalServices: 0,
          totalBookings: 0,
          totalRevenue: 0
        });
      }
    } catch (error) {
      console.error('Error fetching merchant applications:', error);
      toast({
        title: "Error",
        description: "Failed to load merchant applications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle merchant application approval
  const handleApprove = async (merchantId: string) => {
    try {
      console.log("Approving merchant:", merchantId);
      // Update the merchant status in the database
      const { error } = await supabase
        .from('merchants')
        .update({ status: "approved" })
        .eq('id', merchantId)
      if (error) {
        console.error("Error approving merchant:", error);
        throw error;
      }

      // Update profiles table to set is_merchant to true
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_merchant: true })
        .eq('id', merchantId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      // Update local state
      setPendingApplications(prev => prev.filter(app => app.id !== merchantId));

      toast({
        title: "Merchant Approved",
        description: "The merchant application has been approved successfully.",
      });

      // Refresh merchant applications
      fetchMerchantApplications();

    } catch (error: any) {
      console.error('Error approving merchant:', error);
      toast({
        title: "Error",
        description: "Failed to approve merchant application.",
        variant: "destructive",
      });
    }
  };

  // Handle merchant application rejection
  const handleReject = async (merchantId: string) => {
    try {
      console.log("Rejecting merchant:", merchantId);
      // Update the merchant status in the database
      const { error } = await supabase
        .from('merchants')
        .update({ status: 'rejected' })
        .eq('id', merchantId);

      if (error) {
        console.error("Error rejecting merchant:", error);
        throw error;
      }

      // Update local state
      setPendingApplications(prev => prev.filter(app => app.id !== merchantId));

      toast({
        title: "Merchant Rejected",
        description: "The merchant application has been rejected.",
      });

      // Refresh data
      fetchMerchantApplications();

    } catch (error: any) {
      console.error('Error rejecting merchant:', error);
      toast({
        title: "Error",
        description: "Failed to reject merchant application.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log("useAdminDashboard hook mounted");
    if (checkAdminStatus()) {
      fetchMerchantApplications();
    }
  }, []);

  return {
    pendingApplications,
    approvedApplications,
    rejectedApplications,
    isLoading,
    stats,
    handleApprove,
    handleReject
  };
};
