import { AcrossSpokePool, Intent } from "generated";
import { bytes32ToAddress } from "./utils/addressUtils";

// Handler for the FilledRelay event
// This event is triggered when a wallet or contract sends requests to bridge assets with Across protocol
//
AcrossSpokePool.FundsDeposited.handler(async ({ event, context }) => {
    const eventId =
        `${event.chainId}_${event.params.destinationChainId}_${event.params.depositId}_${event.params.depositor}`;

    if (await context.Intent.get(eventId)) {
        console.warn(
            `Intent with id ${eventId} already exists, skipping creation.`,
        );

        // In this logic, assumption is that depositId will be unique for each intent but from the Across protocol docs it is not clear if this is the case.
        return;
    }

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
        precisionInputAmount: undefined,
        precisionOutputAmount: undefined,
        resolvedBy: undefined,
        sameRelayer: undefined,
        usdInputAmount: undefined,
        usdOutputAmount: undefined,
    };

    context.Intent.set(intent);
});

AcrossSpokePool.FilledRelay.handler(async ({ event, context }) => {
    const eventId =
        `${event.params.originChainId}_${event.chainId}_${event.params.depositId}_${event.params.depositor}`;

    const intent = await context.Intent.get(eventId);

    if (!intent) {
        console.warn(
            `Intent with id ${eventId} does not exist, skipping update.`,
        );
        return;
    }

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
});
