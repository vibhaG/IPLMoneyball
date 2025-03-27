import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Match, InsertBet, Bet } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

// Cricket team logos as SVG icons
const teamLogos: Record<string, string> = {
  "Mumbai Indians": `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#004BA0"/><path d="M18 20h28v24H18z" fill="#FFFFFF"/><path d="M20 22h24v4H20z" fill="#D1AB3E"/><path d="M32 30l-8 8h16l-8-8z" fill="#D1AB3E"/></svg>`,
  "Chennai Super Kings": `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#FFCC00"/><path d="M20 20h24v24H20z" fill="#0A244A"/><path d="M25 30c0-3.866 3.134-7 7-7s7 3.134 7 7-3.134 7-7 7-7-3.134-7-7z" fill="#FFCC00"/></svg>`,
  "Royal Challengers Bangalore": `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#EC1C24"/><path d="M20 20h24v24H20z" fill="#000000"/><path d="M25 24h14v4H25z" fill="#CCA629"/></svg>`,
  "Delhi Capitals": `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#0078BC"/><path d="M20 20h24v24H20z" fill="#FFFFFF"/><path d="M25 25h14v14H25z" fill="#EF1B23"/></svg>`,
  "Kolkata Knight Riders": `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#3A225D"/><path d="M20 20h24v24H20z" fill="#FDB913"/><path d="M26 26h12v12H26z" fill="#3A225D"/></svg>`,
  "Rajasthan Royals": `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#254AA5"/><path d="M20 20h24v24H20z" fill="#F8C9CB"/><path d="M25 25h14v2H25z" fill="#254AA5"/></svg>`,
  "Punjab Kings": `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#ED1B24"/><path d="M20 20h24v24H20z" fill="#FFFFFF"/><path d="M24 24h16v16H24z" fill="#740F12"/></svg>`,
  "Sunrisers Hyderabad": `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#F26722"/><path d="M20 20h24v24H20z" fill="#000000"/><path d="M24 24h16v2H24z" fill="#F26722"/></svg>`,
  "Gujarat Titans": `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#1C1C1C"/><path d="M20 20h24v24H20z" fill="#1C9AD6"/><path d="M25 25h14v4H25z" fill="#1C1C1C"/></svg>`,
  "Lucknow Super Giants": `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#A72056"/><path d="M20 20h24v24H20z" fill="#FFFFFF"/><path d="M25 25h14v4H25z" fill="#A72056"/></svg>`,
};

// Default logo for unknown teams
const defaultLogo = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#CCCCCC"/><path d="M20 20h24v24H20z" fill="#FFFFFF"/><path d="M25 25h14v4H25z" fill="#AAAAAA"/></svg>`;

interface MatchCardProps {
  match: Match;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch existing bet for this match
  const { data: existingBet, isLoading } = useQuery<Bet | null>({
    queryKey: ["/api/bets/match", match.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/bets/match/${match.id}`);
      return await response.json() as Bet | null;
    },
    enabled: !!user?.id,
  });

  // Fetch all bets for this match to calculate odds
  const { data: matchBets = [] } = useQuery<Bet[]>({
    queryKey: ["/api/bets/match/all", match.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/bets/match/${match.id}/all`);
      return await response.json() as Bet[];
    }
  });

  // Calculate odds for each team
  const team1Bets = matchBets.filter(bet => bet.selectedTeam === match.team1);
  const team2Bets = matchBets.filter(bet => bet.selectedTeam === match.team2);
  
  const team1Total = team1Bets.reduce((sum, bet) => sum + bet.amount, 0);
  const team2Total = team2Bets.reduce((sum, bet) => sum + bet.amount, 0);
  const totalPool = team1Total + team2Total;

  // Format odds as percentages
  const team1Odds = totalPool > 0 ? Math.round((team1Total / totalPool) * 100) : 50;
  const team2Odds = totalPool > 0 ? Math.round((team2Total / totalPool) * 100) : 50;

  // Initialize form with existing bet data
  useEffect(() => {
    if (existingBet) {
      setSelectedTeam(existingBet.selectedTeam);
      setBetAmount(existingBet.amount.toString());
    }
  }, [existingBet]);

  const betMutation = useMutation({
    mutationFn: async (betData: InsertBet) => {
      if (existingBet?.id) {
        // Update existing bet
        console.log("Existing bet is "+ existingBet.id);
        const response = await apiRequest("PUT", `/api/bets/${existingBet.id}`, betData);
        console.log("Bet Data after " + betData);
        return await response.json() as Bet;
      } else {
        // Create new bet
        const response = await apiRequest("POST", "/api/bets", betData);
        return await response.json() as Bet;
      }
    },
    onSuccess: () => {
      toast({
        title: existingBet ? "Prediction Updated!" : "Prediction Placed!",
        description: `You put ${betAmount} on ${selectedTeam}`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bets/match", match.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/bets/match/all", match.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to pick team",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePlaceBet = () => {
    
    if (!selectedTeam) {
      toast({
        title: "Team required",
        description: "Please select a team",
        variant: "destructive",
      });
      return;
    }
    console.log("Selected Team "+ selectedTeam );
    if (!betAmount) {
      toast({
        title: "Invalid amount",
        description: "Empty Amount",
        variant: "destructive",
      });
      return;
    }
    console.log("Bet Amount "+ betAmount );
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to play",
        variant: "destructive",
      });
      return;
    }

    betMutation.mutate({
      matchId: match.id,
      selectedTeam,
      amount: parseInt(betAmount),
      userId: user.id,
    });
  };

  // Format date for display
  const formattedDate = format(new Date(match.matchDate), "MMMM d, yyyy");

  // Get team logos
  const team1Logo = teamLogos[match.team1] || defaultLogo;
  const team2Logo = teamLogos[match.team2] || defaultLogo;

  // Check if match is still bettable
  const isMatchBettable = new Date(match.matchDate) > new Date() && !match.winner && !match.isAbandoned;

  return (
    <div className="bet-card bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="bg-gradient-to-r from-primary to-primary-dark p-4 text-white">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">{formattedDate}</span>
          <span className="bg-accent text-primary px-2 py-0.5 rounded-full text-xs font-bold">
            {match.time}
          </span>
        </div>
        <p className="text-xs mt-1">{match.venue}</p>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 p-2 flex items-center justify-center">
              <div
                dangerouslySetInnerHTML={{ __html: team1Logo }}
                className="w-12 h-12"
              />
            </div>
            <p className="mt-2 font-semibold text-gray-800">{match.team1}</p>
            <p className="text-sm text-gray-500">({team1Odds}%)</p>
            <p className="text-sm text-gray-500">({team1Total})</p>

          </div>

          <div className="text-center">
            <div className="text-lg font-montserrat font-bold text-gray-400">
              VS
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 p-2 flex items-center justify-center">
              <div
                dangerouslySetInnerHTML={{ __html: team2Logo }}
                className="w-12 h-12"
              />
            </div>
            <p className="mt-2 font-semibold text-gray-800">{match.team2}</p>
            <p className="text-sm text-gray-500">({team2Odds}%)</p>
            <p className="text-sm text-gray-500">({team2Total})</p>
          </div>
        </div>

        {existingBet && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Your current guess: {existingBet.amount} on {existingBet.selectedTeam}
            </p>
          </div>
        )}

        {isMatchBettable ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Select value={selectedTeam || ""} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={match.team1}>{match.team1}</SelectItem>
                  <SelectItem value={match.team2}>{match.team2}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Select value={betAmount} onValueChange={setBetAmount}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handlePlaceBet}
                disabled={betMutation.isPending}
                className="bg-primary hover:bg-primary-dark text-white"
              >
                {existingBet ? "Update guess" : "Place guess"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 text-center">
            {match.winner ? (
              <p className="text-lg font-semibold text-primary">
                Winner: {match.winner}
              </p>
            ) : match.isAbandoned ? (
              <p className="text-lg font-semibold text-red-500">
                Match Abandoned
              </p>
            ) : (
              <p className="text-lg font-semibold text-gray-500">
                Match has started
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchCard;
