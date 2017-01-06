# Twisted Neurons

### Web app showcasing boardgames with AI that's build with machine learning techniques such as artificial neural network

## Usage/Setup

View the deployed app [here](https://twisted-neurons-heroku.herokuapp.com).

OR

With npm and node.js installed, clone the git repo then while in the app directory run

```
npm start
```

## Chess

The chess program is built from scratch in Javascript. It has 4 main components:

1. Game logic (chessGame.js)
	* The game logic component takes care of all the game rules, states and integration with the neural network.
2. Artificial neural network (chessNN.js)
	* The ANN component contains the neural network, the forward and backward propagation functions and other helper function for it. The architecture of the ANN is inspired by the paper by Matthew Lai: [Giraffe: Using Deep Reinforcement Learning to Play Chess](https://arxiv.org/pdf/1509.01549.pdf)
3. Minimax search (chessMinimax.js)
	* The minimax search component is just a simple minimax search. Optimization techniques will be added to increase the speed of the search algorithm.
4. Trainer for the ANN (chessTrainer.js)
	* The trainer component reads chess FEN positions from file and trains the neural network using standard backpropagation, where the loss is determined using TDLeaf algorithm. It is trained through reinforcement learning by having the program play itself for a number of moves, each time after reading a unique chess position from file.

## References and Resources

1. Matthew Lai. [Giraffe: Using Deep Reinforcement Learning to Play Chess](https://arxiv.org/pdf/1509.01549.pdf)
2. Matthew D. Zeiler. [ADADELTA: AN ADAPTIVE LEARNING RATE METHOD](https://arxiv.org/pdf/1212.5701v1.pdf)
3. Jonathan Baxter, Andrew Tridgell and Lex Weaver. [TDLeaf(λ): Combining Temporal Difference Learning with Game-Tree Search.](https://arxiv.org/pdf/cs/9901001v1.pdf)
4. Warren S. Sarle. [Neural Network FAQ](ftp://ftp.sas.com/pub/neural/FAQ.html)
5. Fei-Fei Li, Andrej Karpathy and Justin Johnson. [CS231n: Convolutional Neural Networks for Visual Recognition](http://cs231n.stanford.edu/)
