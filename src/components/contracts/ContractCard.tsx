import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, FileText } from "lucide-react";
import { formatCurrency } from "@/utils/customerUtils";
import { useNavigate } from "react-router-dom";

interface ContractCardProps {
  contract: {
    id: string;
    name: string;
    value: number;
    start_date?: string;
    end_date?: string;
    status?: string;
    customer_name: string;
    customer_id: string;
  };
}

export function ContractCard({ contract }: ContractCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/customers/${contract.customer_id}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-success text-success-foreground";
      case "pending":
        return "bg-warning text-warning-foreground";
      case "expired":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow bg-card hover:bg-accent/50"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm line-clamp-1">
                {contract.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {contract.customer_name}
              </p>
            </div>
            {contract.status && (
              <Badge 
                variant="secondary" 
                className={`text-xs ${getStatusColor(contract.status)}`}
              >
                {contract.status}
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>{formatCurrency(contract.value, false)}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(contract.start_date)}</span>
            </div>

            {contract.end_date && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>Expires: {formatDate(contract.end_date)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}