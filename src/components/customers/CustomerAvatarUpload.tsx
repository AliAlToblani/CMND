
import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CustomerAvatarUploadProps {
  value?: string;
  onChange: (url: string) => void;
  customerName: string;
  className?: string;
}

export interface CustomerAvatarUploadRef {
  getPendingValue: () => string;
  hasPendingChanges: () => boolean;
  applyPendingChanges: () => void;
}

export const CustomerAvatarUpload = forwardRef<CustomerAvatarUploadRef, CustomerAvatarUploadProps>(({ 
  value, 
  onChange, 
  customerName, 
  className = "" 
}, ref) => {
  const [isUploading, setIsUploading] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getPendingValue: () => {
      if (pendingRemoval) return "";
      if (pendingUrl) return pendingUrl;
      return value || "";
    },
    hasPendingChanges: () => {
      return !!(pendingUrl || pendingRemoval);
    },
    applyPendingChanges: () => {
      if (pendingUrl) {
        onChange(pendingUrl);
        setPendingUrl(null);
        setPendingRemoval(false);
      } else if (pendingRemoval) {
        onChange("");
        setPendingUrl(null);
        setPendingRemoval(false);
      }
    }
  }));

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPG, PNG, or SVG)");
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setIsUploading(true);
    
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('customer-avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('customer-avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;
      
      // Store the uploaded URL temporarily - DO NOT call onChange
      setPendingUrl(publicUrl);
      setPendingRemoval(false);
      toast.success("Profile image uploaded successfully! Changes will be saved when you submit the form.");
      
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    const urlToRemove = pendingUrl || value;
    
    if (urlToRemove) {
      try {
        // Extract filename from URL to delete from storage
        const url = new URL(urlToRemove);
        const filePath = url.pathname.split('/').pop();
        
        if (filePath) {
          await supabase.storage
            .from('customer-avatars')
            .remove([filePath]);
        }
      } catch (error) {
        console.error("Error removing file:", error);
      }
    }
    
    // Set pending removal state - DO NOT call onChange
    setPendingUrl(null);
    setPendingRemoval(true);
    toast.success("Profile image will be removed when you submit the form.");
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Determine what image to show
  const currentImage = pendingRemoval ? null : (pendingUrl || value);
  const hasPendingChanges = pendingUrl || pendingRemoval;

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      <div className="relative">
        <Avatar className="h-20 w-20 cursor-pointer border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors" onClick={handleClick}>
          <AvatarImage src={currentImage} alt={customerName} />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-lg">
            {customerName ? getInitials(customerName) : "?"}
          </AvatarFallback>
        </Avatar>
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
        
        {currentImage && !isUploading && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <div className="flex flex-col items-center space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={isUploading}
          className="flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>{currentImage ? "Change Image" : "Upload Image"}</span>
        </Button>
        
        {hasPendingChanges && (
          <div className="text-xs text-orange-600 dark:text-orange-400 text-center font-medium">
            {pendingUrl && "New image ready"}
            {pendingRemoval && "Image will be removed"}
            <br />
            Submit form to apply changes
          </div>
        )}
        
        <p className="text-xs text-muted-foreground text-center">
          PNG, JPG, SVG up to 2MB<br />
          Square images work best
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
});

CustomerAvatarUpload.displayName = "CustomerAvatarUpload";
