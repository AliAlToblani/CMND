
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { getInitials, splitFullName } from "@/utils/avatarUtils";

export const ProfileTab = () => {
  const { profile, loading, updating, updateProfile } = useProfile();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    if (profile) {
      const { firstName, lastName } = splitFullName(profile.full_name);
      setFormData({
        firstName,
        lastName,
        email: profile.email,
        phone: '', // We don't have phone in profiles table yet
        bio: '' // We don't have bio in profiles table yet
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    await updateProfile({
      full_name: fullName || null
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-slide-in">
      <h2 className="text-xl font-semibold mb-4">My Profile</h2>
      <div className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url || ""} alt="Profile" />
            <AvatarFallback className="text-2xl bg-doo-purple-500 text-white">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" className="glass-input mr-2">Change</Button>
            <Button variant="outline" className="glass-input text-destructive">Remove</Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input 
              id="firstName" 
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="glass-input" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input 
              id="lastName" 
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="glass-input" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={formData.email}
              disabled
              className="glass-input bg-muted/50 dark:bg-gray-800" 
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone" 
              type="tel" 
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="glass-input" 
              placeholder="Coming soon..."
              disabled
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea 
            id="bio" 
            rows={4} 
            className="glass-input" 
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Coming soon..."
            disabled
          />
        </div>
        
        <div className="pt-4 flex justify-end">
          <Button 
            className="glass-button"
            onClick={handleSave}
            disabled={updating}
          >
            {updating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
