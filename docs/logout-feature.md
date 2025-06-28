# Logout Feature Documentation

## Overview
The VDO Maker application now includes a comprehensive logout feature that provides multiple ways for users to securely sign out of their accounts.

## Features

### 🖱️ **User Interface**
- **Header Dropdown**: Click on the user's name in the header to reveal a dropdown menu with logout option
- **User Information**: Dropdown shows user's name and email before logout option
- **Confirmation Dialog**: Prevents accidental logout with a confirmation dialog
- **Visual Feedback**: Toast notifications for successful/failed logout attempts

### ⌨️ **Keyboard Shortcuts**
- **Windows/Linux**: `Ctrl + Shift + L`
- **macOS**: `Cmd + Shift + L`
- Shortcuts trigger the same confirmation dialog as the UI button

### 🔒 **Security Features**
- **Protected API Endpoint**: `/api/v1/auth/logout` requires valid JWT token
- **Complete Cleanup**: Removes JWT token from localStorage and memory
- **Session Invalidation**: Clears all authentication state
- **Additional Storage Cleanup**: Removes project cache and other sensitive data

### 🔧 **Technical Implementation**

#### Frontend Components
- **Header.tsx**: Enhanced with user dropdown and logout functionality
- **LogoutConfirmDialog.tsx**: Reusable confirmation dialog component
- **useKeyboardShortcuts.ts**: Custom hook for keyboard shortcut management

#### Backend Endpoints
- **POST /api/v1/auth/logout**: Protected endpoint for logout processing
- **Authentication Required**: Must include valid JWT token in Authorization header
- **Logging**: Records logout events for security monitoring

#### State Management
- **AuthStore**: Enhanced with async logout functionality
- **UI Store**: Toast notifications for user feedback
- **Cleanup**: Removes persisted auth state and project data

## Usage

### Method 1: UI Dropdown
1. Click on your name in the top-right corner of the header
2. Select "Sign Out" from the dropdown menu
3. Confirm logout in the dialog that appears
4. You'll be redirected to the login page with a success notification

### Method 2: Keyboard Shortcut
1. Press `Ctrl + Shift + L` (Windows/Linux) or `Cmd + Shift + L` (macOS)
2. Confirm logout in the dialog that appears
3. You'll be redirected to the login page with a success notification

## Error Handling

### Network Failures
- If the logout API call fails, the user is still logged out locally
- Error toast notification explains the situation
- User is redirected to login page regardless

### Token Issues
- Expired or invalid tokens are handled gracefully
- Local cleanup occurs even if server communication fails
- No user-facing errors for token-related issues

## API Reference

### Logout Endpoint
```http
POST /api/v1/auth/logout
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Success Response
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Access token required"
  }
}
```

## Development Notes

### Adding New Logout Cleanup
To add additional cleanup when users logout, modify the `logout` function in `authStore.ts`:

```typescript
logout: async () => {
  try {
    await apiClient.logout();
  } catch (error) {
    console.warn('Logout API call failed:', error);
  } finally {
    // Clear auth state
    set({
      user: null,
      isAuthenticated: false,
      error: null,
      isLoading: false,
    });

    // Add your custom cleanup here
    try {
      localStorage.removeItem('your-custom-data');
      // Clear other application state
    } catch (error) {
      console.warn('Failed to clear additional storage:', error);
    }
  }
}
```

### Customizing Keyboard Shortcuts
To modify or add keyboard shortcuts, update the `useKeyboardShortcuts` hook usage in `Header.tsx`:

```typescript
useKeyboardShortcuts([
  createLogoutShortcut(handleLogoutClick),
  createLogoutShortcutMac(handleLogoutClick),
  // Add custom shortcuts here
  {
    key: 'q',
    ctrlKey: true,
    callback: handleLogoutClick,
    description: 'Ctrl+Q: Quick logout'
  }
]);
```

## Testing

### Manual Testing
1. **UI Flow**: Test dropdown menu and confirmation dialog
2. **Keyboard Shortcuts**: Verify both Windows/Linux and macOS shortcuts
3. **Network Scenarios**: Test with network disconnected
4. **Token Expiry**: Test with expired tokens
5. **Multiple Tabs**: Verify logout affects all tabs

### Automated Testing
The logout functionality can be tested with:
- Unit tests for auth store logout function
- Integration tests for logout API endpoint
- E2E tests for complete logout flow

## Security Considerations

### Token Management
- JWT tokens are immediately removed from localStorage
- No token persistence after logout
- Server-side token validation on logout endpoint

### Session Security
- Complete cleanup prevents session hijacking
- Logout events are logged for security monitoring
- No sensitive data remains in browser storage

### Cross-Tab Behavior
- Logout in one tab affects authentication state globally
- Other tabs will detect the logout and redirect appropriately
- Consistent security across all application instances

## Troubleshooting

### Common Issues

**Logout button not appearing**
- Ensure user is properly authenticated
- Check if Header component is rendered
- Verify auth store state

**Keyboard shortcuts not working**
- Check if focus is on an input field
- Verify keyboard shortcut registration
- Test in different browsers

**API errors during logout**
- Check network connectivity
- Verify JWT token validity
- Review server logs for errors

**Incomplete cleanup**
- Check browser console for cleanup errors
- Verify localStorage permissions
- Review auth store cleanup logic
