# Twisted Neurons

### Web app showcasing boardgames with AI that's build with machine learning techniques such as artificial neural network

## Chess

The chess program is built from scratch in Javascript. It has 4 main components:

1. Game logic (chessGame.js)
	* The game logic component takes care of all the game rules, states and integration with the neural network.
2. Artificial neural network (chessNN.js)
	* The ANN component contains the neural network, the forward and backward propagation functions and other helper function for it. The architecture of the ANN is inspired by the paper by Matthew Lai: [Giraffe: Using Deep Reinforcement Learning to Play Chess](https://arxiv.org/pdf/1509.01549.pdf)
3. Minimax search (chessMinimax.js)
	* The minimax search component is just a simple minimax search. Optimization techniques will be added to increase the speed of the search algorithm.
4. Trainer for the ANN (chessTrainer.js)
	* The trainer component reads chess FEN positions from file and trains the neural network using standard backpropagation, where the loss is determined using TDLeaf algorithm.


