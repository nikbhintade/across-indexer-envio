import fs from "fs";
import path from "path";

export function getNameFromChainId(
    chainId1: number,
    chainId2: number,
): [string, string] {
    const filePath = path.join(__dirname, "../../chainIdToName.json");
    const chainds = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const findName = (chainId: number): string => {
        const chain = chainds.find((c: { chainId: number }) =>
            c.chainId === chainId
        );
        return chain ? chain.name : "Unknown Chain";
    };

    return [findName(chainId1), findName(chainId2)];
}
