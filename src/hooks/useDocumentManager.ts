
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Document } from "@/components/documents/DocumentUpload";
import { useToast } from "@/hooks/use-toast";

type DbDocument = {
  id: string;
  name: string;
  file_path: string;
  document_type: string;
  file_size: number | null;
  created_at: string;
  customer_id?: string;
  partnership_id?: string;
};

type DocumentInsert = {
  name: string;
  file_path: string;
  document_type: string;
  file_size: number;
  customer_id?: string;
  partnership_id?: string;
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
        const tableName = entityType === "customer" ? "documents" : "partnership_documents";
        const columnName = entityType === "customer" ? "customer_id" : "partnership_id";

        const query = supabase
          .from(tableName)
          .select('*')
          .eq(columnName, entityId)
          .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
          console.error('Error loading documents:', error);
          return;
        }

        if (data) {
          const mappedDocuments: Document[] = (data as DbDocument[]).map((doc) => ({
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
      const tableName = entityType === "customer" ? "documents" : "partnership_documents";
      const columnName = entityType === "customer" ? "customer_id" : "partnership_id";

      // Get existing documents in database
      const existingQuery = supabase
        .from(tableName)
        .select('id, file_path')
        .eq(columnName, entityId);

      const { data: existingDocs } = await existingQuery;

      const existingFilePaths = new Set(existingDocs?.map(doc => doc.file_path) || []);
      const newDocuments = documentsToSave.filter(doc => !doc.id && !existingFilePaths.has(doc.file_path));

      // Insert new documents
      if (newDocuments.length > 0) {
        if (entityType === "customer") {
          const documentsToInsert: DocumentInsert[] = newDocuments.map(doc => ({
            customer_id: entityId,
            name: doc.name,
            file_path: doc.file_path,
            document_type: doc.document_type,
            file_size: doc.file_size || 0
          }));

          const insertQuery = supabase
            .from('documents')
            .insert(documentsToInsert);

          const { error } = await insertQuery;

          if (error) {
            console.error('Error saving documents:', error);
            toast({
              title: "Error saving documents",
              description: "Some documents may not have been saved properly.",
              variant: "destructive"
            });
          }
        } else {
          const documentsToInsert: DocumentInsert[] = newDocuments.map(doc => ({
            partnership_id: entityId,
            name: doc.name,
            file_path: doc.file_path,
            document_type: doc.document_type,
            file_size: doc.file_size || 0
          }));

          const insertQuery = supabase
            .from('partnership_documents')
            .insert(documentsToInsert);

          const { error } = await insertQuery;

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
        const updateQuery = supabase
          .from(tableName)
          .update({
            document_type: doc.document_type,
            name: doc.name
          })
          .eq('id', doc.id);

        const { error } = await updateQuery;

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
