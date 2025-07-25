# Across Indexer with [Envio](https://envio.dev)

> [!WARNING]  
> Project is work in progress so you might see boilerplate code in same place like in the `abi` or `test` folder.

-   [x] Write handlers
    - [x] `FilledRelay` handler
    - [x] `FundDeposited` handler
-   [ ] Price API integration
-   [ ] Prices for past events
-   [ ] Write tests for the indexer
    - [x] `FilledRelay` tests
    - [ ] `FundsDeposited` tests
-   [ ] Dashboard

## Dashboard

The dashboard will be etherscan but for Across protocol where user can find analytics for the protocol plus details about any wallet address.

## Running Indexer

To run the indexer locally make sure you have docker installed and run the following command in the terminal:

```bash
pnpm dev
```

## Development & Testing

Run following command to run tests for indexer:
```bash
pnpm test
```

## Notes

In the `config.yaml`, the name you give to the contract can be anything and that is associated with contract definition at the top.

```yaml
networks:
    - id: 1
      start_block: 22681286
      contracts:
          - name: AcrossSpokePool
            address: 0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5
```

If you don't have same name defined at the top you will get an error.

```bash
> pnpm codegen

> envio-indexer@0.1.0 codegen /home/recyclebin/projects/envio/across-indexer-v4
> envio codegen

Error: Failed cli execution

Caused by:
    0: Failed parsing config
    1: Failed to parse contract 'AcrossSpokePool' for the network '1'. If you use a global contract definition, please verify that the name reference is correct.
 ELIFECYCLE  Command failed with exit code 1.
```

If any changes are made to `schema.graphql` or `config.yaml`, make sure to run the codegen command so dependencies can be generated.

The successful codegen command output looks like following:

```bash
> pnpm codegen

> envio-indexer@0.1.0 codegen /home/recyclebin/projects/envio/across-indexer-v4
> envio codegen

Installing packages...
Checking for pnpm package...
10.13.1
Package pnpm is already installed. Continuing...
 WARN  3 deprecated subdependencies found: glob@8.1.0, inflight@1.0.6, string-similarity@4.0.4
Already up to date
Progress: resolved 257, reused 249, downloaded 1, added 0, done
 WARN  Issues with peer dependencies found
.
├─┬ ink 3.2.0
│ └─┬ react-reconciler 0.26.2
│   └── ✕ unmet peer react@^17.0.2: found 18.2.0
└─┬ react-dom 19.1.0
  └── ✕ unmet peer react@^19.1.0: found 18.2.0
Done in 1.8s using pnpm v10.13.1
Lockfile is up to date, resolution step is skipped
Already up to date

╭ Warning ───────────────────────────────────────────────────────────────────────────────────╮
│                                                                                            │
│   Ignored build scripts: rescript.                                                         │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.   │
│                                                                                            │
╰────────────────────────────────────────────────────────────────────────────────────────────╯

Done in 284ms using pnpm v10.13.1
Generating HyperIndex code...
>>>> Start compiling
Dependency on rescript-schema
Dependency on rescript-envsafe
Dependency on @rescript/react
Dependency on envio
Dependency Finished
rescript: [154/154] src/Index.cmj
>>>> Finish compiling 824 mseconds
```

For getting additional fields, you need to use `field_selection` section and add what additional fields you want. For us those additional fields are transaction `hash` and `value` of ether sent with it. So modified `config.yaml` looks like following:

```yaml
events:
    - event: FilledRelay(bytes32 inputToken, bytes32 outputToken, uint256 inputAmount, uint256 outputAmount, uint256 repaymentChainId, uint256 indexed originChainId, uint256 indexed depositId, uint32 fillDeadline, uint32 exclusivityDeadline, bytes32 exclusiveRelayer, bytes32 indexed relayer, bytes32 depositor, bytes32 recipient, bytes32 messageHash, (bytes32,bytes32,uint256,uint8) relayExecutionInfo)
      field_selection:
          transaction_fields:
              - "hash"
              - "value"
    - event: FundsDeposited(bytes32 inputToken, bytes32 outputToken, uint256 inputAmount, uint256 outputAmount, uint256 indexed destinationChainId, uint256 indexed depositId, uint32 quoteTimestamp, uint32 fillDeadline, uint32 exclusivityDeadline, bytes32 indexed depositor, bytes32 recipient, bytes32 exclusiveRelayer, bytes message)
      field_selection:
          transaction_fields:
              - "hash"
              - "value"
```

You need to add `field_selection` for each event where you need it. I want to show transaction hash for both source and destination chains so I am getting hash value for both.

While working with yaml make sure indentation is correct, I got error while working with it where I needed to change it from using tabs to spaces otherwise I got following error:

```bash
> pnpm codegen

> envio-indexer@0.1.0 codegen /home/recyclebin/projects/envio/across-indexer-v4
> envio codegen

Error: Failed cli execution

Caused by:
    0: Failed parsing config
    1: EE105: Failed to deserialize config. The config.yaml file is either not a valid yaml or the "ecosystem" field is not a string.
    2: found a tab character that violates indentation at line 15 column 1, while scanning a plain scalar at line 14 column 20
 ELIFECYCLE  Command failed with exit code 1.
```

While this issue might not happen while you work with this but I wanted to note it down anyway.

For the field_selection section, we used name `hash` and `value` for transaction hash and ether value sent with transaction respectively but how would you know name of other field that you might need? You can name of field by going to this page. It also has field name for block and few others: [https://docs.envio.dev/docs/HyperSync/hypersync-query#data-schema](https://docs.envio.dev/docs/HyperSync/hypersync-query#data-schema)

_Tests:_ When testing things like transaction hash, log index, or transaction value are automatically generated so you don't need to think about them.

```ts
const mockEvent = AcrossSpokePool.FundsDeposited.createMockEvent({
    inputToken,
    outputToken,
    inputAmount,
    outputAmount,
    destinationChainId,
    depositId,
    exclusivityDeadline,
    depositor,
    recipient,
    exclusiveRelayer,
});
```

You can access them like shown below:

```ts
mockEvent.chainId; // get chainId
mockEvent.block.number; // get block number
mockEvent.transaction.hash; // get transaction hash
```
