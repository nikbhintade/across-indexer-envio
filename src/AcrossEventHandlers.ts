import { AcrossSpokePool, Intent } from "generated";
import { bytes32ToAddress } from "./utils/addressUtils";

// Handler for the FilledRelay event
// This event is triggered when a wallet or contract sends requests to bridge assets with Across protocol
//
AcrossSpokePool.FundsDeposited.handler(async ({ event, context }) => {
    const intent: Intent = {
        id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
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
});
