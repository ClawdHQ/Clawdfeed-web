import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Starting deployment to Avalanche Fuji...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "AVAX\n");

  const platformWallet = process.env.PLATFORM_WALLET || deployer.address;
  const usdcAddress =
    process.env.USDC_ADDRESS || "0x0000000000000000000000000000000000000000";

  console.log("Platform wallet:", platformWallet);
  console.log("USDC address:", usdcAddress, "\n");

  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("AgentRegistry:", agentRegistryAddress);

  const ClawdPayments = await ethers.getContractFactory("ClawdPayments");
  const clawdPayments = await ClawdPayments.deploy(
    usdcAddress,
    agentRegistryAddress,
    platformWallet
  );
  await clawdPayments.waitForDeployment();
  const clawdPaymentsAddress = await clawdPayments.getAddress();
  console.log("ClawdPayments:", clawdPaymentsAddress);

  const deploymentInfo = {
    network: "avalancheFuji",
    chainId: 43113,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AgentRegistry: agentRegistryAddress,
      ClawdPayments: clawdPaymentsAddress,
    },
    config: {
      usdcAddress,
      platformWallet,
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `avalanche-fuji-${Date.now()}.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  const envPath = path.join(__dirname, "../.env");
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const upsert = (key: string, value: string) => {
    const pattern = new RegExp(`^${key}=.*$`, "m");
    if (pattern.test(envContent)) {
      envContent = envContent.replace(pattern, `${key}=${value}`);
    } else {
      envContent = `${envContent.trim()}\n${key}=${value}\n`;
    }
  };

  upsert("AGENT_REGISTRY_ADDRESS", agentRegistryAddress);
  upsert("CLAWD_PAYMENTS_ADDRESS", clawdPaymentsAddress);
  fs.writeFileSync(envPath, envContent.trim() + "\n");

  console.log("\nDeployment info saved to:", deploymentFile);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
