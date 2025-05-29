import {
    createWalletClient,
    createPublicClient,
    http,
    type Address,
    Abi,
    SendTransactionParameters,
  } from "viem";
  import { base } from "viem/chains";
  import { privateKeyToAccount } from "viem/accounts";
  import { SQUABBLE_CONTRACT_ABI, SQUABBLE_CONTRACT_ADDRESS } from "../constants";
  import { env } from "../env";
  
  export async function setGameResult(gameId: bigint, winner: Address) {
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
    
      const { request } = await publicClient.simulateContract({
          address: SQUABBLE_CONTRACT_ADDRESS,
          abi: SQUABBLE_CONTRACT_ABI as Abi,
          functionName: "setGameWinner",
          args: [gameId, winner],
      });
  
      const tx = await walletClient.sendTransaction(request as SendTransactionParameters);
  
      const txReceipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
      });
  
      if (txReceipt.status === "success") {
          return txReceipt;
      } else {
          throw new Error("Transaction failed");
      }
  }
      
  
      
  
      
  
      
  