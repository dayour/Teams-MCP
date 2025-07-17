#!/usr/bin/env node

import { PublicClientApplication } from '@azure/msal-node';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const DEVICE_CODE_CLIENT_ID = '14d82eec-204b-4c2f-b7e0-446a91523b50'; // Microsoft Graph Command Line Tools
const SCOPES = [
    'https://graph.microsoft.com/Calendar.ReadWrite',
    'https://graph.microsoft.com/Calendars.Read.Shared',
    'https://graph.microsoft.com/Place.Read.All',
    'https://graph.microsoft.com/User.Read'
];

/**
 * Device Authentication Helper for Teams MCP
 * 
 * Uses device code flow to authenticate with Microsoft Graph
 * without requiring app registration.
 */
class DeviceAuthHelper {
    private pca: PublicClientApplication;
    private tokenCachePath: string;

    constructor() {
        // Create token cache directory
        const cacheDir = path.join(os.homedir(), '.teams-mcp');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        this.tokenCachePath = path.join(cacheDir, 'token-cache.json');

        // Initialize MSAL
        this.pca = new PublicClientApplication({
            auth: {
                clientId: DEVICE_CODE_CLIENT_ID,
                authority: 'https://login.microsoftonline.com/common',
            },
            cache: {
                cachePlugin: this.createCachePlugin()
            }
        });
    }

    private createCachePlugin() {
        return {
            beforeCacheAccess: async (cacheContext: any) => {
                if (fs.existsSync(this.tokenCachePath)) {
                    const cacheData = fs.readFileSync(this.tokenCachePath, 'utf-8');
                    cacheContext.tokenCache.deserialize(cacheData);
                }
            },
            afterCacheAccess: async (cacheContext: any) => {
                if (cacheContext.tokenCache.hasChanged()) {
                    fs.writeFileSync(
                        this.tokenCachePath,
                        cacheContext.tokenCache.serialize()
                    );
                }
            }
        };
    }

    async authenticate(): Promise<string> {
        try {
            // Try to get token silently first
            const accounts = await this.pca.getTokenCache().getAllAccounts();
            
            if (accounts.length > 0) {
                try {
                    const result = await this.pca.acquireTokenSilent({
                        scopes: SCOPES,
                        account: accounts[0]
                    });
                    console.log('✅ Using cached authentication');
                    return result.accessToken;
                } catch (error) {
                    console.log('ℹ️  Cached token expired, starting new authentication...');
                }
            }

            // Start device code flow
            const deviceCodeRequest = {
                scopes: SCOPES,
                deviceCodeCallback: (response: any) => {
                    console.log('\n🔐 Microsoft Authentication Required');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log(`📋 Device Code: ${response.userCode}`);
                    console.log(`🌐 Please visit: ${response.verificationUri}`);
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('1. Open the URL above in your browser');
                    console.log('2. Enter the device code when prompted');
                    console.log('3. Sign in with your Microsoft account');
                    console.log('4. Grant permissions for Teams MCP');
                    console.log('\n⏳ Waiting for authentication...');
                }
            };

            const result = await this.pca.acquireTokenByDeviceCode(deviceCodeRequest);
            if (result) {
                console.log('\n✅ Authentication successful!');
                console.log(`👤 Signed in as: ${result.account?.username}`);
                
                return result.accessToken;
            } else {
                throw new Error('Authentication failed: No result returned');
            }

        } catch (error) {
            console.error('\n❌ Authentication failed:', error);
            throw error;
        }
    }

    async getStoredToken(): Promise<string | null> {
        try {
            const accounts = await this.pca.getTokenCache().getAllAccounts();
            
            if (accounts.length > 0) {
                const result = await this.pca.acquireTokenSilent({
                    scopes: SCOPES,
                    account: accounts[0]
                });
                return result.accessToken;
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    async clearCache(): Promise<void> {
        if (fs.existsSync(this.tokenCachePath)) {
            fs.unlinkSync(this.tokenCachePath);
        }
        console.log('🗑️  Authentication cache cleared');
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'auth';

    const authHelper = new DeviceAuthHelper();

    switch (command) {
        case 'auth':
        case 'authenticate':
            try {
                await authHelper.authenticate();
                console.log('\n🎉 Teams MCP is now ready to use!');
            } catch (error) {
                console.error('Authentication failed:', error);
                process.exit(1);
            }
            break;

        case 'check':
            const token = await authHelper.getStoredToken();
            if (token) {
                console.log('✅ Valid authentication found');
            } else {
                console.log('❌ No valid authentication found');
                process.exit(1);
            }
            break;

        case 'clear':
            await authHelper.clearCache();
            break;

        default:
            console.log(`
Teams MCP Authentication Helper

Usage:
  auth-helper auth     - Start authentication flow
  auth-helper check    - Check if authenticated
  auth-helper clear    - Clear authentication cache

Examples:
  node auth-helper.js auth
  node auth-helper.js check
            `);
            break;
    }
}

// Export for use in extension
export { DeviceAuthHelper };

// Run CLI if called directly
if (require.main === module) {
    main().catch(console.error);
}