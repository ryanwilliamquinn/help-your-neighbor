// Supabase API service implementation
import { supabase } from '@/lib/supabase';
import type { ApiService } from './index';
import type {
  User,
  Group,
  Request,
  Invite,
  PendingInvitation,
  AuthResponse,
  CreateRequestForm,
  UserProfileForm,
  RequestStatus,
  UserLimits,
  UserCounts,
  UserLimitsWithCounts,
  AdminMetrics,
  EmailPreferences,
  EmailPreferencesForm,
} from '@/types';
import { getEnvVar } from '@/config/env.js';

export class SupabaseApiService implements ApiService {
  constructor() {
    // Set up auth state listener if in browser environment
    if (typeof window !== 'undefined' && supabase) {
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
          // Clear any local state if needed
        }
      });
    }
  }

  // Auth services
  async signUp(email: string, password: string): Promise<AuthResponse> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Use environment variable for redirect URL, fallback to current origin
    const redirectUrl = getEnvVar('VITE_AUTH_REDIRECT_URL')
      ? `${getEnvVar('VITE_AUTH_REDIRECT_URL')}/auth/callback`
      : `${window.location.origin}/auth/callback`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          email,
          name: '',
          phone: '',
          general_area: '',
        },
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('User creation failed');
    }

    // For signup, just return a basic user object
    // The profile will be created when they first update their profile
    const basicUser = {
      id: data.user.id,
      email: data.user.email || email,
      name: '',
      phone: '',
      generalArea: '',
      isAdmin: false,
      createdAt: new Date(),
    };

    // Check if email confirmation is required (session will be null)
    const emailConfirmationRequired = !data.session;

    return {
      user: basicUser,
      session: data.session?.access_token || null,
      emailConfirmationRequired,
    };
  }

  async resendConfirmationEmail(email: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Use environment variable for redirect URL, fallback to current origin
    const redirectUrl = getEnvVar('VITE_AUTH_REDIRECT_URL')
      ? `${getEnvVar('VITE_AUTH_REDIRECT_URL')}/auth/callback`
      : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Authentication failed');
    }

    const user = await this.getCurrentUser();

    return {
      user,
      session: data.session?.access_token || '',
    };
  }

  async signOut(): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  async resetPassword(email: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async updatePassword(password: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async verifyEmailToken(tokenHash: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'signup',
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  // User services
  async getCurrentUser(): Promise<User> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // If user profile doesn't exist, create one with basic info from auth
      if (error.code === 'PGRST116') {
        const newUser: User = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || '',
          phone: user.user_metadata?.phone || '',
          generalArea: user.user_metadata?.general_area || '',
          isAdmin: false,
          createdAt: new Date(),
        };

        const { error: insertError } = await supabase.from('users').insert([
          {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            phone: newUser.phone,
            general_area: newUser.generalArea,
          },
        ]);

        if (insertError) {
          throw new Error('Failed to create user profile');
        }

        return newUser;
      }
      throw new Error(error.message);
    }

    return this.mapDbUserToUser(data);
  }

  async getUserById(userId: string): Promise<User> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapDbUserToUser(data);
  }

  async getUsersByIds(userIds: string[]): Promise<User[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds);

    if (error) {
      throw new Error(error.message);
    }

    return data.map(this.mapDbUserToUser);
  }

  async updateUserProfile(profile: UserProfileForm): Promise<User> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // First try to update the existing profile
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({
        name: profile.name,
        phone: profile.phone,
        general_area: profile.generalArea,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (!updateError && updateData) {
      return this.mapDbUserToUser(updateData);
    }

    // If update failed (profile doesn't exist), create the profile
    // Profile not found, creating new profile
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        name: profile.name,
        phone: profile.phone,
        general_area: profile.generalArea,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create profile: ${insertError.message}`);
    }

    return this.mapDbUserToUser(insertData);
  }

  // Group services
  async createGroup(name: string): Promise<Group> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Create group
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError) {
      throw new Error(groupError.message);
    }

    // Add creator as member
    const { error: memberError } = await supabase.from('group_members').insert({
      group_id: groupData.id,
      user_id: user.id,
    });

    if (memberError) {
      throw new Error(memberError.message);
    }

    return this.mapDbGroupToGroup(groupData);
  }

  async getUserGroups(): Promise<Group[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // First get the group IDs for the user
    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (memberError) {
      throw new Error(memberError.message);
    }

    if (!memberData || memberData.length === 0) {
      return [];
    }

    const groupIds = memberData.map((m) => m.group_id);

    // Then get the groups
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds);

    if (error) {
      throw new Error(error.message);
    }

    return data.map(this.mapDbGroupToGroup);
  }

  async joinGroup(token: string): Promise<Group> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Validate invite
    const { group } = await this.validateInvite(token);

    // Check if user is already a member
    const { data: existingMember, error: memberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .single();

    if (memberError && memberError.code !== 'PGRST116') {
      throw new Error(memberError.message);
    }

    if (existingMember) {
      throw new Error('You are already a member of this group');
    }

    // Add user to group
    const { error: joinError } = await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
    });

    if (joinError) {
      throw new Error(joinError.message);
    }

    // Mark invite as used
    const { error: inviteError } = await supabase
      .from('invites')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    if (inviteError) {
      throw new Error(inviteError.message);
    }

    return group;
  }

  async leaveGroup(groupId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async getGroupMembers(groupId: string): Promise<User[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // First get the user IDs for the group
    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    if (memberError) {
      throw new Error(memberError.message);
    }

    if (!memberData || memberData.length === 0) {
      return [];
    }

    const userIds = memberData.map((m) => m.user_id);

    // Then get the users
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds);

    if (error) {
      throw new Error(error.message);
    }

    return data.map(this.mapDbUserToUser);
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  }

  // Request services
  async createRequest(request: CreateRequestForm): Promise<Request> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('requests')
      .insert({
        user_id: user.id,
        group_id: request.groupId,
        item_description: request.itemDescription,
        store_preference: request.storePreference,
        needed_by: request.neededBy,
        pickup_notes: request.pickupNotes,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapDbRequestToRequest(data);
  }

  async getUserRequests(): Promise<Request[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data.map(this.mapDbRequestToRequest);
  }

  async getGroupRequests(groupId: string): Promise<Request[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data.map(this.mapDbRequestToRequest);
  }

  async claimRequest(requestId: string): Promise<Request> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('requests')
      .update({
        status: 'claimed',
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('status', 'open')
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapDbRequestToRequest(data);
  }

  async unclaimRequest(requestId: string): Promise<Request> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('requests')
      .update({
        status: 'open',
        claimed_by: null,
        claimed_at: null,
      })
      .eq('id', requestId)
      .eq('claimed_by', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapDbRequestToRequest(data);
  }

  async fulfillRequest(requestId: string): Promise<Request> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('requests')
      .update({
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('claimed_by', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapDbRequestToRequest(data);
  }

  async deleteRequest(requestId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', requestId)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  // Invite services
  async createInvite(groupId: string, email: string): Promise<Invite> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('No authenticated user');
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { data, error } = await supabase
      .from('invites')
      .insert({
        group_id: groupId,
        email,
        token,
        expires_at: expiresAt.toISOString(),
        invited_by: user.user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapDbInviteToInvite(data);
  }

  async validateInvite(
    token: string
  ): Promise<{ group: Group; invite: Invite }> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: inviteData, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (inviteError) {
      throw new Error('Invalid or expired invite token');
    }

    const invite = this.mapDbInviteToInvite(inviteData);

    if (new Date() > invite.expiresAt) {
      throw new Error('Invite has expired');
    }

    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', invite.groupId)
      .single();

    if (groupError) {
      throw new Error('Group not found');
    }

    const group = this.mapDbGroupToGroup(groupData);

    return { group, invite };
  }

  // Helper methods to map database objects to domain objects
  private mapDbUserToUser(dbUser: {
    id: string;
    email: string;
    name: string;
    phone: string;
    general_area: string;
    is_admin?: boolean;
    created_at: string;
  }): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      phone: dbUser.phone,
      generalArea: dbUser.general_area,
      isAdmin: dbUser.is_admin || false,
      createdAt: new Date(dbUser.created_at),
    };
  }

  private mapDbGroupToGroup(dbGroup: {
    id: string;
    name: string;
    created_by: string;
    created_at: string;
  }): Group {
    return {
      id: dbGroup.id,
      name: dbGroup.name,
      createdBy: dbGroup.created_by,
      createdAt: new Date(dbGroup.created_at),
    };
  }

  private mapDbRequestToRequest(dbRequest: {
    id: string;
    user_id: string;
    group_id: string;
    item_description: string;
    store_preference?: string;
    needed_by: string;
    pickup_notes?: string;
    status: string;
    claimed_by?: string;
    claimed_at?: string;
    fulfilled_at?: string;
    created_at: string;
  }): Request {
    return {
      id: dbRequest.id,
      userId: dbRequest.user_id,
      groupId: dbRequest.group_id,
      itemDescription: dbRequest.item_description,
      storePreference: dbRequest.store_preference,
      neededBy: new Date(dbRequest.needed_by),
      pickupNotes: dbRequest.pickup_notes,
      status: dbRequest.status as RequestStatus,
      claimedBy: dbRequest.claimed_by,
      claimedAt: dbRequest.claimed_at
        ? new Date(dbRequest.claimed_at)
        : undefined,
      fulfilledAt: dbRequest.fulfilled_at
        ? new Date(dbRequest.fulfilled_at)
        : undefined,
      createdAt: new Date(dbRequest.created_at),
    };
  }

  private mapDbInviteToInvite(dbInvite: {
    id: string;
    group_id: string;
    email: string;
    token: string;
    expires_at: string;
    used_at?: string;
    created_at: string;
  }): Invite {
    return {
      id: dbInvite.id,
      groupId: dbInvite.group_id,
      email: dbInvite.email,
      token: dbInvite.token,
      expiresAt: new Date(dbInvite.expires_at),
      usedAt: dbInvite.used_at ? new Date(dbInvite.used_at) : undefined,
      createdAt: new Date(dbInvite.created_at),
    };
  }

  // User limits services
  async getUserLimits(): Promise<UserLimits> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase.rpc('get_user_limits', {
      p_user_id: user.user.id,
    });

    if (error) {
      throw new Error(`Failed to get user limits: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('User limits not found');
    }

    const limits = data[0];
    return {
      userId: limits.user_id,
      maxOpenRequests: limits.max_open_requests,
      maxGroupsCreated: limits.max_groups_created,
      maxGroupsJoined: limits.max_groups_joined,
      createdAt: new Date(limits.created_at),
      updatedAt: new Date(limits.updated_at),
    };
  }

  async getUserCounts(): Promise<UserCounts> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase.rpc('get_user_counts', {
      p_user_id: user.user.id,
    });

    if (error) {
      throw new Error(`Failed to get user counts: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('User counts not found');
    }

    const counts = data[0];
    return {
      openRequestsCount: counts.open_requests_count,
      groupsCreatedCount: counts.groups_created_count,
      groupsJoinedCount: counts.groups_joined_count,
    };
  }

  async getUserLimitsWithCounts(): Promise<UserLimitsWithCounts> {
    const [limits, counts] = await Promise.all([
      this.getUserLimits(),
      this.getUserCounts(),
    ]);

    return { limits, counts };
  }

  async updateUserLimits(
    updatedLimits: Partial<UserLimits>
  ): Promise<UserLimits> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('No authenticated user');
    }

    const updateData: Record<string, number> = {};
    if (updatedLimits.maxOpenRequests !== undefined) {
      updateData.max_open_requests = updatedLimits.maxOpenRequests;
    }
    if (updatedLimits.maxGroupsCreated !== undefined) {
      updateData.max_groups_created = updatedLimits.maxGroupsCreated;
    }
    if (updatedLimits.maxGroupsJoined !== undefined) {
      updateData.max_groups_joined = updatedLimits.maxGroupsJoined;
    }

    const { data, error } = await supabase
      .from('user_limits')
      .update(updateData)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user limits: ${error.message}`);
    }

    return {
      userId: data.user_id,
      maxOpenRequests: data.max_open_requests,
      maxGroupsCreated: data.max_groups_created,
      maxGroupsJoined: data.max_groups_joined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async canCreateRequest(): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase.rpc('can_create_request', {
      p_user_id: user.user.id,
    });

    if (error) {
      throw new Error(
        `Failed to check request creation limit: ${error.message}`
      );
    }

    return data as boolean;
  }

  async canCreateGroup(): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase.rpc('can_create_group', {
      p_user_id: user.user.id,
    });

    if (error) {
      throw new Error(`Failed to check group creation limit: ${error.message}`);
    }

    return data as boolean;
  }

  async canJoinGroup(): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase.rpc('can_join_group', {
      p_user_id: user.user.id,
    });

    if (error) {
      throw new Error(`Failed to check group join limit: ${error.message}`);
    }

    return data as boolean;
  }

  async getAdminMetrics(): Promise<AdminMetrics> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('No authenticated user');
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.user.id)
      .single();

    if (userError || !userData?.is_admin) {
      throw new Error('Access denied: Admin privileges required');
    }

    // Get metrics in parallel
    const [
      totalUsersResult,
      activeUsersResult,
      totalGroupsResult,
      requestsThisMonthResult,
      fulfillmentStatsResult,
      claimStatsResult,
      groupSizeStatsResult,
    ] = await Promise.all([
      // Total users
      supabase.from('users').select('id', { count: 'exact' }),

      // Active users (logged in last 30 days - we'll approximate using created users in last 30 days for now)
      supabase
        .from('users')
        .select('id', { count: 'exact' })
        .gte(
          'created_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ),

      // Total groups
      supabase.from('groups').select('id', { count: 'exact' }),

      // Requests this month
      supabase
        .from('requests')
        .select('id', { count: 'exact' })
        .gte(
          'created_at',
          new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ).toISOString()
        ),

      // Fulfillment stats
      supabase.from('requests').select('status'),

      // Claim time stats
      supabase
        .from('requests')
        .select('created_at, claimed_at')
        .not('claimed_at', 'is', null),

      // Group size stats
      supabase.from('group_members').select('group_id'),
    ]);

    // Calculate fulfillment rate
    const allRequests = fulfillmentStatsResult.data || [];
    const fulfilledOrClaimed = allRequests.filter(
      (r) => r.status === 'claimed' || r.status === 'fulfilled'
    ).length;
    const fulfillmentRate =
      allRequests.length > 0
        ? (fulfilledOrClaimed / allRequests.length) * 100
        : 0;

    // Calculate average time to claim
    const claimedRequests = claimStatsResult.data || [];
    const avgTimeToClaimMs =
      claimedRequests.length > 0
        ? claimedRequests.reduce((sum, req) => {
            const claimTime =
              new Date(req.claimed_at).getTime() -
              new Date(req.created_at).getTime();
            return sum + claimTime;
          }, 0) / claimedRequests.length
        : 0;
    const avgTimeToClaimHours = avgTimeToClaimMs / (1000 * 60 * 60);

    // Calculate average group size
    const groupMembers = groupSizeStatsResult.data || [];
    const groupSizes = groupMembers.reduce(
      (acc, member) => {
        acc[member.group_id] = (acc[member.group_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const avgGroupSize =
      Object.keys(groupSizes).length > 0
        ? Object.values(groupSizes).reduce((sum, size) => sum + size, 0) /
          Object.keys(groupSizes).length
        : 0;

    return {
      totalUsers: totalUsersResult.count || 0,
      activeUsers: activeUsersResult.count || 0,
      totalGroups: totalGroupsResult.count || 0,
      totalRequestsThisMonth: requestsThisMonthResult.count || 0,
      fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
      averageTimeToClaimHours: Math.round(avgTimeToClaimHours * 100) / 100,
      averageGroupSize: Math.round(avgGroupSize * 100) / 100,
    };
  }

  // Email preferences services
  async getEmailPreferences(): Promise<EmailPreferences> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('user_email_preferences')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (error) {
      // If no preferences exist, create default preferences
      if (error.code === 'PGRST116') {
        const defaultPreferences = {
          user_id: user.user.id,
          frequency: 'disabled' as const,
        };

        const { data: newData, error: insertError } = await supabase
          .from('user_email_preferences')
          .insert(defaultPreferences)
          .select()
          .single();

        if (insertError) {
          throw new Error(
            `Failed to create email preferences: ${insertError.message}`
          );
        }

        return this.mapDbEmailPreferencesToEmailPreferences(newData);
      }
      throw new Error(`Failed to get email preferences: ${error.message}`);
    }

    return this.mapDbEmailPreferencesToEmailPreferences(data);
  }

  async updateEmailPreferences(
    preferences: EmailPreferencesForm
  ): Promise<EmailPreferences> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('No authenticated user');
    }

    // First try to update existing preferences
    const { data: updateData, error: updateError } = await supabase
      .from('user_email_preferences')
      .update({
        frequency: preferences.frequency,
      })
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (!updateError && updateData) {
      return this.mapDbEmailPreferencesToEmailPreferences(updateData);
    }

    // If update failed (no existing preferences), create new ones
    if (updateError && updateError.code === 'PGRST116') {
      const { data: insertData, error: insertError } = await supabase
        .from('user_email_preferences')
        .insert({
          user_id: user.user.id,
          frequency: preferences.frequency,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(
          `Failed to create email preferences: ${insertError.message}`
        );
      }

      return this.mapDbEmailPreferencesToEmailPreferences(insertData);
    }

    throw new Error(
      `Failed to update email preferences: ${updateError?.message}`
    );
  }

  async sendImmediateNotification(requestId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Get the request details
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError) {
      throw new Error(`Failed to get request: ${requestError.message}`);
    }

    // Get group members with immediate notification preferences
    const { data: membersData, error: membersError } = await supabase
      .from('group_members')
      .select(
        `
        user_id,
        users!inner(email, name),
        user_email_preferences!inner(frequency)
      `
      )
      .eq('group_id', requestData.group_id)
      .neq('user_id', requestData.user_id) // Don't notify the request creator
      .eq('user_email_preferences.frequency', 'immediate');

    if (membersError) {
      throw new Error(`Failed to get group members: ${membersError.message}`);
    }

    if (!membersData || membersData.length === 0) {
      // No members with immediate notifications enabled
      return;
    }

    // TODO: Integrate with actual email service here

    // Log the email send attempt
    const { error: logError } = await supabase.from('email_send_log').insert({
      user_id: requestData.user_id,
      email_type: 'immediate_notification',
      request_ids: [requestId],
      email_provider_id: 'mock-' + Date.now(),
    });

    if (logError) {
      throw new Error(`Failed to log email send: ${logError.message}`);
    }
  }

  async getPendingInvitations(): Promise<PendingInvitation[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('invites')
      .select(
        `
        id,
        group_id,
        email,
        token,
        expires_at,
        created_at,
        groups!inner(name),
        users!invited_by(name)
      `
      )
      .eq('email', user.user.email)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      throw new Error(`Failed to get pending invitations: ${error.message}`);
    }

    return data.map(
      (invite: {
        id: string;
        group_id: string;
        groups: { name: string }[] | { name: string } | null;
        users: { name: string }[] | { name: string } | null;
        email: string;
        token: string;
        expires_at: string;
        created_at: string;
      }) => {
        // Handle different possible structures from Supabase joins
        let groupName = 'Unknown Group';
        let inviterName = 'Unknown User';

        if (Array.isArray(invite.groups) && invite.groups.length > 0) {
          groupName = invite.groups[0].name;
        } else if (invite.groups && !Array.isArray(invite.groups)) {
          groupName = invite.groups.name;
        }

        if (Array.isArray(invite.users) && invite.users.length > 0) {
          inviterName = invite.users[0].name;
        } else if (invite.users && !Array.isArray(invite.users)) {
          inviterName = invite.users.name;
        }

        return {
          id: invite.id,
          groupId: invite.group_id,
          groupName,
          inviterName,
          email: invite.email,
          token: invite.token,
          expiresAt: new Date(invite.expires_at),
          createdAt: new Date(invite.created_at),
        };
      }
    );
  }

  async acceptInvitation(token: string): Promise<Group> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('No authenticated user');
    }

    // Validate the invitation
    const { data: inviteData, error: inviteError } = await supabase
      .from('invites')
      .select('*, groups(*)')
      .eq('token', token)
      .eq('email', user.user.email)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError) {
      if (inviteError.code === 'PGRST116') {
        throw new Error('Invalid invitation token');
      }
      throw new Error(`Failed to validate invitation: ${inviteError.message}`);
    }

    // Check if user is already a member
    const { data: membershipData } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', inviteData.group_id)
      .eq('user_id', user.user.id)
      .single();

    if (membershipData) {
      throw new Error('You are already a member of this group');
    }

    // Add user to group and mark invitation as used
    const { error: joinError } = await supabase.from('group_members').insert({
      group_id: inviteData.group_id,
      user_id: user.user.id,
    });

    if (joinError) {
      throw new Error(`Failed to join group: ${joinError.message}`);
    }

    // Mark invitation as used
    const { error: updateError } = await supabase
      .from('invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', inviteData.id);

    if (updateError) {
      throw new Error(
        `Failed to mark invitation as used: ${updateError.message}`
      );
    }

    return this.mapDbGroupToGroup(inviteData.groups);
  }

  async declineInvitation(token: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('No authenticated user');
    }

    // Validate the invitation
    const { data: inviteData, error: inviteError } = await supabase
      .from('invites')
      .select('id')
      .eq('token', token)
      .eq('email', user.user.email)
      .is('used_at', null)
      .single();

    if (inviteError) {
      if (inviteError.code === 'PGRST116') {
        throw new Error('Invalid invitation token');
      }
      throw new Error(`Failed to validate invitation: ${inviteError.message}`);
    }

    // Mark invitation as used (declined)
    const { error: updateError } = await supabase
      .from('invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', inviteData.id);

    if (updateError) {
      throw new Error(`Failed to decline invitation: ${updateError.message}`);
    }
  }

  private mapDbEmailPreferencesToEmailPreferences(dbPrefs: {
    user_id: string;
    frequency: string;
    last_daily_sent?: string;
    created_at: string;
    updated_at: string;
  }): EmailPreferences {
    return {
      userId: dbPrefs.user_id,
      frequency: dbPrefs.frequency as 'disabled' | 'daily' | 'immediate',
      lastDailySent: dbPrefs.last_daily_sent
        ? new Date(dbPrefs.last_daily_sent)
        : undefined,
      createdAt: new Date(dbPrefs.created_at),
      updatedAt: new Date(dbPrefs.updated_at),
    };
  }
}
