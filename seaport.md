SEAPORT 1.6 CONTRACT: 0x0000000000000068F116a894984e2DB1123eB395

[block:image]
{
  "images": [
    {
      "image": [
        "https://files.readme.io/ff5b9c7-Screenshot_2024-01-17_at_12.59.49_PM.png",
        "",
        ""
      ],
      "align": "center"
    }
  ]
}
[/block]


# Overview

Seaport is a marketplace protocol for safely and efficiently buying and selling NFTs on the blockchain. Seaport was developed by OpenSea in 2022 and is the most used protocol for NFT transactions. Seaport powers the OpenSea website -- all orders created or fulfilled on OpenSea use the Seaport protocol. 

# Notable Links

- [Seaport Repo](https://github.com/ProjectOpenSea/seaport) 
- [Metrics](https://dune.com/opensea_team/seaport)
- [Release Blog](https://opensea.io/blog/articles/introducing-seaport-protocol)

***

# How does it work?

Each Seaport order has many components, but we'll first discuss the: the `offer` and the `consideration`.  To oversimplify:

- `offer`: what I am willing to give up (ETH / ERC20 / ERC721 / ERC1155)
- `consideration`: what is required in return (ETH / ERC20 / ERC721 / ERC1155)

For example, if you want to place an offer on an NFT for 1 WETH, the `offer` struct would look similar to this:

**Offer Example**

```json Text
{
  itemType: ItemType.FULL_OPEN,
  address: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,
  identifierOrCriteria: 0
  startAmount: 1000000000000000,
  endAmount: 1000000000000000
}
```

_Breaking it down:_

The `address` and the `identifierOrCriteria ` represent which token is being offered (in this case, [WETH](https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2)), and the `startAmount` and `endAmount `  represent how much of that token you're willing to pay. Again, this is just a basic offer at a set price, which is why the amounts are the same. 

If the NFT of interest is the [Cool Cats #1](https://opensea.io/assets/ethereum/0x1a92f7381b9f03921564a437210bb9396471050c/1) NFT, then the `consideration ` would look something like this:

**Consideration Example**

```json Text
{
  itemType: ItemType.FULL_OPEN,
  address: 0x1a92f7381b9f03921564a437210bb9396471050c,
  identifierOrCriteria: 1
  startAmount: 1,
  endAmount: 1,
  recipient: <your_address>
}
```

_Breaking it down:_

The `address` is the address of the Cool Cats NFT contract, the `identifierOrCriteria` is 1 because we want the NFT with tokenId 1, and the `startAmount` and `endAmount ` are also 1 because we are offering for a single NFT (with ERC1155s, the amounts are often greater than 1). 

***

# How does it work with the OpenSea website?

If you place this offer through the OpenSea website (ex. offering 1 WETH for [Cool Cats #1](https://opensea.io/assets/ethereum/0x1a92f7381b9f03921564a437210bb9396471050c/1)), OpenSea generates a Seaport order with those `offer` and `consideration` structs (and a bunch more info). OpenSea asks you to sign the order, and when you do, the order is submitted to the Seaport contract directly. 

OpenSea constantly listens to and stores events on the Seaport protocol. Next time the owner of that NFT logs in, they'll see that offer on their NFT. If they choose to accept, OpenSea generates a "counter-listing" that is then submitted to Seaport. 

Once Seaport sees the corresponding counter order, and if the offers are still valid, Seaport makes sure both the seller and the buyer receive the items they expect, and the transaction completes. This was a very high level overview



## Basic Models <a name="basic-heading"></a>

***

### Order Model <a name="order"></a>

| Field          | Description                                     | Type                         |
| :------------- | :---------------------------------------------- | :--------------------------- |
| **parameters** | the order specifications                        | [`OrderParameters`](#params) |
| **signature**  | either standard 65-byte EDCSA, 64-byte EIP-2098 | `bytes`                      |

_Struct Representation_

```sol Solidity
struct Order {
  struct OrderParameters parameters;
  bytes signature;
}
```

***

### OrderParameters Model <a name="params"></a>

[block:parameters]
{
  "data": {
    "h-0": "Field",
    "h-1": "Description",
    "h-2": "Type",
    "0-0": "**offerer**",
    "0-1": "The `offerer` of the order supplies all offered items and must either fulfill the order personally (i.e. `msg.sender == offerer`) or approve the order via signature (either standard 65-byte EDCSA, 64-byte EIP-2098, or an EIP-1271 `isValidSignature` check) or by listing the order on-chain (i.e. calling `validate`)",
    "0-2": "`address`",
    "1-0": "**zone**",
    "1-1": "The `zone` of the order is an optional secondary account attached to the order with two additional privileges:  \n  \n1. The zone may cancel orders where it is named as the zone by calling `cancel`. (Note that offerers can also cancel their own orders, either individually or for all orders signed with their current counter at once by calling `incrementCounter`).\n2. \"Restricted\" orders (as specified by the order type) can be executed by anyone but must be approved by the zone indicated by a call to `validateOrder` on the zone.",
    "1-2": "`address`",
    "2-0": "**offer**",
    "2-1": "an array of items that may be transferred from the offerer's account",
    "2-2": "[`OfferItem[]`](#offer)",
    "3-0": "**consideration**",
    "3-1": "an array of items that must be received in order to fulfill the order",
    "3-2": "[`ConsiderationItem[]`](#consideration)",
    "4-0": "**orderType**",
    "4-1": "designates one of four types for the order",
    "4-2": "`OrderType`",
    "5-0": "**startTime**",
    "5-1": "block timestamp at which the order becomes active",
    "5-2": "`uint256`",
    "6-0": "**endTime**",
    "6-1": "block timestamp at which the order expires",
    "6-2": "`uint256`",
    "7-0": "**zoneHash**",
    "7-1": "an arbitrary 32-byte value that will be supplied to the zone when fulfilling restricted orders that the zone can utilize when making a determination on whether to authorize the order",
    "7-2": "`bytes32`",
    "8-0": "**salt**",
    "8-1": "an arbitrary source of entropy for the order",
    "8-2": "`uint256`",
    "9-0": "**conduitKey**",
    "9-1": "indicates what conduit, if any, should be utilized as a source for token approvals when performing transfers. By default (i.e. when conduitKey is set to the zero hash), the offerer will grant ERC20, ERC721, and ERC1155 token approvals to Seaport directly so that it can perform any transfers specified by the order during fulfillment",
    "9-2": "`bytes32`",
    "10-0": "**counter**",
    "10-1": "a value that must match the current counter for the given offerer.",
    "10-2": "`uint256`"
  },
  "cols": 3,
  "rows": 11,
  "align": [
    "left",
    "left",
    "left"
  ]
}
[/block]


_Struct Representation_

```sol Solidity
struct OrderComponents {
  address offerer;
  address zone;
  struct OfferItem[] offer;
  struct ConsiderationItem[] consideration;
  enum OrderType orderType;
  uint256 startTime;
  uint256 endTime;
  bytes32 zoneHash;
  uint256 salt;
  bytes32 conduitKey;
  uint256 counter;
}
```

***

### OfferItem Model <a name="offer"></a>

| Field                    | Description                                                                                                                                                                                                                                                                                                                        | Type       |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------- |
| **itemType**             | the type of item, with valid types being Ether (or other native token for the given chain), ERC20, ERC721, ERC1155, ERC721 with "criteria" (explained below), and ERC1155 with criteria                                                                                                                                            | `ItemType` |
| **token**                | designates the address of the item's token contract (with the null address used for Ether or other native tokens)                                                                                                                                                                                                                  | `address`  |
| **identifierOrCriteria** | represents either the ERC721 or ERC1155 token identifier or, in the case of a criteria-based item type, a merkle root composed of the valid set of token identifiers for the item. This value will be ignored for Ether and ERC20 item types, and can optionally be zero for criteria-based item types to allow for any identifier | `uint256`  |
| **startAmount**          | the amount of the item in question that will be required should the order be fulfilled at the moment the order becomes active                                                                                                                                                                                                      | `uint256`  |
| **endAmount**            | the amount of the item in question that will be required should the order be fulfilled at the moment the order expires. If this value differs from the item's `startAmount`, the realized amount is calculated linearly based on the time elapsed since the order became active.                                                   | `uint256`  |
|                          |                                                                                                                                                                                                                                                                                                                                    |            |

_Struct Representation_

```sol Solidity
struct OfferItem {
  enum ItemType itemType;
  address token;
  uint256 identifierOrCriteria;
  uint256 startAmount;
  uint256 endAmount;
}
```

***

### ConsiderationItem Model<a name="consideration"></a>

| Field                    | Description                                                                                                                                                                                                                                                                                                                        | Type       |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------- |
| **itemType**             | the type of item, with valid types being Ether (or other native token for the given chain), ERC20, ERC721, ERC1155, ERC721 with "criteria" (explained below), and ERC1155 with criteria                                                                                                                                            | `ItemType` |
| **token**                | designates the address of the item's token contract (with the null address used for Ether or other native tokens)                                                                                                                                                                                                                  | `address`  |
| **identifierOrCriteria** | represents either the ERC721 or ERC1155 token identifier or, in the case of a criteria-based item type, a merkle root composed of the valid set of token identifiers for the item. This value will be ignored for Ether and ERC20 item types, and can optionally be zero for criteria-based item types to allow for any identifier | `uint256`  |
| **startAmount**          | the amount of the item in question that will be required should the order be fulfilled at the moment the order becomes active                                                                                                                                                                                                      | `uint256`  |
| **endAmount**            | the amount of the item in question that will be required should the order be fulfilled at the moment the order expires. If this value differs from the item's `startAmount`, the realized amount is calculated linearly based on the time elapsed since the order became active.                                                   | `uint256`  |
| **recipient**            | the address that will receive the consideration item upon fulfillment                                                                                                                                                                                                                                                              | `address`  |

_Struct Representation_

```sol Solidity
struct ConsiderationItem {
  enum ItemType itemType;
  address token;
  uint256 identifierOrCriteria;
  uint256 startAmount;
  uint256 endAmount;
  address payable recipient;
}
```

***

### AdvancedOrder Model <a name="advanced"></a>

| Field           | Description                                                                                                   | Type              |
| :-------------- | :------------------------------------------------------------------------------------------------------------ | :---------------- |
| **parameters**  | the order specifications                                                                                      | `OrderParameters` |
| **numerator**   | supply for partial fills                                                                                      | `uint120`         |
| **denominator** | supply for partial fills                                                                                      | `uint120`         |
| **signature**   | either standard 65-byte EDCSA, 64-byte EIP-2098                                                               | `bytes`           |
| **extraData**   | supplied as part of a call to the `validateOrder` function on the zone when fulfilling restricted order types | `bytes`           |

_Struct Representation_

```sol Solidity
struct AdvancedOrder {
  struct OrderParameters parameters;
  uint120 numerator;
  uint120 denominator;
  bytes signature;
  bytes extraData;
}
```

***

## Fulfillment <a name="fulfillment-heading"></a>

***

### Spent Item Model <a name="spent"></a>

| Field          | Description                                                                                                                                                                                                                                                                                                                        | Type       |
| :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------- |
| **itemType**   | the type of item, with valid types being Ether (or other native token for the given chain), ERC20, ERC721, ERC1155, ERC721 with "criteria" (explained below), and ERC1155 with criteria                                                                                                                                            | `ItemType` |
| **token**      | designates the address of the item's token contract (with the null address used for Ether or other native tokens)                                                                                                                                                                                                                  | `address`  |
| **identifier** | represents either the ERC721 or ERC1155 token identifier or, in the case of a criteria-based item type, a merkle root composed of the valid set of token identifiers for the item. This value will be ignored for Ether and ERC20 item types, and can optionally be zero for criteria-based item types to allow for any identifier | `uint256`  |
| **amount**     | the amount of the item in question that will be required should the order be fulfilled at the moment the order becomes active                                                                                                                                                                                                      | `uint256`  |

_Struct Representation_

```sol Solidity
struct SpentItem {
  enum ItemType itemType;
  address token;
  uint256 identifier;
  uint256 amount;
}
```

***

### Received Item Model <a name="received"></a>

| Field          | Description                                                                                                                                                                                                                                                                                                                        | Type       |
| :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------- |
| **itemType**   | the type of item, with valid types being Ether (or other native token for the given chain), ERC20, ERC721, ERC1155, ERC721 with "criteria" (explained below), and ERC1155 with criteria                                                                                                                                            | `ItemType` |
| **token**      | designates the address of the item's token contract (with the null address used for Ether or other native tokens)                                                                                                                                                                                                                  | `address`  |
| **identifier** | represents either the ERC721 or ERC1155 token identifier or, in the case of a criteria-based item type, a merkle root composed of the valid set of token identifiers for the item. This value will be ignored for Ether and ERC20 item types, and can optionally be zero for criteria-based item types to allow for any identifier | `uint256`  |
| **amount**     | the amount of the item in question that will be required should the order be fulfilled at the moment the order becomes active                                                                                                                                                                                                      | `uint256`  |

_Struct Representation_

```sol Solidity
struct ReceivedItem {
  enum ItemType itemType;
  address token;
  uint256 identifier;
  uint256 amount;
  address payable recipient;
}
```

***

### BasicOrderParameters Model <a name="basic"></a>

[block:parameters]
{
  "data": {
    "h-0": "Field",
    "h-1": "Description",
    "h-2": "Type",
    "0-0": "**considerationToken**",
    "0-1": "designates the address of the consideration item",
    "0-2": "`address`",
    "1-0": "**considerationIdentifier**",
    "1-1": "represents either the ERC721 or ERC1155 token identifier or, in the case of a criteria-based item type, a merkle root composed of the valid set of token identifiers for the item. This value will be ignored for Ether and ERC20 item types, and can optionally be zero for criteria-based item types to allow for any identifier",
    "1-2": "`uint256`",
    "2-0": "**considerationAmount**",
    "2-1": "the amount of the item in question that will be required should the order be fulfilled at the moment the order becomes active",
    "2-2": "`uint256`",
    "3-0": "**offerer**",
    "3-1": "The `offerer` of the order supplies all offered items and must either fulfill the order personally (i.e. `msg.sender == offerer`) or approve the order via signature (either standard 65-byte EDCSA, 64-byte EIP-2098, or an EIP-1271 `isValidSignature` check) or by listing the order on-chain (i.e. calling `validate`)",
    "3-2": "`uint256`",
    "4-0": "**zone**",
    "4-1": "The `zone` of the order is an optional secondary account attached to the order with two additional privileges:  \n  \n1. The zone may cancel orders where it is named as the zone by calling `cancel`. (Note that offerers can also cancel their own orders, either individually or for all orders signed with their current counter at once by calling `incrementCounter`).\n2. \"Restricted\" orders (as specified by the order type) can be executed by anyone but must be approved by the zone indicated by a call to `validateOrder` on the zone.",
    "4-2": "`address`",
    "5-0": "**offerToken**",
    "5-1": "address of the token in the orders `offer`",
    "5-2": "`address`",
    "6-0": "**offerIdentifier**",
    "6-1": "the amount of the item in question that will be required should the order be fulfilled at the moment the order becomes active",
    "6-2": "`uint256`",
    "7-0": "**basicOrderType**",
    "7-1": "the amount of the item in question that will be required should the order be fulfilled at the moment the order becomes active",
    "7-2": "`BasicOrderType`",
    "8-0": "**startTime**",
    "8-1": "the amount of the item in question that will be required should the order be fulfilled at the moment the order becomes active",
    "8-2": "`uint256`",
    "9-0": "**endTime**",
    "9-1": "the amount of the item in question that will be required should the order be fulfilled at the moment the order becomes active",
    "9-2": "`uint256`",
    "10-0": "**zoneHash**",
    "10-1": "the amount of the item in question that will be required should the order be fulfilled at the moment the order becomes active",
    "10-2": "`bytes32`",
    "11-0": "**offererConduitKey**",
    "11-1": "the amount of the item in question that will be required should the order be fulfilled at the moment the order becomes active",
    "11-2": "`bytes32`",
    "12-0": "**fulfillerConduitKey**",
    "12-1": "the amount of the item in question that will be required should the order be fulfilled at the moment the order becomes active",
    "12-2": "`bytes32`",
    "13-0": "**totalOriginalAdditionalRecipients**",
    "13-1": "the amount of the item in question that will be required should the order be fulfilled at the moment the order becomes active",
    "13-2": "`uint256`",
    "14-0": "**totalOriginalAdditionalRecipients**",
    "14-1": "total number of additional recipients",
    "14-2": "`uint256`",
    "15-0": "**additionalRecipients**",
    "15-1": "additional recipients of the conisderation items",
    "15-2": "`AdditionalRecipient[]`",
    "16-0": "**signature**",
    "16-1": "client signature",
    "16-2": "`bytes32`"
  },
  "cols": 3,
  "rows": 17,
  "align": [
    "left",
    "left",
    "left"
  ]
}
[/block]


_Struct Representation_

```solidity
struct BasicOrderParameters {
  address considerationToken;
  uint256 considerationIdentifier;
  uint256 considerationAmount;
  address payable offerer;
  address zone;
  address offerToken;
  uint256 offerIdentifier;
  uint256 offerAmount;
  enum BasicOrderType basicOrderType;
  uint256 startTime;
  uint256 endTime;
  bytes32 zoneHash;
  uint256 salt;
  bytes32 offererConduitKey;
  bytes32 fulfillerConduitKey;
  uint256 totalOriginalAdditionalRecipients;
  struct AdditionalRecipient[] additionalRecipients;
  bytes signature;
}
```

***

### AdditionalRecipient Model <a name="additional"></a>

| Field         | Description                                                           | Type      |
| :------------ | :-------------------------------------------------------------------- | :-------- |
| **amount**    | the amount of the item that will be sent to this additional recipient | `uint256` |
| **recipient** | designates the address of this additional recipient                   | `address` |

_Struct Representation_

```sol Solidity
struct AdditionalRecipient {
  uint256 amount;
  address payable recipient;
}
```

***

### OrderStatus Model <a name="status"></a>

| Field           | Description | Type      |
| :-------------- | :---------- | :-------- |
| **isValidated** | \--         | `bool`    |
| **isCancelled** | \--         | `bool`    |
| **numerator**   | \--         | `uint120` |
| **denominator** | \--         | `uint120` |

_Struct Representation_

```sol Solidity
struct OrderStatus {
  bool isValidated;
  bool isCancelled;
  uint120 numerator;
  uint120 denominator;
}
```

***

### CriteriaResolver Model <a name="resolver"></a>

| Field             | Description | Type        |
| :---------------- | :---------- | :---------- |
| **orderIndex**    | \--         | `uint256`   |
| **side**          | \--         | `Side`      |
| **index**         | \--         | `uint256`   |
| **identifier**    | \--         | `uint256`   |
| **criteriaProof** | \--         | `bytes32[]` |

_Struct Representation_

```sol Solidity
struct CriteriaResolver {
  uint256 orderIndex;
  enum Side side;
  uint256 index;
  uint256 identifier;
  bytes32[] criteriaProof;
}
```

***

### Fulfillment Model <a name="fulfillment"></a>

| Field         | Description                                                           | Type      |
| :------------ | :-------------------------------------------------------------------- | :-------- |
| **amount**    | the amount of the item that will be sent to this additional recipient | `uint256` |
| **recipient** | designates the address of this additional recipient                   | `address` |

_Struct Representation_

```sol Solidity
struct Fulfillment {
  struct FulfillmentComponent[] offerComponents;
  struct FulfillmentComponent[] considerationComponents;
}
```

***

### FulfillmentComponent Model<a name="component"></a>

| Field         | Description                                                           | Type      |
| :------------ | :-------------------------------------------------------------------- | :-------- |
| **amount**    | the amount of the item that will be sent to this additional recipient | `uint256` |
| **recipient** | designates the address of this additional recipient                   | `address` |

_Struct Representation_

```sol Solidity
struct FulfillmentComponent {
  uint256 orderIndex;
  uint256 itemIndex;
}
```

***

### Execution Model <a name="component"></a>

| Field         | Description                                                           | Type      |
| :------------ | :-------------------------------------------------------------------- | :-------- |
| **amount**    | the amount of the item that will be sent to this additional recipient | `uint256` |
| **recipient** | designates the address of this additional recipient                   | `address` |

_Struct Representation_

```sol Solidity
struct Execution {
  struct ReceivedItem item;
  address offerer;
  bytes32 conduitKey;
}
```

***

### ZoneParameters Model<a name="zone"></a>

```sol Solidity
struct ZoneParameters {
    bytes32 orderHash;
    address fulfiller;
    address offerer;
    SpentItem[] offer;
    ReceivedItem[] consideration;
    bytes extraData;
    bytes32[] orderHashes;
    uint256 startTime;
    uint256 endTime;
    bytes32 zoneHash;
}
```



### fulfillBasicOrder <a name="fulfill-basic"></a>

Fulfill an order that offers ether (the native token for the given chain) or ERC20 to ERC721/ERC1155 or ERC721/ERC1155 to ERC20. An arbitrary number of "additional recipients" may also be         supplied which will each receive native tokens from the fulfiller  as consideration.

```solidity
function fulfillBasicOrder(struct BasicOrderParameters parameters) 
  external payable returns (bool fulfilled)
```

| Name           | Type                   | Description                                                                                                                                                                                                                                                                        |
| -------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **parameters** | `BasicOrderParameters` | Additional information on the fulfilled order. Note                   that the offerer must first approve this contract (or                   their preferred conduit if indicated by the order) for                   their offered ERC20/ERC721/ERC1155 token to be transferred. |

| Name          | Type   | Description                                                             |
| ------------- | ------ | ----------------------------------------------------------------------- |
| **fulfilled** | `bool` | A boolean indicating whether the order has been successfully fulfilled. |

***

### fulfillOrder <a name="fulfill"></a>

Fulfill an order with an arbitrary number of items for offer and         consideration. Note that this function does not support         criteria-based orders or partial filling of orders (though         filling the remainder of a partially-filled order is supported).

```sol Solidity
function fulfillOrder(struct Order order, bytes32 fulfillerConduitKey) 
  external payable returns (bool fulfilled)
```

| Name                    | Type      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **order**               | `Order`   | The order to fulfill. Note that both the                            offerer and the fulfiller must first approve                            this contract (or the corresponding conduit if                            indicated) to transfer any relevant tokens on                            their behalf and that contracts must implement                            `onERC1155Received` to receive ERC1155 tokens                            as consideration. |
| **fulfillerConduitKey** | `bytes32` | A bytes32 value indicating what conduit, if                            any, to source the fulfiller's token approvals                            from. The zero hash signifies that no conduit                            should be used, with direct approvals set on                            Seaport.                                                                                                                                                          |

| Name          | Type   | Description                                                                               |
| ------------- | ------ | ----------------------------------------------------------------------------------------- |
| **fulfilled** | `bool` | A boolean indicating whether the order has been                   successfully fulfilled. |

***

### fulfillAdvancedOrder <a name="fulfill-advanced"></a>

Fill an order, fully or partially, with an arbitrary number of         items for offer and consideration alongside criteria resolvers         containing specific token identifiers and associated proofs.

```sol Solidity
function fulfillAdvancedOrder(
  struct AdvancedOrder advancedOrder, 
  struct CriteriaResolver[] criteriaResolvers, 
  bytes32 fulfillerConduitKey, 
  address recipient) 
external payable returns (bool fulfilled)
```

| Name                    | Type                 | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **advancedOrder**       | `AdvancedOrder`      | The order to fulfill along with the fraction                            of the order to attempt to fill. Note that                            both the offerer and the fulfiller must first                            approve this contract (or their preferred                            conduit if indicated by the order) to transfer                            any relevant tokens on their behalf and that                            contracts must implement `onERC1155Received`                            to receive ERC1155 tokens as consideration.                            Also note that all offer and consideration                            components must have no remainder after                            multiplication of the respective amount with                            the supplied fraction for the partial fill to                            be considered valid. |
| **criteriaResolvers**   | `CriteriaResolver[]` | An array where each element contains a                            reference to a specific offer or                            consideration, a token identifier, and a proof                            that the supplied token identifier is                            contained in the merkle root held by the item                            in question's criteria element. Note that an                            empty criteria indicates that any                            (transferable) token identifier on the token                            in question is valid and that no associated                            proof needs to be supplied.                                                                                                                                                                                                                                           |
| **fulfillerConduitKey** | `bytes32`            | A bytes32 value indicating what conduit, if                            any, to source the fulfiller's token approvals                            from. The zero hash signifies that no conduit                            should be used, with direct approvals set on                            Seaport.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **recipient**           | `address`            | The intended recipient for all received items,                            with `address(0)` indicating that the caller                            should receive the items.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

| Name          | Type   | Description                                                                               |
| ------------- | ------ | ----------------------------------------------------------------------------------------- |
| **fulfilled** | `bool` | A boolean indicating whether the order has been                   successfully fulfilled. |

***

### fulfillAvailableOrders <a name="fulfill-available"></a>

Attempt to fill a group of orders, each with an arbitrary number         of items for offer and consideration. Any order that is not         currently active, has already been fully filled, or has been         cancelled will be omitted. Remaining offer and consideration         items will then be aggregated where possible as indicated by the         supplied offer and consideration component arrays and aggregated         items will be transferred to the fulfiller or to each intended         recipient, respectively. Note that a failing item transfer or an         issue with order formatting will cause the entire batch to fail.         Note that this function does not support criteria-based orders or         partial filling of orders (though filling the remainder of a         partially-filled order is supported).

```sol Solidity
function fulfillAvailableOrders(struct Order[] orders, struct FulfillmentComponent[][] offerFulfillments, struct FulfillmentComponent[][] considerationFulfillments, bytes32 fulfillerConduitKey, uint256 maximumFulfilled) external payable returns (bool[] availableOrders, struct Execution[] executions)
```

| Name                          | Type                              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **orders**                    | `Order[]`                         | The orders to fulfill. Note that both                                  the offerer and the fulfiller must first                                  approve this contract (or the                                  corresponding conduit if indicated) to                                  transfer any relevant tokens on their                                  behalf and that contracts must implement                                  `onERC1155Received` to receive ERC1155                                  tokens as consideration. |
| **offerFulfillments**         | `FulfillmentComponent[][]`        | An array of FulfillmentComponent arrays                                  indicating which offer items to attempt                                  to aggregate when preparing executions.                                                                                                                                                                                                                                                                                                                                                 |
| **considerationFulfillments** | `struct FulfillmentComponent[][]` | An array of FulfillmentComponent arrays                                  indicating which consideration items to                                  attempt to aggregate when preparing                                  executions.                                                                                                                                                                                                                                                                                                        |
| **fulfillerConduitKey**       | `bytes32`                         | A bytes32 value indicating what conduit,                                  if any, to source the fulfiller's token                                  approvals from. The zero hash signifies                                  that no conduit should be used, with                                  direct approvals set on this contract.                                                                                                                                                                                                  |
| **maximumFulfilled**          | `uint256`                         | The maximum number of orders to fulfill.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

| Name                | Type          | Description                                                                                                                                                                            |
| ------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **availableOrders** | `bool[]`      | An array of booleans indicating if each order                         with an index corresponding to the index of the                         returned boolean was fulfillable or not. |
| **executions**      | `Execution[]` | An array of elements indicating the sequence of                         transfers performed as part of matching the given                         orders.                              |

***

### fulfillAvailableAdvancedOrders <a name="fulfill-available-advanced"></a>

Attempt to fill a group of orders, fully or partially, with an         arbitrary number of items for offer and consideration per order         alongside criteria resolvers containing specific token         identifiers and associated proofs. Any order that is not         currently active, has already been fully filled, or has been         cancelled will be omitted. Remaining offer and consideration         items will then be aggregated where possible as indicated by the         supplied offer and consideration component arrays and aggregated         items will be transferred to the fulfiller or to each intended         recipient, respectively. Note that a failing item transfer or an         issue with order formatting will cause the entire batch to fail.

```sol Solidity
function fulfillAvailableAdvancedOrders(
  struct AdvancedOrder[] advancedOrders, 
  struct CriteriaResolver[] criteriaResolvers, 
  struct FulfillmentComponent[][] offerFulfillments, 
  struct FulfillmentComponent[][] considerationFulfillments, 
  bytes32 fulfillerConduitKey, 
  address recipient, 
  uint256 maximumFulfilled) 
  external payable returns (bool[] availableOrders, struct Execution[] executions)
```

| Name                          | Type                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **advancedOrders**            | `AdvancedOrder[]`          | The orders to fulfill along with the                                  fraction of those orders to attempt to                                  fill. Note that both the offerer and the                                  fulfiller must first approve this                                  contract (or their preferred conduit if                                  indicated by the order) to transfer any                                  relevant tokens on their behalf and that                                  contracts must implement                                  `onERC1155Received` to enable receipt of                                  ERC1155 tokens as consideration. Also                                  note that all offer and consideration                                  components must have no remainder after                                  multiplication of the respective amount                                  with the supplied fraction for an                                  order's partial fill amount to be                                  considered valid. |
| **criteriaResolvers**         | `CriteriaResolver[]`       | An array where each element contains a                                  reference to a specific offer or                                  consideration, a token identifier, and a                                  proof that the supplied token identifier                                  is contained in the merkle root held by                                  the item in question's criteria element.                                  Note that an empty criteria indicates                                  that any (transferable) token                                  identifier on the token in question is                                  valid and that no associated proof needs                                  to be supplied.                                                                                                                                                                                                                                                                                                                                                           |
| **offerFulfillments**         | `FulfillmentComponent[][]` | An array of FulfillmentComponent arrays                                  indicating which offer items to attempt                                  to aggregate when preparing executions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **considerationFulfillments** | `FulfillmentComponent[][]` | An array of FulfillmentComponent arrays                                  indicating which consideration items to                                  attempt to aggregate when preparing                                  executions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **fulfillerConduitKey**       | `bytes32`                  | A bytes32 value indicating what conduit,                                  if any, to source the fulfiller's token                                  approvals from. The zero hash signifies                                  that no conduit should be used, with                                  direct approvals set on this contract.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **recipient**                 | `address`                  | The intended recipient for all received                                  items, with `address(0)` indicating that                                  the caller should receive the items.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **maximumFulfilled**          | `uint256`                  | The maximum number of orders to fulfill.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

| Name                | Type          | Description                                                                                                                                                                            |
| ------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **availableOrders** | `bool[]`      | An array of booleans indicating if each order                         with an index corresponding to the index of the                         returned boolean was fulfillable or not. |
| **executions**      | `Execution[]` | An array of elements indicating the sequence of                         transfers performed as part of matching the given                         orders.                              |

***

### matchOrders <a name="match"></a>

Match an arbitrary number of orders, each with an arbitrary         number of items for offer and consideration along with a set of         fulfillments allocating offer components to consideration         components. Note that this function does not support         criteria-based or partial filling of orders (though filling the         remainder of a partially-filled order is supported).

```sol Solidity
function matchOrders(
  struct Order[] orders, 
  struct Fulfillment[] fulfillments) 
 external payable returns (struct Execution[] executions)
```

| Name             | Type            | Description                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **orders**       | `Order[]`       | The orders to match. Note that both the offerer and                     fulfiller on each order must first approve this                     contract (or their conduit if indicated by the order)                     to transfer any relevant tokens on their behalf and                     each consideration recipient must implement                     `onERC1155Received` to enable ERC1155 token receipt. |
| **fulfillments** | `Fulfillment[]` | An array of elements allocating offer components to                     consideration components. Note that each                     consideration component must be fully met for the                     match operation to be valid.                                                                                                                                                                            |

| Name           | Type          | Description                                                                                                                                     |
| -------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **executions** | `Execution[]` | An array of elements indicating the sequence of                    transfers performed as part of matching the given                    orders. |

***

### matchAdvancedOrders <a name="match-advanced"></a>

Match an arbitrary number of full or partial orders, each with an         arbitrary number of items for offer and consideration, supplying         criteria resolvers containing specific token identifiers and         associated proofs as well as fulfillments allocating offer         components to consideration components.

```sol Solidity
function matchAdvancedOrders(
  struct AdvancedOrder[] orders, 
  struct CriteriaResolver[] criteriaResolvers, 
  struct Fulfillment[] fulfillments, 
  address recipient) 
 external payable returns (struct Execution[] executions)
```

| Name                  | Type                 | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **orders**            | `AdvancedOrder[]`    | The advanced orders to match. Note that both the                          offerer and fulfiller on each order must first                          approve this contract (or a preferred conduit if                          indicated by the order) to transfer any relevant                          tokens on their behalf and each consideration                          recipient must implement `onERC1155Received` in                          order to receive ERC1155 tokens. Also note that                          the offer and consideration components for each                          order must have no remainder after multiplying                          the respective amount with the supplied fraction                          in order for the group of partial fills to be                          considered valid. |
| **criteriaResolvers** | `CriteriaResolver[]` | An array where each element contains a reference                          to a specific order as well as that order's                          offer or consideration, a token identifier, and                          a proof that the supplied token identifier is                          contained in the order's merkle root. Note that                          an empty root indicates that any (transferable)                          token identifier is valid and that no associated                          proof needs to be supplied.                                                                                                                                                                                                                                                                                             |
| **fulfillments**      | `Fulfillment[]`      | An array of elements allocating offer components                          to consideration components. Note that each                          consideration component must be fully met in                          order for the match operation to be valid.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **recipient**         | `address`            | The intended recipient for all unspent offer item amounts, or the caller if the null addressis supplied.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

| Name           | Type          | Description                                                                                                                                     |
| -------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **executions** | `Execution[]` | An array of elements indicating the sequence of                    transfers performed as part of matching the given                    orders. |

### cancel <a name="cancel"></a>

Cancel an arbitrary number of orders. Note that only the offerer         or the zone of a given order may cancel it. Callers should ensure         that the intended order was cancelled by calling `getOrderStatus`         and confirming that `isCancelled` returns `true`.

```sol Solidity
function cancel(struct OrderComponents[] orders) external returns (bool cancelled)
```

| Name       | Type              | Description           |
| ---------- | ----------------- | --------------------- |
| **orders** | `OrderComponents` | The orders to cancel. |

| Name          | Type   | Description                                                                                          |
| ------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| **cancelled** | `bool` | A boolean indicating whether the supplied orders have                   been successfully cancelled. |

***

### validate <a name="validate"></a>

Validate an arbitrary number of orders, thereby registering their         signatures as valid and allowing the fulfiller to skip signature         verification on fulfillment. Note that validated orders may still         be unfulfillable due to invalid item amounts or other factors;         callers should determine whether validated orders are fulfillable         by simulating the fulfillment call prior to execution. Also note         that anyone can validate a signed order, but only the offerer can         validate an order without supplying a signature.

```sol Solidity
function validate(struct Order[] orders) external returns (bool validated)
```

| Name       | Type      | Description             |
| ---------- | --------- | ----------------------- |
| **orders** | `Order[]` | The orders to validate. |

| Name          | Type   | Description                                                                                          |
| ------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| **validated** | `bool` | A boolean indicating whether the supplied orders have                   been successfully validated. |

***

### incrementCounter <a name="increment"></a>

Cancel all orders from a given offerer with a given zone in bulk         by incrementing a counter. Note that only the offerer may         increment the counter.

```sol Solidity
function incrementCounter() external returns (uint256 newCounter)
```

| Name           | Type      | Description      |
| -------------- | --------- | ---------------- |
| **newCounter** | `uint256` | The new counter. |

***

### getOrderHash <a name="order-hash"></a>

Retrieve the order hash for a given order.

```sol Solidity
function getOrderHash(struct OrderComponents order) external view returns (bytes32 orderHash)
```

| Name      | Type              | Description                  |
| --------- | ----------------- | ---------------------------- |
| **order** | `OrderComponents` | The components of the order. |

| Name          | Type    | Description     |
| ------------- | ------- | --------------- |
| **orderHash** | bytes32 | The order hash. |

***

### getOrderStatus <a name="order-status"></a>

Retrieve the status of a given order by hash, including whether         the order has been cancelled or validated and the fraction of the         order that has been filled.

```sol Solidity
function getOrderStatus(bytes32 orderHash) external view returns (bool isValidated, bool isCancelled, uint256 totalFilled, uint256 totalSize)
```

| Name          | Type      | Description                 |
| ------------- | --------- | --------------------------- |
| **orderHash** | `bytes32` | The order hash in question. |

| Name            | Type      | Description                                                                                                                                                   |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **isValidated** | `bool`    | A boolean indicating whether the order in question                     has been validated (i.e. previously approved or                     partially filled). |
| **isCancelled** | `bool`    | A boolean indicating whether the order in question                     has been cancelled.                                                                    |
| **totalFilled** | `uint256` | The total portion of the order that has been filled                     (i.e. the "numerator").                                                               |
| **totalSize**   | `uint256` | The total size of the order that is either filled or                     unfilled (i.e. the "denominator").                                                   |

***

### getCounter <a name="counter"></a>

Retrieve the current counter for a given offerer.

```sol Solidity
function getCounter(address offerer) external view returns (uint256 counter)
```

| Name        | Type      | Description              |
| ----------- | --------- | ------------------------ |
| **offerer** | `address` | The offerer in question. |

| Name        | Type      | Description          |
| ----------- | --------- | -------------------- |
| **counter** | `uint256` | The current counter. |

***

### information <a name="information"></a>

Retrieve configuration information for this contract.

```sol Solidity
function information() external view returns (string version, bytes32 domainSeparator, address conduitController)
```

| Name                  | Type      | Description                                   |
| --------------------- | --------- | --------------------------------------------- |
| **version**           | `string`  | The contract version.                         |
| **domainSeparator**   | `bytes32` | The domain separator for this contract.       |
| **conduitController** | `address` | The conduit Controller set for this contract. |

***

### name <a name="name"></a>

```sol Solidity
function name() external view returns (string contractName)
```

Retrieve the name of this contract.

| Name             | Type     | Description                |
| ---------------- | -------- | -------------------------- |
| **contractName** | `string` | The name of this contract. |




## OrderType

```sol Solidity
enum OrderType {
  FULL_OPEN,
  PARTIAL_OPEN,
  FULL_RESTRICTED,
  PARTIAL_RESTRICTED,
  CONTRACT
}
```

## BasicOrderType

```sol Solidity
enum BasicOrderType {
  ETH_TO_ERC721_FULL_OPEN,
  ETH_TO_ERC721_PARTIAL_OPEN,
  ETH_TO_ERC721_FULL_RESTRICTED,
  ETH_TO_ERC721_PARTIAL_RESTRICTED,
  ETH_TO_ERC1155_FULL_OPEN,
  ETH_TO_ERC1155_PARTIAL_OPEN,
  ETH_TO_ERC1155_FULL_RESTRICTED,
  ETH_TO_ERC1155_PARTIAL_RESTRICTED,
  ERC20_TO_ERC721_FULL_OPEN,
  ERC20_TO_ERC721_PARTIAL_OPEN,
  ERC20_TO_ERC721_FULL_RESTRICTED,
  ERC20_TO_ERC721_PARTIAL_RESTRICTED,
  ERC20_TO_ERC1155_FULL_OPEN,
  ERC20_TO_ERC1155_PARTIAL_OPEN,
  ERC20_TO_ERC1155_FULL_RESTRICTED,
  ERC20_TO_ERC1155_PARTIAL_RESTRICTED,
  ERC721_TO_ERC20_FULL_OPEN,
  ERC721_TO_ERC20_PARTIAL_OPEN,
  ERC721_TO_ERC20_FULL_RESTRICTED,
  ERC721_TO_ERC20_PARTIAL_RESTRICTED,
  ERC1155_TO_ERC20_FULL_OPEN,
  ERC1155_TO_ERC20_PARTIAL_OPEN,
  ERC1155_TO_ERC20_FULL_RESTRICTED,
  ERC1155_TO_ERC20_PARTIAL_RESTRICTED
}
```

## BasicOrderRouteType

```sol Solidity
enum BasicOrderRouteType {
  ETH_TO_ERC721,
  ETH_TO_ERC1155,
  ERC20_TO_ERC721,
  ERC20_TO_ERC1155,
  ERC721_TO_ERC20,
  ERC1155_TO_ERC20
}
```

## ItemType

```sol Solidity
enum ItemType {
  NATIVE,
  ERC20,
  ERC721,
  ERC1155,
  ERC721_WITH_CRITERIA,
  ERC1155_WITH_CRITERIA
}
```

## Side

```sol Solidity
enum Side {
  OFFER,
  CONSIDERATION
}
```



### OrderFulfilled

```sol Solidity
event OrderFulfilled(bytes32 orderHash, address offerer, address zone, address recipient, struct SpentItem[] offer, struct ReceivedItem[] consideration)
```

_Emit an event whenever an order is successfully fulfilled._

| Name          | Type                   | Description                                                                                                                                                                                                                                                                                                                      |
| ------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| orderHash     | bytes32                | The hash of the fulfilled order.                                                                                                                                                                                                                                                                                                 |
| offerer       | address                | The offerer of the fulfilled order.                                                                                                                                                                                                                                                                                              |
| zone          | address                | The zone of the fulfilled order.                                                                                                                                                                                                                                                                                                 |
| recipient     | address                | The recipient of each spent item on the fulfilled                      order, or the null address if there is no specific                      fulfiller (i.e. the order is part of a group of                      orders). Defaults to the caller unless explicitly                      specified otherwise by the fulfiller. |
| offer         | struct SpentItem\[]    | The offer items spent as part of the order.                                                                                                                                                                                                                                                                                      |
| consideration | struct ReceivedItem\[] | The consideration items received as part of the                      order along with the recipients of each item.                                                                                                                                                                                                               |

### OrderCancelled

```sol Solidity
event OrderCancelled(bytes32 orderHash, address offerer, address zone)
```

_Emit an event whenever an order is successfully cancelled._

| Name      | Type    | Description                         |
| --------- | ------- | ----------------------------------- |
| orderHash | bytes32 | The hash of the cancelled order.    |
| offerer   | address | The offerer of the cancelled order. |
| zone      | address | The zone of the cancelled order.    |

### OrderValidated

```sol Solidity
event OrderValidated(bytes32 orderHash, address offerer, address zone)
```

_Emit an event whenever an order is explicitly validated. Note that      this event will not be emitted on partial fills even though they do      validate the order as part of partial fulfillment._

| Name      | Type    | Description                         |
| --------- | ------- | ----------------------------------- |
| orderHash | bytes32 | The hash of the validated order.    |
| offerer   | address | The offerer of the validated order. |
| zone      | address | The zone of the validated order.    |

### CounterIncremented

```sol Solidity
event CounterIncremented(uint256 newCounter, address offerer)
```

_Emit an event whenever a counter for a given offerer is incremented._

| Name       | Type    | Description                      |
| ---------- | ------- | -------------------------------- |
| newCounter | uint256 | The new counter for the offerer. |
| offerer    | address | The offerer in question.         |

### OrdersMatched

```sol Solidity
event OrdersMatched(bytes32[] orderHashes)
```

_Emit an event whenever one or more orders are matched using either matchOrders or matchAdvancedOrders._

| Name        | Type       | Description                             |
| ----------- | ---------- | --------------------------------------- |
| orderHashes | bytes32\[] | The order hashes of the matched orders. |

### OrderAlreadyFilled

```sol Solidity
error OrderAlreadyFilled(bytes32 orderHash)
```

_Revert with an error when attempting to fill an order that has      already been fully filled._

| Name      | Type    | Description                                   |
| --------- | ------- | --------------------------------------------- |
| orderHash | bytes32 | The order hash on which a fill was attempted. |

### InvalidTime

```sol Solidity
error InvalidTime()
```

_Revert with an error when attempting to fill an order outside the      specified start time and end time._

### InvalidConduit

```sol Solidity
error InvalidConduit(bytes32 conduitKey, address conduit)
```

_Revert with an error when attempting to fill an order referencing an      invalid conduit (i.e. one that has not been deployed)._

### MissingOriginalConsiderationItems

```sol Solidity
error MissingOriginalConsiderationItems()
```

_Revert with an error when an order is supplied for fulfillment with      a consideration array that is shorter than the original array._

### InvalidCallToConduit

```sol Solidity
error InvalidCallToConduit(address conduit)
```

_Revert with an error when a call to a conduit fails with revert data      that is too expensive to return._

### ConsiderationNotMet

```sol Solidity
error ConsiderationNotMet(uint256 orderIndex, uint256 considerationIndex, uint256 shortfallAmount)
```

_Revert with an error if a consideration amount has not been fully      zeroed out after applying all fulfillments._

| Name               | Type    | Description                                                                                    |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------- |
| orderIndex         | uint256 | The index of the order with the consideration                           item with a shortfall. |
| considerationIndex | uint256 | The index of the consideration item on the                           order.                    |
| shortfallAmount    | uint256 | The unfulfilled consideration amount.                                                          |

### InsufficientEtherSupplied

```sol Solidity
error InsufficientEtherSupplied()
```

_Revert with an error when insufficient ether is supplied as part of      msg.value when fulfilling orders._

### EtherTransferGenericFailure

```sol Solidity
error EtherTransferGenericFailure(address account, uint256 amount)
```

_Revert with an error when an ether transfer reverts._

### PartialFillsNotEnabledForOrder

```sol Solidity
error PartialFillsNotEnabledForOrder()
```

_Revert with an error when a partial fill is attempted on an order      that does not specify partial fill support in its order type._

### OrderIsCancelled

```sol Solidity
error OrderIsCancelled(bytes32 orderHash)
```

_Revert with an error when attempting to fill an order that has been      cancelled._

| Name      | Type    | Description                      |
| --------- | ------- | -------------------------------- |
| orderHash | bytes32 | The hash of the cancelled order. |

### OrderPartiallyFilled

```sol Solidity
error OrderPartiallyFilled(bytes32 orderHash)
```

_Revert with an error when attempting to fill a basic order that has      been partially filled._

| Name      | Type    | Description                           |
| --------- | ------- | ------------------------------------- |
| orderHash | bytes32 | The hash of the partially used order. |

### InvalidCanceller

```sol Solidity
error InvalidCanceller()
```

_Revert with an error when attempting to cancel an order as a caller      other than the indicated offerer or zone._

### BadFraction

```sol Solidity
error BadFraction()
```

_Revert with an error when supplying a fraction with a value of zero      for the numerator or denominator, or one where the numerator exceeds      the denominator._

### InvalidMsgValue

```sol Solidity
error InvalidMsgValue(uint256 value)
```

_Revert with an error when a caller attempts to supply callvalue to a      non-payable basic order route or does not supply any callvalue to a      payable basic order route._

### InvalidBasicOrderParameterEncoding

```sol Solidity
error InvalidBasicOrderParameterEncoding()
```

_Revert with an error when attempting to fill a basic order using      calldata not produced by default ABI encoding._

### NoSpecifiedOrdersAvailable

```sol Solidity
error NoSpecifiedOrdersAvailable()
```

_Revert with an error when attempting to fulfill any number of      available orders when none are fulfillable._

### InvalidNativeOfferItem

```sol Solidity
error InvalidNativeOfferItem()
```

_Revert with an error when attempting to fulfill an order with an      offer for ETH outside of matching orders._



ConduitController enables deploying and managing new conduits, or         contracts that allow registered callers (or open "channels") to         transfer approved ERC20/721/1155 tokens on their behalf.

### \_conduits

```sol Solidity
mapping(address => struct ConduitControllerInterface.ConduitProperties) _conduits
```

### \_CONDUIT_CREATION_CODE_HASH

```sol Solidity
bytes32 _CONDUIT_CREATION_CODE_HASH
```

### \_CONDUIT_RUNTIME_CODE_HASH

```sol Solidity
bytes32 _CONDUIT_RUNTIME_CODE_HASH
```

### constructor

```sol Solidity
constructor() public
```

_Initialize contract by deploying a conduit and setting the creation      code and runtime code hashes as immutable arguments._

### createConduit

```sol Solidity
function createConduit(bytes32 conduitKey, address initialOwner) external returns (address conduit)
```

Deploy a new conduit using a supplied conduit key and assigning         an initial owner for the deployed conduit. Note that the first         twenty bytes of the supplied conduit key must match the caller         and that a new conduit cannot be created if one has already been         deployed using the same conduit key.

| Name         | Type    | Description                                                                                                                                                                     |
| ------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| conduitKey   | bytes32 | The conduit key used to deploy the conduit. Note that                     the first twenty bytes of the conduit key must match                     the caller of this contract. |
| initialOwner | address | The initial owner to set for the new conduit.                                                                                                                                   |

| Name    | Type    | Description                                |
| ------- | ------- | ------------------------------------------ |
| conduit | address | The address of the newly deployed conduit. |

### updateChannel

```sol Solidity
function updateChannel(address conduit, address channel, bool isOpen) external
```

Open or close a channel on a given conduit, thereby allowing the         specified account to execute transfers against that conduit.         Extreme care must be taken when updating channels, as malicious         or vulnerable channels can transfer any ERC20, ERC721 and ERC1155         tokens where the token holder has granted the conduit approval.         Only the owner of the conduit in question may call this function.

| Name    | Type    | Description                                                |
| ------- | ------- | ---------------------------------------------------------- |
| conduit | address | The conduit for which to open or close the channel.        |
| channel | address | The channel to open or close on the conduit.               |
| isOpen  | bool    | A boolean indicating whether to open or close the channel. |

### transferOwnership

```sol Solidity
function transferOwnership(address conduit, address newPotentialOwner) external
```

Initiate conduit ownership transfer by assigning a new potential         owner for the given conduit. Once set, the new potential owner         may call `acceptOwnership` to claim ownership of the conduit.         Only the owner of the conduit in question may call this function.

| Name              | Type    | Description                                           |
| ----------------- | ------- | ----------------------------------------------------- |
| conduit           | address | The conduit for which to initiate ownership transfer. |
| newPotentialOwner | address | The new potential owner of the conduit.               |

### cancelOwnershipTransfer

```sol Solidity
function cancelOwnershipTransfer(address conduit) external
```

Clear the currently set potential owner, if any, from a conduit.         Only the owner of the conduit in question may call this function.

| Name    | Type    | Description                                         |
| ------- | ------- | --------------------------------------------------- |
| conduit | address | The conduit for which to cancel ownership transfer. |

### acceptOwnership

```sol Solidity
function acceptOwnership(address conduit) external
```

Accept ownership of a supplied conduit. Only accounts that the         current owner has set as the new potential owner may call this         function.

| Name    | Type    | Description                                |
| ------- | ------- | ------------------------------------------ |
| conduit | address | The conduit for which to accept ownership. |

### ownerOf

```sol Solidity
function ownerOf(address conduit) external view returns (address owner)
```

Retrieve the current owner of a deployed conduit.

| Name    | Type    | Description                                             |
| ------- | ------- | ------------------------------------------------------- |
| conduit | address | The conduit for which to retrieve the associated owner. |

| Name  | Type    | Description                        |
| ----- | ------- | ---------------------------------- |
| owner | address | The owner of the supplied conduit. |

### getKey

```sol Solidity
function getKey(address conduit) external view returns (bytes32 conduitKey)
```

Retrieve the conduit key for a deployed conduit via reverse         lookup.

| Name    | Type    | Description                                                                  |
| ------- | ------- | ---------------------------------------------------------------------------- |
| conduit | address | The conduit for which to retrieve the associated conduit                key. |

| Name       | Type    | Description                                          |
| ---------- | ------- | ---------------------------------------------------- |
| conduitKey | bytes32 | The conduit key used to deploy the supplied conduit. |

### getConduit

```sol Solidity
function getConduit(bytes32 conduitKey) external view returns (address conduit, bool exists)
```

Derive the conduit associated with a given conduit key and         determine whether that conduit exists (i.e. whether it has been         deployed).

| Name       | Type    | Description                                 |
| ---------- | ------- | ------------------------------------------- |
| conduitKey | bytes32 | The conduit key used to derive the conduit. |

| Name    | Type    | Description                                                                                |
| ------- | ------- | ------------------------------------------------------------------------------------------ |
| conduit | address | The derived address of the conduit.                                                        |
| exists  | bool    | A boolean indicating whether the derived conduit has been                 deployed or not. |

### getPotentialOwner

```sol Solidity
function getPotentialOwner(address conduit) external view returns (address potentialOwner)
```

Retrieve the potential owner, if any, for a given conduit. The         current owner may set a new potential owner via         `transferOwnership` and that owner may then accept ownership of         the conduit in question via `acceptOwnership`.

| Name    | Type    | Description                                            |
| ------- | ------- | ------------------------------------------------------ |
| conduit | address | The conduit for which to retrieve the potential owner. |

| Name           | Type    | Description                                   |
| -------------- | ------- | --------------------------------------------- |
| potentialOwner | address | The potential owner, if any, for the conduit. |

### getChannelStatus

```sol Solidity
function getChannelStatus(address conduit, address channel) external view returns (bool isOpen)
```

Retrieve the status (either open or closed) of a given channel on         a conduit.

| Name    | Type    | Description                                           |
| ------- | ------- | ----------------------------------------------------- |
| conduit | address | The conduit for which to retrieve the channel status. |
| channel | address | The channel for which to retrieve the status.         |

| Name   | Type | Description                                     |
| ------ | ---- | ----------------------------------------------- |
| isOpen | bool | The status of the channel on the given conduit. |

### getTotalChannels

```sol Solidity
function getTotalChannels(address conduit) external view returns (uint256 totalChannels)
```

Retrieve the total number of open channels for a given conduit.

| Name    | Type    | Description                                                |
| ------- | ------- | ---------------------------------------------------------- |
| conduit | address | The conduit for which to retrieve the total channel count. |

| Name          | Type    | Description                                        |
| ------------- | ------- | -------------------------------------------------- |
| totalChannels | uint256 | The total number of open channels for the conduit. |

### getChannel

```sol Solidity
function getChannel(address conduit, uint256 channelIndex) external view returns (address channel)
```

Retrieve an open channel at a specific index for a given conduit.         Note that the index of a channel can change as a result of other         channels being closed on the conduit.

| Name         | Type    | Description                                         |
| ------------ | ------- | --------------------------------------------------- |
| conduit      | address | The conduit for which to retrieve the open channel. |
| channelIndex | uint256 | The index of the channel in question.               |

| Name    | Type    | Description                                               |
| ------- | ------- | --------------------------------------------------------- |
| channel | address | The open channel, if any, at the specified channel index. |

### getChannels

```sol Solidity
function getChannels(address conduit) external view returns (address[] channels)
```

Retrieve all open channels for a given conduit. Note that calling         this function for a conduit with many channels will revert with         an out-of-gas error.

| Name    | Type    | Description                                      |
| ------- | ------- | ------------------------------------------------ |
| conduit | address | The conduit for which to retrieve open channels. |

| Name     | Type       | Description                                     |
| -------- | ---------- | ----------------------------------------------- |
| channels | address\[] | An array of open channels on the given conduit. |

### getConduitCodeHashes

```sol Solidity
function getConduitCodeHashes() external view returns (bytes32 creationCodeHash, bytes32 runtimeCodeHash)
```

_Retrieve the conduit creation code and runtime code hashes._

### \_assertCallerIsConduitOwner

```sol Solidity
function _assertCallerIsConduitOwner(address conduit) private view
```

_Private view function to revert if the caller is not the owner of a      given conduit._

| Name    | Type    | Description                                |
| ------- | ------- | ------------------------------------------ |
| conduit | address | The conduit for which to assert ownership. |

### \_assertConduitExists

```sol Solidity
function _assertConduitExists(address conduit) private view
```

_Private view function to revert if a given conduit does not exist._

| Name    | Type    | Description                                |
| ------- | ------- | ------------------------------------------ |
| conduit | address | The conduit for which to assert existence. |




Introduced in Seaport 1.6, **Seaport Hooks** are a powerful set of primitives that can be used to extend the native functionality of the protocol by allowing developer-defined, stateful contracts to "react" to Seaport order fulfillments.  Those smart contracts can be NFTs involved in the fulfillment, but can also be external protocols.

**Seaport Hooks** can be used to build a variety of novel experiences that expand the utility and liquidity of NFTs.  Hooks are still an emergent and experimental feature, but, if you are working on Seaport Hooks and have an idea you're excited about having integrated into the OpenSea application, please reach out to [hooks@opensea.io](mailto:hooks@opensea.io).

***

There are three key flavors of hooks: **zone hooks**, **contract hooks**, and **item hooks**.  All three modalities are called by Seaport during the order fulfillment process, but they are each called at different times in the order flow and with different information supplied.

## Zone Hooks

Zone hooks are a mechanic for extending the native functionality of a Seaport order. By using a restricted order and specifying a zone, the order will call out to that zone both before and after transferring tokens, delegating control flow to the zone. In particular, zone hooks are an efficient way for collection owners to enforce how their tokens are bought and sold on Seaport.

### authorizeOrder & validateOrder

When processing restricted orders (`OrderType` with `FULL_RESTRICTED` or `PARTIAL_RESTRICTED`), Seaport will call the zone specified by the order (unless the zone is the caller) twice: once before executing any token transfers ( `authorizeOrder`) and again after executing the token transfers (`validateOrder`).

While handling these calls, the zone can perform custom validation logic (modifying state, performing additional calls of its own, etc.) and determine whether or not the order in question should be allowed or rejected.

The fulfillment will revert if the call to the zone reverts, or if the magic value (function selector in question) is not returned. In cases where the call to `authorizeOrder` reverts and the fulfillment method is `fulfillAvailableOrders` or `fulfillAvailableAdvancedOrders`, the order will be skipped.

Both `authorizeOrder` and `validateOrder` will receive the same `ZoneParameters` struct with one key difference: the `orderHashes` array will only contain orders that were supplied and processed prior to the current order. Example: when fulfilling 3 orders, and checking the 2nd order, the `orderHashes` array will have a single element (the first order hash, or `bytes32(0)` if the first order was skipped) when calling `authorizeOrder` and 3 elements (each respective order hash, or `bytes32(0)` for any skipped orders) when calling `validateOrder`.

Note that the `offer` and `consideration` arrays provided to the zone will have any criteria items resolved and all current amounts derived from the original start and end amounts.

```sol Solidity
struct ZoneParameters {
    bytes32 orderHash;
    address fulfiller;
    address offerer;
    SpentItem[] offer;
    ReceivedItem[] consideration;
    bytes extraData;
    bytes32[] orderHashes;
    uint256 startTime;
    uint256 endTime;
    bytes32 zoneHash;
}

// Before executing token transfers
function authorizeOrder(
    ZoneParameters calldata zoneParameters
) external returns (bytes4 authorizeOrderMagicValue)
  
// After executing token transfers
function validateOrder(
    ZoneParameters calldata zoneParameters
) external returns (bytes4 validateOrderMagicValue)
```

### getSeaportMetadata

```sol Solidity
function getSeaportMetadata()
        external
        view
        returns (
            string memory name,
            Schema[] memory schemas // map to Seaport Improvement Proposal IDs
                                    // https://github.com/ProjectOpenSea/SIPs
        )
```

## Contract Hooks

Contract orders (`OrderType` of `CONTRACT`) enable contract offerers that implement the compliant interface to dynamically generate Seaport orders via `generateOrder` and to perform any additional validation or processing after token transfers are complete via `ratifyOrder`. Contract orders are particularly useful for protocols and other contracts that are interested in dynamically participating as an automated buyer or seller in Seaport-powered marketplaces.

Contract orders are not signed offchain like standard Seaport orders, but instead are constructed by the fulfiller to adhere to the requirements of the contract offerer. Contract offerers will generally implement a `previewOrder` function that takes some subset of the full order and returns the missing components of that order. Example: an NFT pool contract that implements a bonding curve to buy and sell NFTs according to an algorithmic process would implement a `previewOrder` function that takes some amount of tokens as the `offer` and returns the full order including the NFTs that would be received back as the `consideration`.

When fulfilling a contract order, the fulfiller provides an `offer` representing the minimum number of items and amounts that need to be supplied by the contract offerer as well as a `consideration` representing the maximum number of items and amounts that the contract offerer may require. The fulfiller may also provide `extraData` which will be supplied to the contract offerer as additional context.

Seaport will supply the original `offer`, `consideration`, and `extraData` arguments to the contract offerer. The contract offerer will process the request, modifying state or performing additional calls where relevant, and return a modified `offer` and `consideration` array where the `offer` array contains at least as many items or amounts of those items and the `consideration` array returns no more than the original items or amounts. If the contract offerer does not return compliant arrays, the fulfillment will revert. If the call to `generateOrder` reverts, the fulfillment will revert unless the `fulfillAvailableOrders` or `fulfillAvailableAdvancedOrders` method is used, in which case the order will be skipped.

For more information on contract orders, see the [relevant documentation in the Seaport repository](https://github.com/ProjectOpenSea/seaport/blob/main/docs/SeaportDocumentation.md#contract-orders).

### ContractOffererInterface

```sol
interface ContractOffererInterface {
    function generateOrder(
        address fulfiller,
        SpentItem[] calldata minimumReceived,
        SpentItem[] calldata maximumSpent,
        bytes calldata context
    )
        external
        returns (SpentItem[] memory offer, ReceivedItem[] memory consideration);

    function ratifyOrder(
        SpentItem[] calldata offer,
        ReceivedItem[] calldata consideration,
        bytes calldata context,
        bytes32[] calldata orderHashes,
        uint256 contractNonce
    ) external returns (bytes4 ratifyOrderMagicValue);

    function previewOrder(
        address caller,
        address fulfiller,
        SpentItem[] calldata minimumReceived,
        SpentItem[] calldata maximumSpent,
        bytes calldata context
    )
        external
        view
        returns (SpentItem[] memory offer, ReceivedItem[] memory consideration);

    function getSeaportMetadata()
        external
        view
        returns (
            string memory name,
            Schema[] memory schemas // map to Seaport Improvement Proposal IDs
                                    // https://github.com/ProjectOpenSea/SIPs
        );
}
```

## Item Hooks

While zone and contract hooks are triggered before and after executing token transfers, item hooks are triggered mid-execution, typically triggered from calls to `safeTransferFrom`. They are not a formal construct within Seaport, but can still be utilized for accomplishing more complex stateful operations requiring additional logic. A key limitation of item hooks is that the amount of data that can be supplied is inherently limited. Furthermore, they are more opaque than zone and contract hooks.

These take 3 different flavors:

- Synthetic tokens: supplying an item with a token that does not adhere to formal semantics but instead performs custom logic, the order can trigger an external hook
- Receive fallback: selecting a recipient of a native token transfer with a receive function that performs additional logic, it can trigger an external hook (though it can't provide any additional data)
- ERC-1155 onReceived fallback: functions similarly to the native token receive fallback but allows for passing through additional data

Before reaching for item hooks, it is strongly encouraged to explore zone or contract hooks as a workable alternative due to their increased flexibility, interoperability, and clarity of purpose.

## Seaport Improvement Proposals

To facilitate discovery and interaction with hooks, a set of standards called Seaport Improvement Proposals (SIPs) are maintained at <https://github.com/ProjectOpenSea/SIPs>.

Relevant SIPs for hook authors to consider include: 

- [SIP-5](https://github.com/ProjectOpenSea/SIPs/blob/main/SIPS/sip-5.md): how to signal which SIPs are implemented by the Seaport hook via `getSeaportMetadata`
- [SIP-6](https://github.com/ProjectOpenSea/SIPs/blob/main/SIPS/sip-6.md): how to encode `extraData` as to support multiple concurrent SIPs

Authors of hooks should review existing SIPs to determine if there is an existing standard they can implement for their particular use case. If one does not exist, the authors are encouraged to propose a new SIP via pull request so that OpenSea and other interested parties can integrate with Seaport orders using the hook.

Hook authors are encouraged to join the [Seaport Working Group Discord](https://discord.gg/ADXcTXpqry) to engage in discussion related to their hooks and corresponding SIPs.