
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '@/components/transitions/PageTransition';
import DashboardStats from '@/components/admin/DashboardStats';
import MerchantApplicationList from '@/components/admin/MerchantApplicationList';
import ApprovedMerchantsList from '@/components/admin/ApprovedMerchantsList';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { Button } from '@/components/ui/button'; 
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { MerchantData } from '@/types/admin';

type EmptyRPCParams = Record<string, never>;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('applications');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    pendingApplications, 
    approvedApplications, 
    isLoading, 
    stats, 
    handleApprove, 
    handleReject 
  } = useAdminDashboard();

  console.log("Admin Dashboard - Pending Applications:", pendingApplications);
  console.log("Admin Dashboard - Is Loading:", isLoading);

  useEffect(() => {
    console.log("Checking admin authentication");
    const isAdminLoggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';
    const adminEmail = sessionStorage.getItem('adminEmail');
    
    console.log("Admin auth check:", { isAdminLoggedIn, adminEmail });
    
    if (!isAdminLoggedIn || adminEmail !== 'srimanmudavath@gmail.com') {
      console.log("Not admin, redirecting to login");
      window.location.href = '/admin-login';
    }
  }, []);

  const refreshDashboard = () => {
    setIsRefreshing(true);
    
    window.location.reload();
  };

  const checkDatabase = async () => {
    try {
      setIsChecking(true);
      
      try {
        console.log("Testing direct table access");
        
        const { data: directData, error: directError } = await supabase
          .from('merchants')
          .select('*');
          
        if (directError) {
          console.error("Error fetching merchant data via direct access:", directError);
          setDebugInfo({
            method: "Direct",
            error: directError,
            message: "Direct table access failed. RLS policies may be preventing access."
          });
          
          toast({
            title: "Database Check (Direct)",
            description: "Failed to access merchant data directly. This is expected if RLS policies are active.",
            variant: "default",
          });
        } else {
          setDebugInfo({
            method: "Direct",
            data: directData,
            count: directData?.length || 0
          });
          
          toast({
            title: "Database Check (Direct)",
            description: `Found ${directData?.length || 0} merchant records with direct access.`,
          });
          return;
        }
        
        const { data: rpcData, error: rpcError } = await supabase
          .rpc<MerchantData[]>('get_all_merchants', {});
          
        if (rpcError) {
          console.error("Error fetching merchant data via RPC:", rpcError);
          setDebugInfo({
            method: "RPC",
            error: rpcError,
            message: "RPC method failed. Function may not be installed or has incorrect permissions."
          });
          
          toast({
            title: "Database Check (RPC)",
            description: "Failed to access merchant data via RPC function.",
            variant: "destructive",
          });
          return;
        }
        
        setDebugInfo({
          method: "RPC",
          data: rpcData,
          count: rpcData ? rpcData.length : 0
        });
        
        toast({
          title: "Database Check (RPC)",
          description: `Found ${rpcData ? rpcData.length : 0} merchant records using RPC method.`,
        });
        return;
      } catch (error) {
        console.error("Error checking database:", error);
        setDebugInfo({
          error
        });
        
        toast({
          title: "Database Check Failed",
          description: "An unexpected error occurred while checking the database.",
          variant: "destructive",
        });
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <AdminNavbar />
        
        <main className="flex-grow pt-20 pb-12 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-6 w-6 text-red-500" />
                  <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
                </div>
                <p className="text-muted-foreground">
                  Manage merchant applications, users, and platform settings
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className="bg-red-500">Admin Portal</Badge>
                <Button variant="outline" size="sm" onClick={checkDatabase}>
                  Check Database
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshDashboard}
                  disabled={isRefreshing}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </div>
            </div>
            
            {debugInfo && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2">Debug Information:</h3>
                <p>Method: {debugInfo.method}</p>
                <p>Records found: {debugInfo.count}</p>
                <div className="mt-2">
                  <details>
                    <summary className="cursor-pointer text-blue-500">View raw data</summary>
                    <pre className="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(debugInfo.data, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
            
            <DashboardStats 
              totalMerchants={stats.totalMerchants}
              totalUsers={stats.totalUsers}
              totalBookings={stats.totalBookings}
              pendingApplications={stats.pendingApplications}
            />
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
              <TabsList className="grid grid-cols-2 md:grid-cols-3 w-full md:w-auto">
                <TabsTrigger value="applications">Merchant Applications</TabsTrigger>
                <TabsTrigger value="merchants">Approved Merchants</TabsTrigger>
                <TabsTrigger value="analytics">Platform Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="applications" className="space-y-6">
                <MerchantApplicationList 
                  applications={pendingApplications}
                  isLoading={isLoading}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </TabsContent>
              
              <TabsContent value="merchants" className="space-y-6">
                <ApprovedMerchantsList 
                  merchants={approvedApplications}
                  isLoading={isLoading}
                />
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-6">
                <AnalyticsDashboard />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;