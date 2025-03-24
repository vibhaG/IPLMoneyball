import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Match } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";
import AddUserDialog from "@/components/add-user-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const AdminPage = () => {
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("PUT", `/api/users/${userId}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deactivated",
        description: "The user has been deactivated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to deactivate user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMatchMutation = useMutation({
    mutationFn: async ({ matchId, winner }: { matchId: number; winner: string }) => {
      await apiRequest("PUT", `/api/matches/${matchId}/winner`, { winner });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({
        title: "Match updated",
        description: "The match winner has been set successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update match",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeactivateUser = (userId: number) => {
    if (confirm("Are you sure you want to deactivate this user?")) {
      deactivateUserMutation.mutate(userId);
    }
  };

  const handleSetWinner = (matchId: number, winner: string) => {
    if (confirm(`Are you sure you want to set ${winner} as the winner?`)) {
      updateMatchMutation.mutate({ matchId, winner });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary-dark to-primary p-6">
              <h2 className="text-2xl font-montserrat font-bold text-white">Admin Dashboard</h2>
              <p className="text-blue-200 mt-1">Manage users and monitor betting activity</p>
            </div>
            
            <div className="p-6">
              <Tabs defaultValue="users" className="w-full">
                <TabsList className="border-b border-gray-200 w-full justify-start rounded-none bg-transparent mb-6">
                  <TabsTrigger 
                    value="users" 
                    className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:hover:border-gray-300 font-medium bg-transparent rounded-none"
                  >
                    User Management
                  </TabsTrigger>
                  <TabsTrigger 
                    value="matches" 
                    className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:hover:border-gray-300 font-medium bg-transparent rounded-none"
                  >
                    Match Management
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics" 
                    className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:hover:border-gray-300 font-medium bg-transparent rounded-none"
                  >
                    Bet Analytics
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:hover:border-gray-300 font-medium bg-transparent rounded-none"
                  >
                    System Settings
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="users">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Registered Users</h3>
                    <Button 
                      className="flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors duration-300"
                      onClick={() => setIsAddUserDialogOpen(true)}
                    >
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Add New User
                    </Button>
                  </div>
                  
                  {usersLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold">
                                    {user.fullName.split(' ').map(part => part[0]).join('').toUpperCase()}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{user.username}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.role === 'admin' 
                                    ? 'bg-accent text-white' 
                                    : 'bg-primary-light text-white'
                                }`}>
                                  {user.role === 'admin' ? 'Admin' : 'Regular User'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex space-x-2">
                                  <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                  {user.isActive && (
                                    <button 
                                      className="text-red-600 hover:text-red-900"
                                      onClick={() => handleDeactivateUser(user.id)}
                                      disabled={deactivateUserMutation.isPending}
                                    >
                                      Deactivate
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="matches">
                  {matchesLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teams</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winner</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {matches.map((match) => (
                            <tr key={match.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(match.matchDate).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {match.team1} vs {match.team2}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {match.venue}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {match.winner || 'Not set'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {!match.winner && (
                                  <div className="flex space-x-4">
                                    <button
                                      onClick={() => handleSetWinner(match.id, match.team1)}
                                      className="text-primary hover:text-primary-dark"
                                    >
                                      Set {match.team1}
                                    </button>
                                    <button
                                      onClick={() => handleSetWinner(match.id, match.team2)}
                                      className="text-primary hover:text-primary-dark"
                                    >
                                      Set {match.team2}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="analytics">
                  <div className="py-12 text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Bet Analytics</h3>
                    <p className="text-gray-600">Coming soon! Bet analytics features are under development.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="settings">
                  <div className="py-12 text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">System Settings</h3>
                    <p className="text-gray-600">Coming soon! System settings features are under development.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      <AddUserDialog 
        isOpen={isAddUserDialogOpen} 
        onClose={() => setIsAddUserDialogOpen(false)} 
      />
    </div>
  );
};

export default AdminPage;
