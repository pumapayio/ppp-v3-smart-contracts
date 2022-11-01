# Token Swap - DEX Integration

We have three main cases for pull payment execution.

1. PMA -> PMA payment
2. non-PMA -> PMA or PMA -> non-PMA payment
3. non-PMA -> non-PMA payment

**NOTE: We always get the execution fee in PMA tokens**

## PMA -> PMA payment

We need to follow the steps below to execute this type of PullPayment

1. Get PMA tokens from user
2. Calculate and transfer execution fee in PMA token
3. Simple transfer the remaining PMA tokens to merchant

## non-PMA -> PMA or PMA -> non-PMA payment

In these cases we have only one swap path, The possible paths can be:

- non-PMA -> PMA
- non-PMA -> WBNB -> PMA
- PMA -> non-PMA
- PMA -> WBNB -> non-PMA

We need to follow the steps below to execute this type of PullPayment according to the possible path

**non-PMA -> PMA or non-PMA -> WBNB -> PMA**

In these cases we follow the following steps

1. Get non-PMA tokens from user
1. Swap non-PMA tokens to PMA tokens
1. Transfer execution fee in PMA
1. Transfer remaining PMA tokens to merchant

**PMA -> non-PMA or PMA -> WBNB -> non-PMA**

In these cases we follow the following steps

1. Get PMA tokens from user
1. Transfer execution fee in PMA
1. Swap remaining PMA tokens to non-PMA tokens using either of the paths.
1. Transfer converted tokens to merchant

## non-PMA -> non-PMA payment

In this case we follow the following steps

1. Get two paths for token conversion. The possible two paths can be
   1. non-PMA -> PMA and PMA -> non-PMA
   1. non-PMA -> WBNB -> PMA and PMA -> non-PMA
   1. non-PMA -> PMA and PMA -> WBNB -> non-PMA
1. Get required amount of non-PMA tokens from user
1. Swap non-PMA tokens(payment tokens) to PMA tokens using the first path i.e(non-PMA -> PMA or non-PMA -> WBNB -> PMA).
1. Transfer execution fee in PMA tokens
1. Swap remaining PMA tokens to non-PMA tokens(settlement tokens)
1. Transfer non-PMA tokens(settlement tokens) to merchant