# Bundler

Bundler can transfer multiple ERC20 tokens to multiple addresses in one transaction.

This DApp can be used in the four ways I can think of
1.Airdrops
2.Prize Distributions
3.Capital distribution
4. Gitcoin Grants

A naive way of doing the above things is to transfer tokens one by one to required addresses. It wastes too much gas. This is how gitcoin team is doing it in CLR round 6: https://github.com/gitcoinco/web/blob...

I am trying to improve it by making it gasless. If you are transferring ERC20 tokens then you need to have ETH or MATIC to be able to do that. I am leveraging Dai's permit function to be able to do this.(https://medium.com/@Degens/betting-wi...) In gitcoin grants right now most of donations are using DAI tokens but gitcoin grant requires you to call approve an then the donation happens. I am trying to make it so that it permits and donates in one single transaction. To be able to make it gasless I am going to use the Biconomy's relayer network(https://biconomy.io/).

I have developed all the necessary contracts and now I am going to develop the frontend.
