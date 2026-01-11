export interface NearbyUser {
  id: string;
  displayName: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  isFriend: boolean;
}

export interface User {
  id: string;
  friendCode: string;
  displayName: string;
  mode: 'friends' | 'everyone';
  radiusMeters: number;
  showFriendsOnMap: boolean;
}

export interface Friend {
  id: string;
  friendCode: string;
  displayName: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromDisplayName: string;
  fromFriendCode: string;
  createdAt: string;
}
