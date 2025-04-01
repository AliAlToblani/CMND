
export interface Notification {
  id: string;
  type: 'lifecycle' | 'customer' | 'deadline' | 'contract' | 'team';
  title: string;
  message: string;
  is_read: boolean;
  related_id?: string;
  related_type?: string;
  created_at: string;
  updated_at?: string;
}
