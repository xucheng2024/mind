# Environment Variables Setup

This document explains how to configure environment variables for the AppClinic project.

## Required Environment Variables

### 1. Encryption Key
```bash
VITE_AES_KEY=your-secure-aes-encryption-key-here-32-chars
```
- **Purpose**: Used for encrypting sensitive user data (names, phone numbers, addresses, etc.)
- **Format**: Must be exactly 32 characters
- **Security**: Keep this key secure and never commit it to version control
- **Example**: `VITE_AES_KEY=Qw8zT1pL6vB2nX4rS7yD9eF3hJ5kM8pR`

### 2. Supabase Configuration
```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
- **Purpose**: Database connection and authentication
- **Get from**: Your Supabase project dashboard
- **Example**: 
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

## Optional Environment Variables

### 3. App Configuration
```bash
VITE_APP_NAME=AppClinic
VITE_APP_VERSION=1.3.0
```
- **Purpose**: App metadata and versioning
- **Default**: AppClinic / 1.3.0

### 4. Email Service (Optional)
```bash
RESEND_API_KEY=your-resend-api-key
```
- **Purpose**: Email notifications (if using Resend service)
- **Optional**: Only needed if email features are enabled

## Setup Instructions

1. **Copy Environment Template**:
   ```bash
   cp .env.example .env
   ```

2. **Fill in Your Values**:
   - Replace placeholder values with your actual configuration
   - Ensure `VITE_AES_KEY` is exactly 32 characters
   - Get Supabase credentials from your project dashboard

3. **Verify Configuration**:
   - Start the development server
   - Check browser console for configuration validation messages
   - Should see: `✅ Environment configuration validated`

## Security Best Practices

1. **Never commit .env files**:
   - `.env` files are already in `.gitignore`
   - Use `.env.example` for templates

2. **Use strong encryption keys**:
   - Generate random 32-character strings
   - Use different keys for development and production

3. **Rotate keys regularly**:
   - Change encryption keys periodically
   - Update all environments when rotating

4. **Environment-specific configs**:
   - Use different keys for dev/staging/production
   - Never use production keys in development

## Troubleshooting

### Configuration Validation Failed
- Check that all required variables are set
- Ensure `VITE_AES_KEY` is exactly 32 characters
- Verify Supabase credentials are correct

### Encryption Errors
- Verify `VITE_AES_KEY` is consistent across environments
- Check that the key hasn't been changed after data was encrypted

### Database Connection Issues
- Verify Supabase URL and key are correct
- Check network connectivity
- Ensure Supabase project is active

## Development vs Production

### Development
```bash
# .env.local (for local development)
VITE_AES_KEY=dev-key-32-chars-long-dev-key
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-anon-key
```

### Production
```bash
# Set in your hosting platform (Vercel, Netlify, etc.)
VITE_AES_KEY=prod-key-32-chars-long-prod-key
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key
```

## Key Management

### Generating Secure Keys
```bash
# Generate a random 32-character string
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Key Rotation Process
1. Generate new encryption key
2. Update environment variables
3. Re-encrypt existing data (if needed)
4. Deploy with new key
5. Remove old key from environment

## Support

If you encounter issues with environment configuration:
1. Check browser console for validation messages
2. Verify all required variables are set
3. Ensure no typos in variable names
4. Test with a fresh `.env` file 