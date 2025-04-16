# *Lights Out* Solver

## A solving utility for the Lights Out puzzle game.

This utility finds solutions to Lights Out puzzles in board sizes ranging from 2x2 through 5x5.

Solutions are found via Gauss-Jordan elimination. The puzzle logic is represented as an n²-by-n² matrix where each row defines the set of inputs which would cause an inversion of each of the n² cells of the original board. The matrix is augmented with a column vector representing the particular puzzle state and is converted into reduced row-echelon form.

The system is then checked to confirm solvability (i.e. the absence of any unsatisfiable rows, Σ0 = 1) and free variables are identified. At board sizes from 2x2 through 5x5, the number of free variables ranges from zero to four.

To determine an optimal solution, all possible sequences of the free variables are compared.

The user is then presented with a minimum-length solution consisting of moves listed in top-left to bottom-right order, although any permutation of those moves will also yield an equivalent solution.
