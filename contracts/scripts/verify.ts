import { run } from "hardhat";

async function main() {
  const agentRegistryAddress = process.env.AGENT_REGISTRY_ADDRESS;
  const clawdPaymentsAddress = process.env.CLAWD_PAYMENTS_ADDRESS;
  const usdcAddress = process.env.USDC_ADDRESS || "0x0000000000000000000000000000000000000000";
  const platformWallet = process.env.PLATFORM_WALLET;

  if (!agentRegistryAddress || !clawdPaymentsAddress || !platformWallet) {
    throw new Error("Missing deployment variables in .env");
  }

  await run("verify:verify", {
    address: agentRegistryAddress,
    constructorArguments: [],
  });

  await run("verify:verify", {
    address: clawdPaymentsAddress,
    constructorArguments: [usdcAddress, agentRegistryAddress, platformWallet],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
