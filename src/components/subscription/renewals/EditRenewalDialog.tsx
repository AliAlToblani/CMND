
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Edit } from "lucide-react";

interface EditRenewalDialogProps {
  customerId: string;
  customerName: string;
  currentDate?: string | null;
  onUpdateDate: (customerId: string, newDate: string, customerName: string) => void;
}

export const EditRenewalDialog: React.FC<EditRenewalDialogProps> = ({
  customerId,
  customerName,
  currentDate,
  onUpdateDate
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    currentDate ? new Date(currentDate) : undefined
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      onUpdateDate(customerId, formattedDate, customerName);
      setIsOpen(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-1">
          <Edit className="h-3 w-3" />
          Edit Renewal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Renewal Date</DialogTitle>
          <DialogDescription>
            Update the renewal date for {customerName}. The original date will be saved for historical tracking.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="current-date">Current Renewal Date (Read-only)</Label>
            <Input
              id="current-date"
              value={formatDate(currentDate)}
              disabled
              className="bg-muted/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">New Renewal Date</Label>
            <DatePicker
              date={selectedDate}
              onDateChange={setSelectedDate}
              placeholder="Select new renewal date"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedDate}>
            Save New Date
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
