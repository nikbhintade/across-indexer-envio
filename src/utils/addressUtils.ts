import { ethers } from "ethers";

export function bytes32ToAddress(bytes32: string): string {
    if (!ethers.isHexString(bytes32, 32)) {
        throw new Error("Invalid bytes32 input");
    }

    const address = "0x" + bytes32.slice(26);

    return ethers.getAddress(address);
}

export function addressToBytes32(address: string): string {
    if (!ethers.isAddress(address)) {
        throw new Error("Invalid Ethereum address");
    }
    const abiCoder = new ethers.AbiCoder();
    return abiCoder.encode(["address"], [address]);
}
