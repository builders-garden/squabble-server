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

export async function setGameResult(
  gameId: string,
  isDraw: boolean,
  winnersAddresses: Address[]
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

  // Get the current nonce for the account
  const nonce = await publicClient.getTransactionCount({
    address: account.address,
  });

  if (isDraw) {
    const tx = await walletClient.writeContract({
      address: SQUABBLE_CONTRACT_ADDRESS,
      abi: SQUABBLE_CONTRACT_ABI as Abi,
      functionName: "setGameWinner",
      args: [gameId, ZERO_ADDRESS, winnersAddresses],
      nonce: nonce,
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
    //partecipantsAddresses is empty array
    const partecipantsAddresses: Address[] = [];

    const tx = await walletClient.writeContract({
      address: SQUABBLE_CONTRACT_ADDRESS,
      abi: SQUABBLE_CONTRACT_ABI as Abi,
      functionName: "setGameWinner",
      args: [gameId, winnersAddresses[0], partecipantsAddresses],
      nonce: nonce,
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

  // Get the current nonce for the account
  const nonce = await publicClient.getTransactionCount({
    address: account.address,
  });

  const tx = await walletClient.writeContract({
    address: SQUABBLE_CONTRACT_ADDRESS,
    abi: SQUABBLE_CONTRACT_ABI as Abi,
    functionName: "startGame",
    args: [gameId],
    nonce: nonce,
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

export const getTransactionReceipt = async (hash: `0x${string}`) => {
  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  return await publicClient.getTransactionReceipt({ hash });
};

export const joinGame = async (
  gameContractId: number,
  playerAddress: `0x${string}`
) => {
  const account = privateKeyToAccount(env.BACKEND_PRIVATE_KEY as `0x${string}`);
  if (!account) {
    throw new Error("No account found");
  }

  const walletClient = createWalletClient({
    chain: base,
    transport: http(),
    account: account,
  });

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  try {
    // Get the current nonce for the account
    const nonce = await publicClient.getTransactionCount({
      address: account.address,
    });

    const tx = await walletClient.writeContract({
      address: SQUABBLE_CONTRACT_ADDRESS,
      abi: SQUABBLE_CONTRACT_ABI as Abi,
      functionName: "joinGame",
      args: [gameContractId, playerAddress],
      nonce: nonce,
    });

    const txReceipt = await publicClient.waitForTransactionReceipt({
      hash: tx,
    });

    if (txReceipt.status === "success") {
      console.log("joinGame txReceipt", txReceipt);
      return txReceipt;
    } else {
      throw new Error("Transaction failed");
    }
  } catch (error) {
    console.error("joinGame error", error);
    if (
      error instanceof Error &&
      error.message.includes("GameAlreadyHasPlayer()")
    ) {
      return null;
    }
    throw error; // Re-throw the original error instead of generic "Transaction failed"
  }
};
