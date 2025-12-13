#!/usr/bin/env node

/**
 * Profile Manager for Teams MCP
 * 
 * Supports multiple Microsoft tenant configurations and profiles
 * for different users or organizations
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Profile {
    name: string;
    clientId: string;
    tenantId?: string;
    description?: string;
    isDefault?: boolean;
    createdAt: string;
    lastUsed?: string;
}

export interface ProfileStore {
    profiles: Profile[];
    activeProfile: string | null;
}

export class ProfileManager {
    private configDir: string;
    private profilePath: string;
    private store: ProfileStore;

    constructor() {
        this.configDir = path.join(os.homedir(), '.teams-mcp');
        this.profilePath = path.join(this.configDir, 'profiles.json');
        
        // Ensure config directory exists
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
        
        this.store = this.loadProfiles();
    }

    /**
     * Load profiles from disk
     */
    private loadProfiles(): ProfileStore {
        if (fs.existsSync(this.profilePath)) {
            try {
                const data = fs.readFileSync(this.profilePath, 'utf-8');
                return JSON.parse(data);
            } catch (error) {
                console.error('Failed to load profiles, creating new store:', error);
            }
        }
        
        return {
            profiles: [],
            activeProfile: null
        };
    }

    /**
     * Save profiles to disk
     */
    private saveProfiles(): void {
        try {
            fs.writeFileSync(
                this.profilePath,
                JSON.stringify(this.store, null, 2),
                'utf-8'
            );
        } catch (error) {
            console.error('Failed to save profiles:', error);
            throw error;
        }
    }

    /**
     * Create a new profile
     */
    createProfile(name: string, clientId: string, tenantId?: string, description?: string): Profile {
        // Check if profile already exists
        const existing = this.store.profiles.find(p => p.name === name);
        if (existing) {
            throw new Error(`Profile '${name}' already exists`);
        }

        const profile: Profile = {
            name,
            clientId,
            tenantId,
            description,
            isDefault: this.store.profiles.length === 0, // First profile is default
            createdAt: new Date().toISOString()
        };

        this.store.profiles.push(profile);
        
        // Set as active if it's the first profile
        if (this.store.profiles.length === 1) {
            this.store.activeProfile = name;
        }
        
        this.saveProfiles();
        return profile;
    }

    /**
     * Get a profile by name
     */
    getProfile(name: string): Profile | null {
        return this.store.profiles.find(p => p.name === name) || null;
    }

    /**
     * Get all profiles
     */
    getAllProfiles(): Profile[] {
        return this.store.profiles;
    }

    /**
     * Get the active profile
     */
    getActiveProfile(): Profile | null {
        if (!this.store.activeProfile) {
            return null;
        }
        return this.getProfile(this.store.activeProfile);
    }

    /**
     * Set the active profile
     */
    setActiveProfile(name: string): void {
        const profile = this.getProfile(name);
        if (!profile) {
            throw new Error(`Profile '${name}' not found`);
        }

        this.store.activeProfile = name;
        
        // Update last used timestamp
        profile.lastUsed = new Date().toISOString();
        
        this.saveProfiles();
    }

    /**
     * Delete a profile
     */
    deleteProfile(name: string): void {
        const index = this.store.profiles.findIndex(p => p.name === name);
        if (index === -1) {
            throw new Error(`Profile '${name}' not found`);
        }

        this.store.profiles.splice(index, 1);

        // If we deleted the active profile, clear it
        if (this.store.activeProfile === name) {
            this.store.activeProfile = this.store.profiles.length > 0 
                ? this.store.profiles[0].name 
                : null;
        }

        this.saveProfiles();
    }

    /**
     * Update a profile
     */
    updateProfile(name: string, updates: Partial<Profile>): Profile {
        const profile = this.getProfile(name);
        if (!profile) {
            throw new Error(`Profile '${name}' not found`);
        }

        // Don't allow changing the name through this method
        delete updates.name;
        delete updates.createdAt;

        Object.assign(profile, updates);
        this.saveProfiles();
        
        return profile;
    }

    /**
     * Set default profile
     */
    setDefaultProfile(name: string): void {
        const profile = this.getProfile(name);
        if (!profile) {
            throw new Error(`Profile '${name}' not found`);
        }

        // Clear default from all profiles
        this.store.profiles.forEach(p => p.isDefault = false);
        
        // Set new default
        profile.isDefault = true;
        this.store.activeProfile = name;
        
        this.saveProfiles();
    }

    /**
     * List all profiles in a formatted way
     */
    listProfiles(): string {
        if (this.store.profiles.length === 0) {
            return 'No profiles found. Create one with: profile create <name>';
        }

        const lines: string[] = ['Available Profiles:', ''];
        
        this.store.profiles.forEach(profile => {
            const active = this.store.activeProfile === profile.name ? ' (active)' : '';
            const defaultMark = profile.isDefault ? ' [default]' : '';
            
            lines.push(`  ${profile.name}${active}${defaultMark}`);
            
            if (profile.description) {
                lines.push(`    Description: ${profile.description}`);
            }
            
            lines.push(`    Client ID: ${profile.clientId}`);
            
            if (profile.tenantId) {
                lines.push(`    Tenant ID: ${profile.tenantId}`);
            }
            
            if (profile.lastUsed) {
                lines.push(`    Last used: ${new Date(profile.lastUsed).toLocaleString()}`);
            }
            
            lines.push('');
        });

        return lines.join('\n');
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    const manager = new ProfileManager();

    switch (command) {
        case 'create':
            const [, name, clientId, tenantId, description] = args;
            if (!name || !clientId) {
                console.error('Usage: profile create <name> <clientId> [tenantId] [description]');
                process.exit(1);
            }
            try {
                const profile = manager.createProfile(name, clientId, tenantId, description);
                console.log(`Profile '${name}' created successfully`);
                console.log(JSON.stringify(profile, null, 2));
            } catch (error) {
                console.error('Error:', error instanceof Error ? error.message : String(error));
                process.exit(1);
            }
            break;

        case 'list':
            console.log(manager.listProfiles());
            break;

        case 'get':
            const profileName = args[1];
            if (!profileName) {
                console.error('Usage: profile get <name>');
                process.exit(1);
            }
            const profile = manager.getProfile(profileName);
            if (profile) {
                console.log(JSON.stringify(profile, null, 2));
            } else {
                console.error(`Profile '${profileName}' not found`);
                process.exit(1);
            }
            break;

        case 'use':
        case 'activate':
            const activeName = args[1];
            if (!activeName) {
                console.error('Usage: profile use <name>');
                process.exit(1);
            }
            try {
                manager.setActiveProfile(activeName);
                console.log(`Switched to profile '${activeName}'`);
            } catch (error) {
                console.error('Error:', error instanceof Error ? error.message : String(error));
                process.exit(1);
            }
            break;

        case 'delete':
        case 'remove':
            const deleteName = args[1];
            if (!deleteName) {
                console.error('Usage: profile delete <name>');
                process.exit(1);
            }
            try {
                manager.deleteProfile(deleteName);
                console.log(`Profile '${deleteName}' deleted successfully`);
            } catch (error) {
                console.error('Error:', error instanceof Error ? error.message : String(error));
                process.exit(1);
            }
            break;

        case 'default':
            const defaultName = args[1];
            if (!defaultName) {
                console.error('Usage: profile default <name>');
                process.exit(1);
            }
            try {
                manager.setDefaultProfile(defaultName);
                console.log(`Set '${defaultName}' as default profile`);
            } catch (error) {
                console.error('Error:', error instanceof Error ? error.message : String(error));
                process.exit(1);
            }
            break;

        case 'active':
        case 'current':
            const active = manager.getActiveProfile();
            if (active) {
                console.log('Active profile:');
                console.log(JSON.stringify(active, null, 2));
            } else {
                console.log('No active profile');
            }
            break;

        default:
            console.log('Teams MCP Profile Manager\n');
            console.log('Commands:');
            console.log('  create <name> <clientId> [tenantId] [description]  Create a new profile');
            console.log('  list                                               List all profiles');
            console.log('  get <name>                                         Get profile details');
            console.log('  use <name>                                         Activate a profile');
            console.log('  delete <name>                                      Delete a profile');
            console.log('  default <name>                                     Set default profile');
            console.log('  active                                             Show active profile');
            console.log('  help                                               Show this help\n');
            console.log('Examples:');
            console.log('  node profileManager.js create work 14d82eec-204b-4c2f-b7e8-296a70dab67e');
            console.log('  node profileManager.js list');
            console.log('  node profileManager.js use work');
            break;
    }
}

// Export for use in other modules
export default ProfileManager;

// Run CLI if called directly
if (require.main === module) {
    main().catch(console.error);
}
