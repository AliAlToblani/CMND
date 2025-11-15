import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { Badge } from "@/components/ui/badge";

interface Document {
  id: string;
  name: string;
  file_path: string;
  document_type: string;
  file_size: number;
  created_at: string;
  uploaded_by: string;
}

interface GeneratedDocument {
  id: string;
  document_type: string;
  file_path: string;
  format: string;
  generated_at: string;
  created_at: string;
}

interface CustomerDocumentsProps {
  customerId: string;
}

export const CustomerDocuments = ({ customerId }: CustomerDocumentsProps) => {
  const [uploadedDocuments, setUploadedDocuments] = useState<Document[]>([]);

  // Fetch uploaded documents from documents table
  const { data: documents, isLoading: isLoadingDocs, refetch } = useQuery({
    queryKey: ['customer-documents', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
    enabled: !!customerId,
  });

  // Fetch historical generated documents
  const { data: generatedDocs, isLoading: isLoadingGenerated } = useQuery({
    queryKey: ['generated-documents', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('customer_id', customerId)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return data as GeneratedDocument[];
    },
    enabled: !!customerId,
  });

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to download document",
          variant: "destructive"
        });
        return;
      }

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Document downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  const downloadGeneratedDocument = async (filePath: string, docType: string, format: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('customer-documents')
        .download(filePath);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to download document",
          variant: "destructive"
        });
        return;
      }

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${docType}.${format}`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Document downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  const handleDocumentsChange = (docs: Document[]) => {
    setUploadedDocuments(docs);
    refetch();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDocumentType = (type: string) => {
    const labels: Record<string, string> = {
      proposal: 'Customer Proposal',
      service_agreement: 'Service Agreement',
      sla: 'Service Level Agreement',
      quotation: 'Invoice/Quotation'
    };
    return labels[type] || type.replace('_', ' ');
  };

  const isLoading = isLoadingDocs || isLoadingGenerated;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Loading customer documents...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload contracts, invoices, agreements, and other customer documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUpload
            documents={documents || []}
            onDocumentsChange={handleDocumentsChange}
            entityType="customer"
            entityId={customerId}
          />
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      {documents && documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>
              {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <h4 className="font-medium">{doc.name}</h4>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {doc.document_type.replace('_', ' ')}
                        </Badge>
                        {doc.file_size > 0 && (
                          <span>{formatFileSize(doc.file_size)}</span>
                        )}
                        <span>•</span>
                        <span>Uploaded {formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadDocument(doc.file_path, doc.name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Generated Documents */}
      {generatedDocs && generatedDocs.length > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Previously Generated Documents</CardTitle>
            </div>
            <CardDescription>
              Historical auto-generated documents (read-only reference)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-dashed rounded-lg bg-muted/20"
                >
                  <div className="flex items-center space-x-3">
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        {formatDocumentType(doc.document_type)}
                      </h4>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline" className="uppercase">
                          {doc.format}
                        </Badge>
                        <span>•</span>
                        <span>Generated {formatDate(doc.generated_at || doc.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadGeneratedDocument(doc.file_path, doc.document_type, doc.format)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!documents || documents.length === 0) && (!generatedDocs || generatedDocs.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>No Documents</CardTitle>
            <CardDescription>
              No documents have been uploaded or generated for this customer yet.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};