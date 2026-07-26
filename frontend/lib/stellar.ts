// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SorobanInvokeParams {
  contractId: string;
  method: string;
  args: unknown[];
  signerAddress: string;
}

export interface TransactionResult {
  txHash: string;
  ledger: number;
  returnValue: unknown;
}

// ─── FUNCTIONS ────────────────────────────────────────────────────────────────

/**
 * Builds a Soroban contract invocation XDR string ready for wallet signing.
 * Fetches the current account sequence number from Horizon.
 * Simulates the transaction via Soroban RPC to populate the auth footprint.
 */
export async function buildSorobanInvocation(
  params: SorobanInvokeParams
): Promise<string> {
  const { Contract, Operation, SorobanRpc, TransactionBuilder, Timeout } = await import("@stellar/stellar-sdk");

  const server = new SorobanRpc.Server("https://soroban-testnet.stellar.org", {
    allowHttp: true,
  });

  const operation = Operation.invokeHostFunction({
    hostFunction: {
      functionName: params.method,
      args: params.args.map((arg) => {
        const { nativeToScVal, addressToScVal } = await import("@stellar/stellar-sdk");

        if (typeof arg === "bigint") return nativeToScVal(arg);
        if (typeof arg === "string") {
          try {
            return addressToScVal(arg);
          } catch {
            return nativeToScVal(Number(arg));
          }
        }
        if (typeof arg === "number") return nativeToScVal(arg);
        if (Array.isArray(arg)) {
          return nativeToScVal(arg);
        }
        return arg;
      }),
    },
    auth: [],
  });

  const account = await server.getAccount(params.signerAddress);

  const transaction = new TransactionBuilder(params.signerAddress, {
    networkPassphrase: "Test SDF Network ; September 2015",
    fee: "0",
  })
    .addOperation(operation)
    .setTimeout(Timeout.infinite)
    .build();

  const simulateResult = await server.simulateTransaction(transaction);

  if (simulateResult.errorResult) {
    throw new Error(simulateResult.errorResult);
  }

  if (!simulateResult.transaction.data?.result?.auth?.length) {
    throw new Error("Transaction auth not simulated");
  }

  return transaction.toXDR();
}

/**
 * Submits a signed XDR transaction to the Stellar network.
 * Polls for confirmation and returns the result once the transaction is in a ledger.
 * Throws a descriptive error on submission failure or timeout.
 */
export async function submitTransaction(signedXdr: string): Promise<TransactionResult> {
  const { SorobanRpc, Transaction } = await import("@stellar/stellar-sdk");

  const server = new SorobanRpc.Server("https://soroban-testnet.stellar.org", {
    allowHttp: true,
  });

  const tx = Transaction.fromXDR(signedXdr, "Test SDF Network ; September 2015");

  const hash = tx.hash();

  let result = await server.getTransaction(hash);

  let attempts = 0;
  const maxAttempts = 60;

  while (result.status === "Pending" || result.status === "NotFound") {
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error(`Transaction submission timed out after ${maxAttempts} attempts`);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));

    result = await server.getTransaction(hash);
  }

  if (result.status !== "Success") {
    throw new Error(`Transaction failed with status: ${result.status}`);
  }

  return {
    txHash: hash.toString("hex"),
    ledger: result.ledger,
    returnValue: result.returnValue,
  };
}

/**
 * Decodes a Soroban return value (ScVal) into a plain JavaScript value.
 * Handles i128, Bytes, Address, Vec, Map, and Option types.
 */
export function decodeScVal(scVal: unknown): unknown {
  const { scValToNative } = await import("@stellar/stellar-sdk");

  if (!scVal) {
    return scVal;
  }

  try {
    return scValToNative(scVal);
  } catch (error) {
    if (error instanceof Error && error.message.includes("LedgerKey")) {
      return null;
    }

    if (error instanceof Error && error.message.includes("None")) {
      return null;
    }

    console.error("Error decoding ScVal:", error);
    throw error;
  }
}

/**
 * Converts a XLM amount in stroops (bigint) to a human-readable string.
 * e.g. 10_000_000n -> "1"
 */
export function stroopsToXlm(stroops: bigint): string {
  const xlm = Number(stroops) / 10000000;

  return xlm.toString();
}

/**
 * Converts a human-readable XLM string to stroops (bigint).
 * e.g. "1.5" -> 15_000_000n
 */
export function xlmToStroops(xlm: string): bigint {
  const parts = xlm.split(".");
  const integer = BigInt(parts[0] || "0");
  let fractional = "0";

  if (parts.length > 1) {
    fractional = parts[1];
    if (fractional.length > 7) {
      fractional = fractional.slice(0, 7);
    } else if (fractional.length < 7) {
      fractional = fractional.padEnd(7, "0");
    }
  }

  const stroops = integer * BigInt(10000000) + BigInt(fractional);

  return stroops;
}

/**
 * Truncates a Stellar address for display.
 * e.g. "GABCDEF...WXYZ" (first 6 + last 4 chars)
 */
export function truncateAddress(address: string): string {
  if (!address || address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
