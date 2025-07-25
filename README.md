# Across Indexer with [Envio](https://envio.dev)

> [!WARNING]  
> Project is work in progress so you might see boilerplate code in same place like in the `abi` or `test` folder.

-   [ ] Write handlers for `FilledRelay` & `FundDeposited`
-   [ ] Price API integration
-   [ ] Prices for past events
-   [ ] Write tests for the indexer
-   [ ] Dashboard

## Dashboard

The dashboard will be etherscan but for Across protocol where user can find analytics for the protocol plus details about any wallet address.

## Running Indexer

To run the indexer locally make sure you have docker installed and run the following command in the terminal:

```bash
pnpm dev
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
pnpm codegen

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
pnpm codegen

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
