import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Match, InsertBet } from "@shared/schema";
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
} from "@/components/ui/select"; { SelectTrigger } from "@/components/ui/select-trigger";
import { format } from "date-fns";

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

  const betMutation = useMutation({
    mutationFn: async (betData: InsertBet) => {
      const res = await apiRequest("POST", "/api/bets", betData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bet Placed!",
        description: `You bet ₹${betAmount} on ${selectedTeam}`,
      });

      // Clear form state
      setSelectedTeam(null);
      setBetAmount("");

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place bet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePlaceBet = () => {
    if (!selectedTeam) {
      toast({
        title: "Team required",
        description: "Please select a team to bet on",
        variant: "destructive",
      });
      return;
    }

    if (!betAmount) {
      toast({
        title: "Invalid amount",
        description: "Empty Amount",
        variant: "destructive",
      });
      return;
    }

    betMutation.mutate({
      matchId: match.id,
      selectedTeam,
      amount: parseInt(betAmount),
      userId: 0, // This will be set by the server based on the authenticated user
    });
  };

  // Format date for display
  const formattedDate = format(new Date(match.matchDate), "MMMM d, yyyy");

  // Get team logos
  const team1Logo = teamLogos[match.team1] || defaultLogo;
  const team2Logo = teamLogos[match.team2] || defaultLogo;

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
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-gray-500 mb-3">
            Place Your Bet
          </h4>
          <div className="flex">
            <Button
              variant={selectedTeam === match.team1 ? "default" : "outline"}
              className={`flex-1 mr-2 py-2 px-4 ${
                selectedTeam === match.team1
                  ? "bg-primary text-white"
                  : "bg-white border border-primary text-primary hover:bg-primary hover:text-white"
              } rounded-lg transition-colors duration-300`}
              onClick={() => setSelectedTeam(match.team1)}
            >
              {match.team1}
            </Button>
            <Button
              variant={selectedTeam === match.team2 ? "default" : "outline"}
              className={`flex-1 py-2 px-4 ${
                selectedTeam === match.team2
                  ? "bg-secondary text-white"
                  : "bg-white border border-secondary text-secondary hover:bg-secondary hover:text-white"
              } rounded-lg transition-colors duration-300`}
              onClick={() => setSelectedTeam(match.team2)}
            >
              {match.team2}
            </Button>
          </div>
          <div className="mt-3">
            <Select value={betAmount} onValueChange={setBetAmount}>
              <SelectTrigger className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                <SelectValue placeholder="Select bet amount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="mt-3 w-full py-2 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors duration-300"
            onClick={handlePlaceBet}
            disabled={betMutation.isPending}
          >
            {betMutation.isPending ? "Processing..." : "Confirm Bet"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
