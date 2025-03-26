import { useQuery } from "@tanstack/react-query";
import { Bet, Match } from "@shared/schema";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface BetWithMatch extends Bet {
  match?: Match;
}

const MyBetsPage = () => {
  const { user } = useAuth();
  
  const { data: bets = [], isLoading: betsLoading } = useQuery<BetWithMatch[]>({
    queryKey: ["/api/bets"],
    queryFn: async () => {
      console.log('Fetching user bets...');
      const response = await fetch("/api/bets", {
        credentials: 'include'
      });
      console.log('Bets response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to fetch bets');
      }
      return response.json();
    },
    enabled: !!user?.id
  });

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
    enabled: !!user?.id
  });

  // Combine bets with match data
  const betsWithMatches = bets.map(bet => ({
    ...bet,
    match: matches.find(match => match.id === bet.matchId)
  }));

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary-dark to-primary p-6">
              <h2 className="text-2xl font-montserrat font-bold text-white">My Bets</h2>
              <p className="text-blue-200 mt-1">Track your betting history and performance</p>
            </div>
            
            <div className="p-6">
              {betsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : betsWithMatches.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">You haven't placed any bets yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selected Team</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {betsWithMatches.map((bet) => (
                        <tr key={bet.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {bet.match?.team1} vs {bet.match?.team2}
                            </div>
                            <div className="text-sm text-gray-500">
                              {bet.match?.venue}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {bet.match?.matchDate ? format(new Date(bet.match.matchDate), "MMM d, yyyy") : "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {bet.match?.time || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              bet.selectedTeam === bet.match?.winner
                                ? 'bg-green-100 text-green-800'
                                : bet.match?.winner
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {bet.selectedTeam}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{bet.amount}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              bet.match?.winner
                                ? bet.selectedTeam === bet.match.winner
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                : bet.match?.isAbandoned
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {bet.match?.winner
                                ? bet.selectedTeam === bet.match.winner
                                  ? 'Won'
                                  : 'Lost'
                                : bet.match?.isAbandoned
                                ? 'Abandoned'
                                : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MyBetsPage; 