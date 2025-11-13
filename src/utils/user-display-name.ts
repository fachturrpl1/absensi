/**
 * Utility functions for handling user display names
 * Provides consistent logic for displaying user names across the application
 */

interface UserNameData {
  display_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

/**
 * Get user's display name with fallback logic
 * Priority: display_name > first_name + middle_name + last_name > email > 'User'
 * 
 * @param user - User data object containing name fields
 * @returns The display name to show in UI
 */
export function getUserDisplayName(user?: UserNameData | null): string {
  if (!user) return 'User';

  // Check display_name first
  const displayName = user.display_name?.trim();
  if (displayName && displayName.length > 0) {
    return displayName;
  }

  // Fallback to first_name + middle_name + last_name
  const nameParts = [
    user.first_name?.trim(),
    user.middle_name?.trim(),
    user.last_name?.trim(),
  ].filter(part => part && part.length > 0);

  if (nameParts.length > 0) {
    return nameParts.join(' ');
  }

  // Final fallback to email or 'User'
  const email = user.email?.trim();
  return email && email.length > 0 ? email : 'User';
}

/**
 * Get user's short display name (for small UI elements)
 * Priority: display_name > first_name + last_name > first_name > email > 'User'
 * 
 * @param user - User data object containing name fields
 * @returns Short display name (without middle name)
 */
export function getUserShortDisplayName(user?: UserNameData | null): string {
  if (!user) return 'User';

  // Check display_name first
  const displayName = user.display_name?.trim();
  if (displayName && displayName.length > 0) {
    return displayName;
  }

  // Fallback to first_name + last_name (no middle name)
  const firstName = user.first_name?.trim();
  const lastName = user.last_name?.trim();

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) {
    return firstName;
  }

  // Final fallback to email or 'User'
  const email = user.email?.trim();
  return email && email.length > 0 ? email : 'User';
}

/**
 * Get user's formal display name (for formal contexts)
 * Priority: last_name, first_name middle_name > display_name > email > 'User'
 * Example: "Doe, John Michael"
 * 
 * @param user - User data object containing name fields
 * @returns Formal display name
 */
export function getUserFormalDisplayName(user?: UserNameData | null): string {
  if (!user) return 'User';

  const firstName = user.first_name?.trim();
  const middleName = user.middle_name?.trim();
  const lastName = user.last_name?.trim();

  if (lastName && firstName) {
    const middlePart = middleName ? ` ${middleName}` : '';
    return `${lastName}, ${firstName}${middlePart}`;
  }

  // Fallback to display_name if formal name not available
  const displayName = user.display_name?.trim();
  if (displayName && displayName.length > 0) {
    return displayName;
  }

  // Final fallback to email or 'User'
  const email = user.email?.trim();
  return email && email.length > 0 ? email : 'User';
}
