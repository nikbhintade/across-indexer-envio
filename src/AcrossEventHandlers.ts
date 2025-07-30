import { AcrossSpokePool, Intent } from "generated";
import { bytes32ToAddress } from "./utils/addressUtils";
import { getNameFromChainId } from "./utils/getNameFromChainId";
import { getPrice } from "./utils/getPrice";

// Handler for the FilledRelay event
// This event is triggered when a wallet or contract sends requests to bridge assets with Across protocol
//
AcrossSpokePool.FundsDeposited.handler(async ({ event, context }) => {
    const eventId =
        `${event.chainId}_${event.params.destinationChainId}_${event.params.depositId}_${event.params.depositor}`;

    // call defillama api to get current price and decimal for the input and output tokens
    // curl 'https://coins.llama.fi/prices/current/{coins}'
    // Example:
    //     {
    //   "coins": {
    //     "ethereum:0xdF574c24545E5FfEcb9a659c229253D4111d87e1": {
    //       "decimals": 8,
    //       "price": 0.022053735051098835,
    //       "symbol": "cDAI",
    //       "timestamp": 0.99
    //     }
    //   }
    // }

    const inputTokenAddress = bytes32ToAddress(event.params.inputToken);
    const outputTokenAddress = bytes32ToAddress(event.params.outputToken);
    const chainId = event.chainId;
    const destinationChainId = event.params.destinationChainId;

    // read json file and find name of the chain for the chainId
    const names = getNameFromChainId(chainId, Number(destinationChainId));

    const tokenOneData = await getPrice(`${names[0]}:${inputTokenAddress}`);
    const tokenTwoData = await getPrice(`${names[1]}:${outputTokenAddress}`);

    const precisionInputAmount = Number(
        event.params.inputAmount / BigInt(tokenOneData[1]),
    );
    const precisionOutputAmount = Number(
        event.params.outputAmount / BigInt(tokenTwoData[1]),
    );

    const usdInputAmount = tokenOneData[0] * precisionInputAmount;
    const usdOutputAmount = tokenTwoData[0] * precisionOutputAmount;

    const existingIntent = await context.Intent.get(eventId);
    if (existingIntent != undefined) {
        console.warn(
            `FilledRelay event is indexed before FundsDeposited event for id ${eventId}, updating the dummy that was added while creating this intent in FilledRelay handler.`,
        );

        const intent: Intent = {
            ...existingIntent,
            depositId: event.params.depositId,
            depositor: bytes32ToAddress(event.params.depositor),
            recipient: bytes32ToAddress(event.params.recipient),
            chainId: BigInt(event.chainId),
            destinationChainId: BigInt(event.params.destinationChainId),
            sourceTransactionHash: event.transaction.hash,
            exclusiveRelayer: bytes32ToAddress(event.params.exclusiveRelayer),
            exclusivityDeadline: BigInt(event.params.exclusivityDeadline),
            inputTokenAddress: bytes32ToAddress(event.params.inputToken),
            outputTokenAddress: bytes32ToAddress(event.params.outputToken),
            inputTokenAmount: BigInt(event.params.inputAmount),
            outputTokenAmount: BigInt(event.params.outputAmount),
            createdTimestamp: BigInt(event.block.timestamp),
            precisionInputAmount,
            precisionOutputAmount,
            usdInputAmount,
            usdOutputAmount,
        };

        context.Intent.set(intent);
    } else {
        console.info(`Creating new intent with id ${eventId}`);

        const intent: Intent = {
            id: eventId,
            depositId: event.params.depositId,
            filled: false,
            depositor: bytes32ToAddress(event.params.depositor),
            recipient: bytes32ToAddress(event.params.recipient),
            chainId: BigInt(event.chainId),
            destinationChainId: BigInt(event.params.destinationChainId),
            sourceTransactionHash: event.transaction.hash,
            exclusiveRelayer: bytes32ToAddress(event.params.exclusiveRelayer),
            exclusivityDeadline: BigInt(event.params.exclusivityDeadline),
            inputTokenAddress: bytes32ToAddress(event.params.inputToken),
            outputTokenAddress: bytes32ToAddress(event.params.outputToken),
            inputTokenAmount: BigInt(event.params.inputAmount),
            outputTokenAmount: BigInt(event.params.outputAmount),
            createdTimestamp: BigInt(event.block.timestamp),
            // these will be set when intent is filled
            destinationTransactionHash: undefined,
            feeAmount: undefined,
            filledTimestamp: undefined,
            precisionInputAmount,
            precisionOutputAmount,
            resolvedBy: undefined,
            sameRelayer: undefined,
            usdInputAmount,
            usdOutputAmount,
        };

        context.Intent.set(intent);
    }
});

AcrossSpokePool.FilledRelay.handler(async ({ event, context }) => {
    const eventId =
        `${event.params.originChainId}_${event.chainId}_${event.params.depositId}_${event.params.depositor}`;

    const intent = await context.Intent.get(eventId);

    console.log(`Does event exist? ${intent != undefined}`);

    if (intent != undefined) {
        const sameRelayer =
            bytes32ToAddress(event.params.relayer) === intent.exclusiveRelayer;

        const updatedIntent: Intent = {
            ...intent,
            filled: true,
            destinationTransactionHash: event.transaction.hash,
            filledTimestamp: BigInt(event.block.timestamp),
            resolvedBy: bytes32ToAddress(event.params.relayer),
            sameRelayer,
        };

        context.Intent.set(updatedIntent);
        return;
    }

    console.warn(
        `FilledRelay event is indexed before FundsDeposited event for id ${eventId}, creating intent with dummy values.`,
    );
    // set the intent with dummy values as FilledRelay event might get indexed before FundsDeposited event
    // while indexign old data

    const dummyIntent: Intent = {
        id: eventId,
        depositId: event.params.depositId,
        filled: true,
        depositor: bytes32ToAddress(event.params.depositor),
        recipient: bytes32ToAddress(event.params.recipient),
        chainId: BigInt(event.params.originChainId),
        destinationChainId: BigInt(event.chainId),
        sourceTransactionHash: "",
        exclusiveRelayer: bytes32ToAddress(event.params.exclusiveRelayer),
        exclusivityDeadline: BigInt(event.params.exclusivityDeadline),
        inputTokenAddress: bytes32ToAddress(event.params.inputToken),
        outputTokenAddress: bytes32ToAddress(event.params.outputToken),
        inputTokenAmount: BigInt(event.params.inputAmount),
        outputTokenAmount: BigInt(event.params.outputAmount),
        createdTimestamp: BigInt(0),
        destinationTransactionHash: event.transaction.hash,
        feeAmount: BigInt(0),
        filledTimestamp: BigInt(event.block.timestamp),
        precisionInputAmount: undefined,
        precisionOutputAmount: undefined,
        resolvedBy: bytes32ToAddress(event.params.relayer),
        sameRelayer: bytes32ToAddress(event.params.relayer) ===
            bytes32ToAddress(event.params.exclusiveRelayer),
        usdInputAmount: undefined,
        usdOutputAmount: undefined,
    };

    context.Intent.set(dummyIntent);
});
