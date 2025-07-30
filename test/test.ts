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
import { addressToBytes32, bytes32ToAddress } from "../src/utils/addressUtils";
import { ethers } from "ethers";
const { MockDb, AcrossSpokePool } = TestHelpers;

import fs from "fs";
import path from "path";
import mockFs from "mock-fs";
import nock from "nock";

import { getPrice } from "../src/utils/getPrice";

describe("getPrice", () => {
  const tokenWithChain = "ethereum:0xdF574c24545E5FfEcb9a659c229253D4111d87e1";
  const mockApiUrl = "https://coins.llama.fi";
  const mockApiResponse = {
    coins: {
      [tokenWithChain]: {
        decimals: 8,
        price: 0.022,
        symbol: "cDAI",
        timestamp: 1720076645,
      },
    },
  };
  const filePath = path.join(__dirname, "../data/prices.json");

  beforeEach(() => {
    console.log("dir name:", __dirname);
    // Set up fake filesystem
    mockFs({
      [path.join(__dirname, "../data")]: {
        "prices.json": "{}",
      },
    });
  });

  afterEach(() => {
    mockFs.restore();
    nock.cleanAll();
  });

  it("fetches fresh data and caches it when not already cached", async () => {
    nock(mockApiUrl)
      .get(`/prices/current/${tokenWithChain}`)
      .reply(200, mockApiResponse);

    const [price, decimals] = await getPrice(tokenWithChain);

    console.log("Price of token:", price);
    assert.strictEqual(price, 0.022);
    assert.strictEqual(decimals, 8);

    const saved = JSON.parse(fs.readFileSync(filePath, "utf8"));
    assert.strictEqual(saved[tokenWithChain].currentPrice, 0.022);
    assert.strictEqual(saved[tokenWithChain].decimals, 8);
  });

  it.only("returns cached data if not older than 60 seconds", async () => {
    const now = Math.floor(Date.now() / 1000);
    const cached = {
      [tokenWithChain]: {
        currentPrice: 0.123,
        decimals: 6,
        timestamp: now,
      },
    };
    fs.writeFileSync(filePath, JSON.stringify(cached, null, 2), "utf8");

    const [price, decimals] = await getPrice(tokenWithChain);
    assert.strictEqual(price, 0.123);
    assert.strictEqual(decimals, 6);
  });

  it("returns [0, 0] when fetch fails", async () => {
    nock(mockApiUrl)
      .get(`/prices/current/${tokenWithChain}`)
      .reply(500);

    const [price, decimals] = await getPrice(tokenWithChain);
    assert.strictEqual(price, 0);
    assert.strictEqual(decimals, 0);
  });

  it("returns [0, 0] when response has no token data", async () => {
    nock(mockApiUrl)
      .get(`/prices/current/${tokenWithChain}`)
      .reply(200, { coins: {} });

    const [price, decimals] = await getPrice(tokenWithChain);
    assert.strictEqual(price, 0);
    assert.strictEqual(decimals, 0);
  });
});

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
      mockEventData: {
        chainId: 42161,
      },
    });

    const chainId = 42161;

    const updatedMockDb = await AcrossSpokePool.FundsDeposited.processEvent({
      event: mockEvent,
      mockDb: mockDbInitial,
    });

    const expectedId =
      `${mockEvent.chainId}_${mockEvent.params.destinationChainId}_${mockEvent.params.depositId}_${mockEvent.params.depositor}`;
    const intent = updatedMockDb.entities.Intent.get(expectedId);
    {
      assert(intent, "Intent entity should exist");

      assert.strictEqual(intent?.id, expectedId, "id mismatch");
      assert.strictEqual(intent?.depositId, depositId, "depositId mismatch");
      assert.strictEqual(intent?.filled, false, "filled should be false");
      assert.strictEqual(intent?.depositor, depositor, "depositor mismatch");
      assert.strictEqual(intent?.recipient, recipient, "recipient mismatch");
      assert.strictEqual(
        intent?.chainId.toString(),
        chainId.toString(),
        "chainId mismatch",
      );
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
    }
  });

  it("Updating an existing Intent in FundsDeposited handler", async () => {
    // Initializing the mock database
    const mockDbInitial = MockDb.createMockDb();

    // create mock FilldRelay event & process it

    const ethereumChainId = 1;
    const arbitrumChainId = 42161;

    // create FundsDeposited event
    const inputToken = ethers.getAddress(
      "0x2260FAC5E5542A773AA44FBCFEDF7C193BC2C599",
    );
    const outputToken = ethers.getAddress(
      "0x2F2A2543B76A4166549F7AAB2E75BEF0AEFC5B0F",
    );
    const inputAmount = BigInt(50000000);
    const outputAmount = BigInt(49982243);
    const destinationChainId = BigInt(arbitrumChainId);
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

    const filledRelayEvent = AcrossSpokePool.FilledRelay.createMockEvent({
      inputToken: addressToBytes32(inputToken),
      outputToken: addressToBytes32(outputToken),
      inputAmount,
      outputAmount,
      repaymentChainId: BigInt(ethereumChainId),
      originChainId: BigInt(ethereumChainId),
      depositId,
      fillDeadline: BigInt(1753443972),
      exclusivityDeadline,
      exclusiveRelayer: addressToBytes32(exclusiveRelayer),
      relayer: addressToBytes32(exclusiveRelayer), // same as exclusiveRelayer
      depositor: addressToBytes32(depositor),
      recipient: addressToBytes32(recipient),
      messageHash: ethers.ZeroHash,
      relayExecutionInfo: [
        ethers.ZeroHash,
        ethers.ZeroHash,
        BigInt(0),
        BigInt(0),
      ],
      mockEventData: {
        chainId: arbitrumChainId,
      },
    });

    const updatedMockDb = await AcrossSpokePool.FilledRelay.processEvent({
      event: filledRelayEvent,
      mockDb: mockDbInitial,
    });

    const intent = updatedMockDb.entities.Intent.get(
      `${filledRelayEvent.params.originChainId}_${filledRelayEvent.chainId}_${filledRelayEvent.params.depositId}_${filledRelayEvent.params.depositor}`,
    );

    // assertions
    assert(intent, "Intent entity should exist");

    // depositId
    assert.strictEqual(intent.depositId, depositId, "depositId mismatch");
    // filled flag
    assert.strictEqual(intent.filled, true, "filled should be true");
    // depositor
    assert.strictEqual(intent.depositor, depositor, "depositor mismatch");
    // recipient
    assert.strictEqual(intent.recipient, recipient, "recipient mismatch");
    // chainId
    assert.strictEqual(
      intent.chainId,
      BigInt(ethereumChainId),
      "chainId mismatch",
    );
    // destinationChainId
    assert.strictEqual(
      intent.destinationChainId,
      BigInt(arbitrumChainId),
      "destinationChainId mismatch",
    );
    // sourceTransactionHash == ""
    assert.strictEqual(
      intent.sourceTransactionHash,
      "",
      "sourceTransactionHash should be empty",
    );
    // exclusiveRelayer
    assert.strictEqual(
      intent.exclusiveRelayer,
      exclusiveRelayer,
      "exclusiveRelayer mismatch",
    );
    // exclusivityDeadline
    assert.strictEqual(
      intent.exclusivityDeadline,
      exclusivityDeadline,
      "exclusivityDeadline mismatch",
    );
    // inputTokenAddress
    assert.strictEqual(
      intent.inputTokenAddress,
      inputToken,
      "inputTokenAddress mismatch",
    );
    // outputTokenAddress
    assert.strictEqual(
      intent.outputTokenAddress,
      outputToken,
      "outputTokenAddress mismatch",
    );
    // inputTokenAmount
    assert.strictEqual(
      intent.inputTokenAmount,
      inputAmount,
      "inputTokenAmount mismatch",
    );
    // outputTokenAmount
    assert.strictEqual(
      intent.outputTokenAmount,
      outputAmount,
      "outputTokenAmount mismatch",
    );
    // createdTimestamp == 0
    assert.strictEqual(
      intent.createdTimestamp,
      BigInt(0),
      "createdTimestamp should be 0",
    );
    // destinationTransactionHash == event.transaction.hash
    assert.strictEqual(
      intent.destinationTransactionHash,
      filledRelayEvent.transaction.hash,
      "destinationTransactionHash mismatch",
    );
    // feeAmount == 0
    assert.strictEqual(intent.feeAmount, BigInt(0), "feeAmount should be 0");
    // filledTimestamp == event.block.timestamp
    assert.strictEqual(
      intent.filledTimestamp,
      BigInt(filledRelayEvent.block.timestamp),
      "filledTimestamp mismatch",
    );
    // precisionInputAmount == undefined
    assert.strictEqual(
      intent.precisionInputAmount,
      undefined,
      "precisionInputAmount should be undefined",
    );
    // precisionOutputAmount == undefined
    assert.strictEqual(
      intent.precisionOutputAmount,
      undefined,
      "precisionOutputAmount should be undefined",
    );
    // resolvedBy == relayer
    assert.strictEqual(
      intent.resolvedBy,
      bytes32ToAddress(filledRelayEvent.params.relayer),
      "resolvedBy mismatch",
    );
    // sameRelayer == true
    assert.strictEqual(
      intent.sameRelayer,
      true,
      "sameRelayer mismatch (should be true, same relayer)",
    );
    // usdInputAmount == undefined
    assert.strictEqual(
      intent.usdInputAmount,
      undefined,
      "usdInputAmount should be undefined",
    );
    // usdOutputAmount == undefined
    assert.strictEqual(
      intent.usdOutputAmount,
      undefined,
      "usdOutputAmount should be undefined",
    );

    // create FundsDeposited event & process it
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
      mockEventData: {
        chainId: ethereumChainId,
      },
    });

    const updatedMockDb2 = await AcrossSpokePool.FundsDeposited.processEvent({
      event: mockEvent,
      mockDb: updatedMockDb,
    });

    // assertions

    const expectedId =
      `${mockEvent.chainId}_${mockEvent.params.destinationChainId}_${mockEvent.params.depositId}_${mockEvent.params.depositor}`;
    const updatedIntent = updatedMockDb2.entities.Intent.get(expectedId);

    assert(updatedIntent, "Intent entity should exist");

    // depositId
    assert.strictEqual(
      updatedIntent.depositId,
      depositId,
      "depositId mismatch",
    );
    // depositor
    assert.strictEqual(
      updatedIntent.depositor,
      depositor,
      "depositor mismatch",
    );
    // recipient
    assert.strictEqual(
      updatedIntent.recipient,
      recipient,
      "recipient mismatch",
    );
    // chainId
    assert.strictEqual(
      updatedIntent.chainId,
      BigInt(ethereumChainId),
      "chainId mismatch",
    );
    // destinationChainId
    assert.strictEqual(
      updatedIntent.destinationChainId,
      BigInt(arbitrumChainId),
      "destinationChainId mismatch",
    );
    // sourceTransactionHash == mockEvent.transaction.hash
    assert.strictEqual(
      updatedIntent.sourceTransactionHash,
      mockEvent.transaction.hash,
      "sourceTransactionHash mismatch",
    );

    // exclusiveRelayer
    assert.strictEqual(
      updatedIntent.exclusiveRelayer,
      exclusiveRelayer,
      "exclusiveRelayer mismatch",
    );
    // exclusivityDeadline
    assert.strictEqual(
      updatedIntent.exclusivityDeadline,
      exclusivityDeadline,
      "exclusivityDeadline mismatch",
    );
    // inputTokenAddress
    assert.strictEqual(
      updatedIntent.inputTokenAddress,
      inputToken,
      "inputTokenAddress mismatch",
    );
    // outputTokenAddress
    assert.strictEqual(
      updatedIntent.outputTokenAddress,
      outputToken,
      "outputTokenAddress mismatch",
    );
    // inputTokenAmount
    assert.strictEqual(
      updatedIntent.inputTokenAmount,
      inputAmount,
      "inputTokenAmount mismatch",
    );
    // outputTokenAmount
    assert.strictEqual(
      updatedIntent.outputTokenAmount,
      outputAmount,
      "outputTokenAmount mismatch",
    );
    // createdTimestamp == mockEvent.block.timestamp
    assert.strictEqual(
      updatedIntent.createdTimestamp,
      BigInt(mockEvent.block.timestamp),
      "createdTimestamp mismatch",
    );
  });

  it("updates an existing Intent as filled", async () => {
    const mockDbInitial = MockDb.createMockDb();

    const ethereumChainId = 1;
    const arbitrumChainId = 42161;

    // create FundsDeposited event
    const inputToken = ethers.getAddress(
      "0x2260FAC5E5542A773AA44FBCFEDF7C193BC2C599",
    );
    const outputToken = ethers.getAddress(
      "0x2F2A2543B76A4166549F7AAB2E75BEF0AEFC5B0F",
    );
    const inputAmount = BigInt(50000000);
    const outputAmount = BigInt(49982243);
    const destinationChainId = BigInt(arbitrumChainId);
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

    //
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
      mockEventData: {
        chainId: ethereumChainId,
      },
    });

    // process that event
    const updatedMockDb = await AcrossSpokePool.FundsDeposited.processEvent({
      event: mockEvent,
      mockDb: mockDbInitial,
    });

    // then create FilledRelay event to update it
    const filledRelayEvent = AcrossSpokePool.FilledRelay.createMockEvent({
      inputToken: addressToBytes32(inputToken),
      outputToken: addressToBytes32(outputToken),
      inputAmount,
      outputAmount,
      repaymentChainId: BigInt(ethereumChainId),
      originChainId: BigInt(ethereumChainId),
      depositId,
      fillDeadline: BigInt(1753443972),
      exclusivityDeadline,
      exclusiveRelayer: addressToBytes32(exclusiveRelayer),
      relayer: addressToBytes32(exclusiveRelayer), // same as exclusiveRelayer
      depositor: addressToBytes32(depositor),
      recipient: addressToBytes32(recipient),
      messageHash: ethers.ZeroHash,
      relayExecutionInfo: [
        ethers.ZeroHash,
        ethers.ZeroHash,
        BigInt(0),
        BigInt(0),
      ],
      mockEventData: {
        chainId: arbitrumChainId,
      },
    });

    // process that event
    const updatedMockDb2 = await AcrossSpokePool.FilledRelay.processEvent({
      event: filledRelayEvent,
      mockDb: updatedMockDb,
    });

    // assertions
    const expectedId =
      `${filledRelayEvent.params.originChainId}_${filledRelayEvent.chainId}_${filledRelayEvent.params.depositId}_${filledRelayEvent.params.depositor}`;
    const intent = updatedMockDb2.entities.Intent.get(expectedId);
    {
      assert(intent, "Intent entity should exist");

      assert.strictEqual(intent?.id, expectedId, "id mismatch");
      assert.strictEqual(intent?.depositId, depositId, "depositId mismatch");
      assert.strictEqual(intent?.filled, true, "filled should be false");
      assert.strictEqual(intent?.depositor, depositor, "depositor mismatch");
      assert.strictEqual(intent?.recipient, recipient, "recipient mismatch");
      assert.strictEqual(
        intent?.chainId.toString(),
        ethereumChainId.toString(),
        "chainId mismatch",
      );
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
        filledRelayEvent.transaction.hash,
        "destinationTransactionHash mismatch",
      );
      assert.strictEqual(
        intent?.feeAmount,
        undefined,
        "feeAmount should be undefined",
      );
      assert.strictEqual(
        intent?.filledTimestamp,
        BigInt(filledRelayEvent.block.timestamp),
        "filledTimestamp mismatch",
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
        bytes32ToAddress(filledRelayEvent.params.relayer),
        "resolvedBy mismatch",
      );
      assert.strictEqual(
        intent?.sameRelayer,
        true,
        "sameRelayer mismatch (should be true, same relayer)",
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
    }
  });
});
