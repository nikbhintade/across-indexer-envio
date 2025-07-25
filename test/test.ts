// import assert from "assert";
// import { TestHelpers, User } from "generated";
// const { MockDb, Greeter, Addresses } = TestHelpers;

// describe("Greeter template tests", () => {
//   it("A NewGreeting event creates a User entity", async () => {
//     // Initializing the mock database
//     const mockDbInitial = MockDb.createMockDb();

//     // Initializing values for mock event
//     const userAddress = Addresses.defaultAddress;
//     const greeting = "Hi there";

//     // Creating a mock event
//     const mockNewGreetingEvent = Greeter.NewGreeting.createMockEvent({
//       greeting: greeting,
//       user: userAddress,
//     });

//     // Processing the mock event on the mock database
//     const updatedMockDb = await Greeter.NewGreeting.processEvent({
//       event: mockNewGreetingEvent,
//       mockDb: mockDbInitial,
//     });

//     // Expected entity that should be created
//     const expectedUserEntity: User = {
//       id: userAddress,
//       latestGreeting: greeting,
//       numberOfGreetings: 1,
//       greetings: [greeting],
//     };

//     // Getting the entity from the mock database
//     const actualUserEntity = updatedMockDb.entities.User.get(userAddress);

//     // Asserting that the entity in the mock database is the same as the expected entity
//     assert.deepEqual(expectedUserEntity, actualUserEntity);
//   });

//   it("2 Greetings from the same users results in that user having a greeter count of 2", async () => {
//     // Initializing the mock database
//     const mockDbInitial = MockDb.createMockDb();
//     // Initializing values for mock event
//     const userAddress = Addresses.defaultAddress;
//     const greeting = "Hi there";
//     const greetingAgain = "Oh hello again";

//     // Creating a mock event
//     const mockNewGreetingEvent = Greeter.NewGreeting.createMockEvent({
//       greeting: greeting,
//       user: userAddress,
//     });

//     // Creating a mock event
//     const mockNewGreetingEvent2 = Greeter.NewGreeting.createMockEvent({
//       greeting: greetingAgain,
//       user: userAddress,
//     });

//     // Processing the mock event on the mock database
//     const updatedMockDb = await Greeter.NewGreeting.processEvent({
//       event: mockNewGreetingEvent,
//       mockDb: mockDbInitial,
//     });

//     // Processing the mock event on the updated mock database
//     const updatedMockDb2 = await Greeter.NewGreeting.processEvent({
//       event: mockNewGreetingEvent2,
//       mockDb: updatedMockDb,
//     });

//     // Getting the entity from the mock database
//     const actualUserEntity = updatedMockDb2.entities.User.get(userAddress);

//     // Asserting that the field value of the entity in the mock database is the same as the expected field value
//     assert.equal(2, actualUserEntity?.numberOfGreetings);
//   });

//   it("2 Greetings from the same users results in the latest greeting being the greeting from the second event", async () => {
//     // Initializing the mock database
//     const mockDbInitial = MockDb.createMockDb();
//     // Initializing values for mock event
//     const userAddress = Addresses.defaultAddress;
//     const greeting = "Hi there";
//     const greetingAgain = "Oh hello again";

//     // Creating a mock event
//     const mockNewGreetingEvent = Greeter.NewGreeting.createMockEvent({
//       greeting: greeting,
//       user: userAddress,
//     });

//     // Creating a mock event
//     const mockNewGreetingEvent2 = Greeter.NewGreeting.createMockEvent({
//       greeting: greetingAgain,
//       user: userAddress,
//     });

//     // Processing the mock event on the mock database
//     const updatedMockDb = await Greeter.NewGreeting.processEvent({
//       event: mockNewGreetingEvent,
//       mockDb: mockDbInitial,
//     });

//     // Processing the mock event on the updated mock database
//     const updatedMockDb2 = await Greeter.NewGreeting.processEvent({
//       event: mockNewGreetingEvent2,
//       mockDb: updatedMockDb,
//     });

//     // Getting the entity from the mock database
//     const actualUserEntity = updatedMockDb2.entities.User.get(userAddress);

//     const expectedGreeting: string = greetingAgain;

//     // Asserting that the field value of the entity in the mock database is the same as the expected field value
//     assert.equal(expectedGreeting, actualUserEntity?.latestGreeting);
//   });
// });

import assert from "assert";
import { Intent, TestHelpers } from "generated";
import { addressToBytes32 } from "../src/utils/addressUtils";
import { ethers } from "ethers";
const { MockDb, AcrossSpokePool } = TestHelpers;

describe("AcrossSpokePool template tests", () => {
  it("FundsDeposited creates a new Intent entity", async () => {
    const mockDbInitial = MockDb.createMockDb();

    const inputToken = ethers.getAddress(
      "0x2260FAC5E5542A773AA44FBCFEDF7C193BC2C599",
    );
    const outputToken = ethers.getAddress(
      "0x2F2A2543B76A4166549F7AAB2E75BEF0AEFC5B0F",
    );
    const inputAmount = BigInt(50000000);
    const outputAmount = BigInt(49982243);
    const destinationChainId = BigInt(42161);
    const depositId = BigInt(2895437);
    const exclusivityDeadline = BigInt(1753443971);
    const depositor = ethers.getAddress(
      "0x58817EB46BF7075BDF00AD8BD6C2AC731E9B045F",
    );
    const recipient = ethers.getAddress(
      "0x58817EB46BF7075BDF00AD8BD6C2AC731E9B045F",
    );
    const exclusiveRelayer = ethers.getAddress(
      "0xEF1EC136931AB5728B0783FD87D109C9D15D31F1",
    );

    const mockEvent = AcrossSpokePool.FundsDeposited.createMockEvent({
      inputToken: addressToBytes32(inputToken),
      outputToken: addressToBytes32(outputToken),
      inputAmount,
      outputAmount,
      destinationChainId,
      depositId,
      exclusivityDeadline,
      depositor: addressToBytes32(depositor),
      recipient: addressToBytes32(recipient),
      exclusiveRelayer: addressToBytes32(exclusiveRelayer),
    });

    const updatedMockDb = await AcrossSpokePool.FundsDeposited.processEvent({
      event: mockEvent,
      mockDb: mockDbInitial,
    });

    const expectedId =
      `${mockEvent.chainId}_${mockEvent.block.number}_${mockEvent.logIndex}`;
    const intent = updatedMockDb.entities.Intent.get(expectedId);

    assert(intent, "Intent entity should exist");

    assert.strictEqual(intent?.id, expectedId, "id mismatch");
    assert.strictEqual(intent?.depositId, depositId, "depositId mismatch");
    assert.strictEqual(intent?.filled, false, "filled should be false");
    assert.strictEqual(intent?.depositor, depositor, "depositor mismatch");
    assert.strictEqual(intent?.recipient, recipient, "recipient mismatch");
    assert.strictEqual(intent?.chainId.toString(), "1", "chainId mismatch");
    assert.strictEqual(
      intent?.destinationChainId,
      destinationChainId,
      "destinationChainId mismatch",
    );
    assert.strictEqual(
      intent?.sourceTransactionHash,
      mockEvent.transaction.hash,
      "sourceTransactionHash mismatch",
    );
    assert.strictEqual(
      intent?.exclusiveRelayer,
      exclusiveRelayer,
      "exclusiveRelayer mismatch",
    );
    assert.strictEqual(
      intent?.exclusivityDeadline,
      exclusivityDeadline,
      "exclusivityDeadline mismatch",
    );
    assert.strictEqual(
      intent?.inputTokenAddress,
      inputToken,
      "inputTokenAddress mismatch",
    );
    assert.strictEqual(
      intent?.outputTokenAddress,
      outputToken,
      "outputTokenAddress mismatch",
    );
    assert.strictEqual(
      intent?.inputTokenAmount,
      inputAmount,
      "inputTokenAmount mismatch",
    );
    assert.strictEqual(
      intent?.outputTokenAmount,
      outputAmount,
      "outputTokenAmount mismatch",
    );

    assert.strictEqual(
      intent?.destinationTransactionHash,
      undefined,
      "destinationTransactionHash should be undefined",
    );
    assert.strictEqual(
      intent?.feeAmount,
      undefined,
      "feeAmount should be undefined",
    );
    assert.strictEqual(
      intent?.filledTimestamp,
      undefined,
      "filledTimestamp should be undefined",
    );
    assert.strictEqual(
      intent?.precisionInputAmount,
      undefined,
      "precisionInputAmount should be undefined",
    );
    assert.strictEqual(
      intent?.precisionOutputAmount,
      undefined,
      "precisionOutputAmount should be undefined",
    );
    assert.strictEqual(
      intent?.resolvedBy,
      undefined,
      "resolvedBy should be undefined",
    );
    assert.strictEqual(
      intent?.sameRelayer,
      undefined,
      "sameRelayer should be undefined",
    );
    assert.strictEqual(
      intent?.usdInputAmount,
      undefined,
      "usdInputAmount should be undefined",
    );
    assert.strictEqual(
      intent?.usdOutputAmount,
      undefined,
      "usdOutputAmount should be undefined",
    );
  });
});
