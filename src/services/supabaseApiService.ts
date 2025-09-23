// Supabase API service implementation
import { supabase } from '@/lib/supabase';
import type { ApiService } from './index';
import type {
  User,
  Group,
  Request,
  Invite,
  AuthResponse,
  CreateRequestForm,
  UserProfileForm,
  RequestStatus,
} from '@/types';

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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          email,
          name: '',
          phone: '',
          general_area: ''
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('User creation failed');
    }

    // For signup, the user profile might not exist yet due to async trigger
    // Wait a moment for the database trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Try to get the user profile
      const user = await this.getCurrentUser();
      return {
        user,
        session: data.session?.access_token || ''
      };
    } catch {
      // If profile doesn't exist yet, create a basic user object from auth data
      const basicUser = {
        id: data.user.id,
        email: data.user.email || email,
        name: '',
        phone: '',
        generalArea: '',
        createdAt: new Date()
      };

      return {
        user: basicUser,
        session: data.session?.access_token || ''
      };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
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
      session: data.session?.access_token || ''
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

  // User services
  async getCurrentUser(): Promise<User> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        name: profile.name,
        phone: profile.phone,
        general_area: profile.generalArea
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapDbUserToUser(data);
  }

  // Group services
  async createGroup(name: string): Promise<Group> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Create group
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        created_by: user.id
      })
      .select()
      .single();

    if (groupError) {
      throw new Error(groupError.message);
    }

    // Add creator as member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupData.id,
        user_id: user.id
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
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

    const groupIds = memberData.map(m => m.group_id);

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
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

    const userIds = memberData.map(m => m.user_id);

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
        pickup_notes: request.pickupNotes
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('requests')
      .update({
        status: 'claimed',
        claimed_by: user.id,
        claimed_at: new Date().toISOString()
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('requests')
      .update({
        status: 'open',
        claimed_by: null,
        claimed_at: null
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('requests')
      .update({
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString()
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
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

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { data, error } = await supabase
      .from('invites')
      .insert({
        group_id: groupId,
        email,
        token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapDbInviteToInvite(data);
  }

  async validateInvite(token: string): Promise<{ group: Group; invite: Invite }> {
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
    created_at: string;
  }): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      phone: dbUser.phone,
      generalArea: dbUser.general_area,
      createdAt: new Date(dbUser.created_at)
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
      createdAt: new Date(dbGroup.created_at)
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
      claimedAt: dbRequest.claimed_at ? new Date(dbRequest.claimed_at) : undefined,
      fulfilledAt: dbRequest.fulfilled_at ? new Date(dbRequest.fulfilled_at) : undefined,
      createdAt: new Date(dbRequest.created_at)
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
      createdAt: new Date(dbInvite.created_at)
    };
  }
}