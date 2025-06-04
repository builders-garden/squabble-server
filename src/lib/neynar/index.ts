import fetch from "node-fetch";
import { env } from "../env.js";

export interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  verifications: string[];
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses: string[];
    primary: {
      eth_address: string;
      sol_address: string;
    };
  };
  follower_count: number;
  following_count: number;
  power_badge: boolean;
}

export interface NeynarBulkUsersResponse {
  users: NeynarUser[];
}

export const fetchUsersByFids = async (
  fids: number[]
): Promise<NeynarUser[]> => {
  if (fids.length > 100) {
    throw new Error("Maximum of 100 FIDs allowed per request");
  }

  if (fids.length === 0) {
    return [];
  }

  const response = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids.join(",")}`,
    {
      headers: {
        "x-api-key": env.NEYNAR_API_KEY,
        "x-neynar-experimental": "false",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Farcaster users by FIDs on Neynar: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as NeynarBulkUsersResponse;

  return data.users;
};

// Helper function to extract just usernames if needed
export const fetchUsernamesByFids = async (
  fids: number[]
): Promise<string[]> => {
  const users = await fetchUsersByFids(fids);
  return users.map((user) => user.username);
};
