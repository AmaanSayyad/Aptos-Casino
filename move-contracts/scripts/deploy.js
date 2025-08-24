import { Aptos, AptosConfig, NetworkToNetworkName, Account } from "@aptos-labs/ts-sdk";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables from a .env at project root if present
try {
  // Try project root first
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
  // Fallback to move-contracts directory
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
} catch {}

async function main() {
  const privateKeyHex = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKeyHex) {
    console.error("Set DEPLOYER_PRIVATE_KEY in environment");
    process.exit(1);
  }

  // Optional: allow overriding network via env or CLI arg (--network=testnet|devnet|mainnet)
  const args = process.argv.slice(2);
  let networkName = (process.env.APTOS_NETWORK || "testnet").toLowerCase();
  const networkArg = args.find((a) => a.startsWith("--network="));
  if (networkArg) {
    networkName = networkArg.split("=")[1].toLowerCase();
  }

  const networkMap = {
    testnet: NetworkToNetworkName.TESTNET,
    devnet: NetworkToNetworkName.DEVNET,
    mainnet: NetworkToNetworkName.MAINNET,
  };

  const resolvedNetwork = networkMap[networkName] || NetworkToNetworkName.TESTNET;

  const config = new AptosConfig({ network: resolvedNetwork });
  const aptos = new Aptos(config);

  const deployer = Account.fromPrivateKey({ privateKeyHex: privateKeyHex });

  // Determine package directory. Default to move-contracts root. Allow override via --dir=<path>
  let packageDir = path.resolve(__dirname, "..");
  const dirArg = args.find((a) => a.startsWith("--dir="));
  if (dirArg) {
    const customDir = dirArg.split("=")[1];
    // Resolve relative to project root
    const resolved = path.isAbsolute(customDir)
      ? customDir
      : path.resolve(process.cwd(), customDir);
    if (!fs.existsSync(resolved)) {
      console.error(`Package directory not found: ${resolved}`);
      process.exit(1);
    }
    packageDir = resolved;
  }

  const tx = await aptos.publishPackage({
    account: deployer,
    packageDirectoryPath: packageDir,
  });

  console.log(`Published to ${networkName}. Transaction:`, tx);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 