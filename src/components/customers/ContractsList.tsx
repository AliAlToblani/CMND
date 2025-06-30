
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

export interface Contract {
  id?: string;
  name: string;
  value: number;
  start_date: string;
  end_date: string;
  status: "active" | "pending" | "expired" | "draft";
  terms?: string;
}

interface ContractsListProps {
  contracts: Contract[];
  onContractsChange: (contracts: Contract[]) => void;
  customerName?: string;
}

export const ContractsList: React.FC<ContractsListProps> = ({
  contracts,
  onContractsChange,
  customerName = "Customer"
}) => {
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddContract = () => {
    const newContract: Contract = {
      name: `Contract ${contracts.length + 1}`,
      value: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "draft",
      terms: ""
    };
    setEditingContract(newContract);
    setShowAddForm(true);
  };

  const handleSaveContract = (contract: Contract) => {
    if (showAddForm) {
      // Adding new contract
      onContractsChange([...contracts, contract]);
      setShowAddForm(false);
    } else {
      // Editing existing contract
      const updatedContracts = contracts.map(c => 
        c.id === contract.id ? contract : c
      );
      onContractsChange(updatedContracts);
    }
    setEditingContract(null);
  };

  const handleDeleteContract = (contractId: string | undefined) => {
    if (!contractId) return;
    const updatedContracts = contracts.filter(c => c.id !== contractId);
    onContractsChange(updatedContracts);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: Contract["status"]) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "expired": return "bg-red-100 text-red-800";
      case "draft": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const totalValue = contracts.reduce((sum, contract) => sum + contract.value, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contracts</h3>
        <Button onClick={handleAddContract} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Contract
        </Button>
      </div>

      {/* Total Value Summary */}
      {contracts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Total Contract Value</span>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(totalValue)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contracts List */}
      <div className="space-y-3">
        {contracts.map((contract, index) => (
          <Card key={contract.id || index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{contract.name}</h4>
                  <Badge className={getStatusColor(contract.status)}>
                    {contract.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingContract(contract);
                      setShowAddForm(false);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteContract(contract.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Value:</span>
                  <div className="font-medium">{formatCurrency(contract.value)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Start Date:</span>
                  <div className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(contract.start_date), "MMM dd, yyyy")}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">End Date:</span>
                  <div className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(contract.end_date), "MMM dd, yyyy")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contracts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <DollarSign className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts yet</h3>
              <p className="text-gray-600 mb-4">
                Add contracts to track values and renewal dates for {customerName}.
              </p>
              <Button onClick={handleAddContract}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Contract
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Contract Dialog */}
      {editingContract && (
        <ContractEditDialog
          contract={editingContract}
          isOpen={!!editingContract}
          onClose={() => {
            setEditingContract(null);
            setShowAddForm(false);
          }}
          onSave={handleSaveContract}
          isNewContract={showAddForm}
        />
      )}
    </div>
  );
};

// Contract Edit Dialog Component
interface ContractEditDialogProps {
  contract: Contract;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contract: Contract) => void;
  isNewContract: boolean;
}

const ContractEditDialog: React.FC<ContractEditDialogProps> = ({
  contract,
  isOpen,
  onClose,
  onSave,
  isNewContract
}) => {
  const [formData, setFormData] = useState<Contract>(contract);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {isNewContract ? "Add New Contract" : "Edit Contract"}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contract Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Value ($)</label>
            <input
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as Contract["status"]})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Terms (Optional)</label>
            <textarea
              value={formData.terms || ""}
              onChange={(e) => setFormData({...formData, terms: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter contract terms and conditions..."
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isNewContract ? "Add Contract" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
