import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";

interface LeaderboardEntry {
  userId: number;
  fullName: string;
  totalPoints: number;
  winningBets: number;
  totalBets: number;
}

const LeaderboardPage = () => {
  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary-dark to-primary p-6">
              <h2 className="text-2xl font-montserrat font-bold text-white">Leaderboard</h2>
              <p className="text-blue-200 mt-1">See who's winning big in IPL 2025!</p>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bets</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaderboard.map((entry, index) => (
                        <tr key={entry.userId} className={index < 3 ? "bg-blue-50" : ""}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {index < 3 ? (
                                <span className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                  index === 0 ? "bg-yellow-400" :
                                  index === 1 ? "bg-gray-300" :
                                  "bg-amber-600"
                                } text-white font-bold`}>
                                  {index + 1}
                                </span>
                              ) : (
                                <span className="text-gray-900">{index + 1}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{entry.fullName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-semibold">{entry.totalPoints}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {((entry.winningBets / entry.totalBets) * 100).toFixed(1)}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.totalBets}
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

export default LeaderboardPage; 