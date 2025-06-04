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
  import { SQUABBLE_CONTRACT_ABI, SQUABBLE_CONTRACT_ADDRESS } from "../constants.js";
  import { env } from "../env.js";
import { fetchUsersByFids } from "../neynar/index.js";
  
  export async function setGameResult(gameId: string, isDraw: boolean, winnerFID: string) {
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
        const winner = 10;
        const tx = await walletClient.writeContract({
            address: SQUABBLE_CONTRACT_ADDRESS,
            abi: SQUABBLE_CONTRACT_ABI as Abi,
            functionName: "setGameWinner",
            args: [gameId, BigInt(winner)],
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

      const winnerAddresses = await fetchUsersByFids([Number(winnerFID)]);

      //recuperare address da fid da neynar e mandare messaggio tramite agent

      const tx = await walletClient.writeContract({
        address: SQUABBLE_CONTRACT_ADDRESS,
        abi: SQUABBLE_CONTRACT_ABI as Abi,
        functionName: "setGameWinner",
        args: [gameId, winner],
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
      
  
      
  
      
  
      
  