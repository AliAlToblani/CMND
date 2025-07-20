
export const getInitials = (fullName: string | null | undefined): string => {
  if (!fullName || fullName.trim() === '') {
    return '??';
  }

  const nameParts = fullName.trim().split(' ');
  
  if (nameParts.length === 1) {
    // If only one name, use first two characters
    return nameParts[0].substring(0, 2).toUpperCase();
  }
  
  // Use first letter of first name and first letter of last name
  const firstInitial = nameParts[0].charAt(0);
  const lastInitial = nameParts[nameParts.length - 1].charAt(0);
  
  return (firstInitial + lastInitial).toUpperCase();
};

export const splitFullName = (fullName: string | null | undefined): { firstName: string; lastName: string } => {
  if (!fullName || fullName.trim() === '') {
    return { firstName: '', lastName: '' };
  }

  const nameParts = fullName.trim().split(' ');
  
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  }
  
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  
  return { firstName, lastName };
};
