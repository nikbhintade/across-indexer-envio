import path from "path";
import fs from "fs";

export async function getPrice(
    tokenWithChain: string,
): Promise<[number, number]> {
    // tokenWithChain: { timestamp, currentPrice, decimals}

    const filePath = path.join(__dirname, "../../data/prices.json");

    // Ensure file exists
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, "{}", "utf8");
    }

    const prices = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const tokenData = prices[tokenWithChain];
    const timestamp = Math.floor(Date.now() / 1000);

    console.log("Token Data:");
    console.log(tokenData);
    // Check if token data exists and is not older than 60 seconds
    if (tokenData && tokenData.timestamp > timestamp - 60) {
        return [
            tokenData.currentPrice,
            tokenData.decimals,
        ];
    } else {
        // Fetch the price from the API
        const response = await fetch(
            `https://coins.llama.fi/prices/current/${tokenWithChain}`,
        );

        if (response.status !== 200) {
            console.error(
                `Failed to fetch price for ${tokenWithChain}: ${response.statusText}`,
            );
            return [0, 0];
        }
        const data = await response.json() as {
            coins: Record<string, {
                decimals: number;
                price: number;
                symbol: string;
                timestamp: number;
            }>;
        };

        const priceObj = data.coins?.[tokenWithChain];
        if (!priceObj) {
            console.error(`No price data found for ${tokenWithChain}`);
            return [0, 0];
        }

        const currentPrice = priceObj.price;
        const decimals = priceObj.decimals ?? 18;

        // Update and write to file
        prices[tokenWithChain] = {
            currentPrice,
            decimals,
            timestamp,
        };

        fs.writeFileSync(filePath, JSON.stringify(prices, null, 2), "utf8");

        return [currentPrice, decimals];
    }
}
