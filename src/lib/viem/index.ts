import {
  Abi,
  createPublicClient,
  createWalletClient,
  http,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import {
  SQUABBLE_CONTRACT_ABI,
  SQUABBLE_CONTRACT_ADDRESS,
  ZERO_ADDRESS,
} from "../constants.js";
import { env } from "../env.js";
import { fetchUsersByFids } from "../neynar/index.js";

export async function setGameResult(
  gameId: string,
  isDraw: boolean,
  winnerFIDs: string[]
) {
  const account = privateKeyToAccount(env.BACKEND_PRIVATE_KEY as `0x${string}`);
  if (!account) {
    throw new Error("No account found");
  }

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  const walletClient = createWalletClient({
    chain: base,
    transport: http(),
    account: account,
  });

  if (isDraw) {
    const winnersAddresses = await fetchUsersByFids(winnerFIDs.map(Number));

    if (winnerFIDs.length === 0) {
      throw new Error("Partecipants not found");
    }
    const tx = await walletClient.writeContract({
      address: SQUABBLE_CONTRACT_ADDRESS,
      abi: SQUABBLE_CONTRACT_ABI as Abi,
      functionName: "setGameWinner",
      args: [
        gameId,
        ZERO_ADDRESS,
        winnersAddresses.map((p) => p.verified_addresses.primary.eth_address),
      ],
    });

    const txReceipt = await publicClient.waitForTransactionReceipt({
      hash: tx,
    });

    if (txReceipt.status === "success") {
      return txReceipt;
    } else {
      throw new Error("Transaction failed");
    }
  } else {
    const winnerAddress = await fetchUsersByFids([Number(winnerFIDs[0])]);
    if (winnerAddress.length === 0) {
      throw new Error("Winner not found");
    }

    //partecipantsAddresses is empty array
    const partecipantsAddresses: Address[] = [];

    const tx = await walletClient.writeContract({
      address: SQUABBLE_CONTRACT_ADDRESS,
      abi: SQUABBLE_CONTRACT_ABI as Abi,
      functionName: "setGameWinner",
      args: [
        gameId,
        winnerAddress[0].verified_addresses.primary.eth_address,
        partecipantsAddresses,
      ],
    });

    const txReceipt = await publicClient.waitForTransactionReceipt({
      hash: tx,
    });

    if (txReceipt.status === "success") {
      return txReceipt;
    } else {
      throw new Error("Transaction failed");
    }
  }
}

export async function startGame(gameId: string) {
  const account = privateKeyToAccount(env.BACKEND_PRIVATE_KEY as `0x${string}`);
  if (!account) {
    throw new Error("No account found");
  }

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  const walletClient = createWalletClient({
    chain: base,
    transport: http(),
    account: account,
  });

  const tx = await walletClient.writeContract({
    address: SQUABBLE_CONTRACT_ADDRESS,
    abi: SQUABBLE_CONTRACT_ABI as Abi,
    functionName: "startGame",
    args: [gameId],
  });

  const txReceipt = await publicClient.waitForTransactionReceipt({
    hash: tx,
  });

  if (txReceipt.status === "success") {
    return txReceipt;
  } else {
    throw new Error("Transaction failed");
  }
}
