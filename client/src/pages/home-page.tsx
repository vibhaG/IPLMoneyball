import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Match } from "@shared/schema";
import Header from "@/components/header";
import Footer from "@/components/footer";
import MatchCard from "@/components/match-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [venue, setVenue] = useState("all");

  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
    queryFn: async () => {
      const response = await fetch("/api/matches", {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    }
  });
  

  // Filter matches by search term and venue
  const filteredMatches = matches.filter((match) => {
    const matchesSearch = 
      match.team1.toLowerCase().includes(searchTerm.toLowerCase()) || 
      match.team2.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVenue = venue === "all" || match.venue.includes(venue);
    
    return matchesSearch && matchesVenue;
  });

  // Get unique venues for the filter dropdown
  const venues = Array.from(new Set(matches.map(match => match.venue)));

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h2 className="text-3xl font-montserrat font-bold text-gray-800">Upcoming Matches</h2>
              <p className="text-gray-600 mt-1">Place your bets for IPL 2025 matches</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <Input
                  type="text"
                  placeholder="Search teams..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              
              <Select value={venue} onValueChange={setVenue}>
                <SelectTrigger className="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full md:w-auto">
                  <SelectValue placeholder="All Venues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Venues</SelectItem>
                  {venues.map((venue) => (
                    <SelectItem key={venue} value={venue.split(",")[0]}>
                      {venue.split(",")[0]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No matches found</h3>
              <p className="text-gray-600">Try adjusting your search filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;
