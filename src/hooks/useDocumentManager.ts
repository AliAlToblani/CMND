
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Document } from "@/components/documents/DocumentUpload";
import { useToast } from "@/hooks/use-toast";

type CustomerDocumentInsert = {
  name: string;
  file_path: string;
  document_type: string;
  file_size: number;
  customer_id: string;
};

type PartnershipDocumentInsert = {
  name: string;
  file_path: string;
  document_type: string;
  file_size: number;
  partnership_id: string;
};

export function useDocumentManager(entityId?: string, entityType: "customer" | "partnership" = "customer") {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load existing documents
  useEffect(() => {
    if (!entityId) return;

    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        let data: any[] | null = null;
        let error: any = null;

        if (entityType === "customer") {
          const result = await supabase
            .from('documents')
            .select('*')
            .eq('customer_id', entityId)
            .order('created_at', { ascending: false });
          data = result.data;
          error = result.error;
        } else {
          const result = await supabase
            .from('partnership_documents')
            .select('*')
            .eq('partnership_id', entityId)
            .order('created_at', { ascending: false });
          data = result.data;
          error = result.error;
        }

        if (error) {
          console.error('Error loading documents:', error);
          return;
        }

        if (data) {
          const mappedDocuments: Document[] = data.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            file_path: doc.file_path,
            document_type: doc.document_type,
            file_size: doc.file_size || 0,
            created_at: doc.created_at
          }));
          setDocuments(mappedDocuments);
        }
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, [entityId, entityType]);

  // Save documents to database
  const saveDocuments = async (entityId: string, documentsToSave: Document[]) => {
    try {
      // Get existing documents in database
      let existingDocs: any[] | null = null;

      if (entityType === "customer") {
        const result = await supabase
          .from('documents')
          .select('id, file_path')
          .eq('customer_id', entityId);
        existingDocs = result.data;
      } else {
        const result = await supabase
          .from('partnership_documents')
          .select('id, file_path')
          .eq('partnership_id', entityId);
        existingDocs = result.data;
      }

      const existingFilePaths = new Set(existingDocs?.map(doc => doc.file_path) || []);
      const newDocuments = documentsToSave.filter(doc => !doc.id && !existingFilePaths.has(doc.file_path));

      // Insert new documents
      if (newDocuments.length > 0) {
        if (entityType === "customer") {
          const documentsToInsert: CustomerDocumentInsert[] = newDocuments.map(doc => ({
            customer_id: entityId,
            name: doc.name,
            file_path: doc.file_path,
            document_type: doc.document_type,
            file_size: doc.file_size || 0
          }));

          const { error } = await supabase
            .from('documents')
            .insert(documentsToInsert);

          if (error) {
            console.error('Error saving documents:', error);
            toast({
              title: "Error saving documents",
              description: "Some documents may not have been saved properly.",
              variant: "destructive"
            });
          }
        } else {
          const documentsToInsert: PartnershipDocumentInsert[] = newDocuments.map(doc => ({
            partnership_id: entityId,
            name: doc.name,
            file_path: doc.file_path,
            document_type: doc.document_type,
            file_size: doc.file_size || 0
          }));

          const { error } = await supabase
            .from('partnership_documents')
            .insert(documentsToInsert);

          if (error) {
            console.error('Error saving documents:', error);
            toast({
              title: "Error saving documents",
              description: "Some documents may not have been saved properly.",
              variant: "destructive"
            });
          }
        }
      }

      // Update existing documents (for document type changes)
      const existingDocsToUpdate = documentsToSave.filter(doc => doc.id);
      for (const doc of existingDocsToUpdate) {
        const tableName = entityType === "customer" ? "documents" : "partnership_documents";
        
        const { error } = await supabase
          .from(tableName)
          .update({
            document_type: doc.document_type,
            name: doc.name
          })
          .eq('id', doc.id);

        if (error) {
          console.error('Error updating document:', error);
        }
      }

    } catch (error) {
      console.error('Error in saveDocuments:', error);
      toast({
        title: "Error",
        description: "Failed to save documents.",
        variant: "destructive"
      });
    }
  };

  return {
    documents,
    setDocuments,
    isLoading,
    saveDocuments
  };
}
