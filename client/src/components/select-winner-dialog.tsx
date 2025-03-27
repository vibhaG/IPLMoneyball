import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

interface SelectWinnerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (winner: string | null) => void;
  team1: string;
  team2: string;
}

const SelectWinnerDialog = ({ isOpen, onClose, onSelect, team1, team2 }: SelectWinnerDialogProps) => {
  const [value, setValue] = useState<string>("3");

  // Reset value when dialog opens
  useEffect(() => {
    if (isOpen) {
      setValue("3");
    }
  }, [isOpen]);

  const handleValueChange = (newValue: string) => {
    if (newValue === "1") {
      onSelect(team1);
    } else if (newValue === "2") {
      onSelect(team2);
    } else if (newValue === "3") {
      onSelect(null);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Match Winner</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Select value={value} onValueChange={handleValueChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select winner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{team1}</SelectItem>
              <SelectItem value="2">{team2}</SelectItem>
              <SelectItem value="3">No Result</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectWinnerDialog; 