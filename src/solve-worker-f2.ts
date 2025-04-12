import { SolveRequest, SolveResponse } from './App'
type F2 = 0 | 1

onmessage = (e: MessageEvent<SolveRequest>) => {
  const boardVector: F2[] = Array(e.data.boardSize ** 2)
  for (let i = 0; i < e.data.boardSize ** 2; i++) {
    boardVector[i] = e.data.bitBoard & (1 << i) ? 1 : 0
  }

  try {
    const solutions = solveBoardVector(boardVector)
    const bestSolution = solutions.reduce(
      (previous, current) =>
        current.length < previous.length ? current : previous,
      solutions[0]
    )

    postMessage({
      solutions,
      bestSolution,
      originalBitBoard: e.data.bitBoard,
    } as SolveResponse)
  } catch (error) {
    if (error instanceof Error) {
      postMessage({ error })
      return
    }
    postMessage({ error: 'Unhandled error: ' + error })
  }
}

function getFreeVariables(rref: F2[][]): number[] {
  const candidates = new Set<number>()
  for (let j = 0; j < rref[0].length - 1; j++) {
    candidates.add(j)
  }

  for (let i = 0; i < rref.length; i++) {
    for (let j = 0; j < rref[0].length - 1; j++) {
      if (rref[i][j] !== 0) {
        candidates.delete(j)
        break
      }
    }
  }

  return [...candidates]
}

function substituteFreeVariables(
  rref: F2[][],
  substitutions: [number, F2][]
): number[] {
  const clone = structuredClone(rref)

  for (const sub of substitutions) {
    for (let i = 0; i < rref.length; i++) {
      clone[i][sub[0]] = clone[i][sub[0]] && sub[1]
    }
  }

  const particularSolution: F2[] = Array(clone.length).fill(0)

  for (let i = 0; i < clone.length; i++) {
    let flips = clone[i][clone[i].length - 1]
    for (let j = clone[i].length - 2; j >= 0; j--) {
      flips += clone[i][j]
    }
    if (flips === 0) {
      continue
    }
    particularSolution[i] = ((flips - 1) % 2) as F2
  }

  for (const numf of substitutions) {
    if (numf[1]) {
      particularSolution[numf[0]] = 1
    }
  }

  const solution = particularSolution
    .map((v, i) => (v ? i : -1))
    .filter(x => x !== -1)

  return solution
}

function solveBoardVector(vector: F2[]): number[][] {
  if (![4, 9, 16, 25].includes(vector.length)) {
    throw new Error('Board state must be a supported length.')
  }

  const matrix = getLogicMatrix(Math.sqrt(vector.length))

  for (let i = 0; i < vector.length; i++) {
    matrix[i].push(vector[i])
  }

  rrefOverF2(matrix)

  if (!isConsistent(matrix)) {
    throw new Error('Board has no solution.')
  }

  const solutions: number[][] = []
  const freeVariables = getFreeVariables(matrix)
  for (let v = 0; v < 2 ** freeVariables.length; v++) {
    const substitutions = freeVariables.map(
      (free, i) => [free, v & (1 << i) ? 1 : 0] as [number, F2]
    )

    const outcome = substituteFreeVariables(matrix, substitutions)
    solutions.push(outcome)
  }

  return solutions

  function isConsistent(reduced: F2[][]) {
    for (let i = reduced.length - 1; i >= 0; i--) {
      for (let j = 0; j < reduced[0].length; j++) {
        if (reduced[i][j] !== 0) {
          if (j === reduced[0].length - 1) {
            return false
          }
          break
        }
      }
    }

    return true
  }
}

function getLogicMatrix(dimension: number): F2[][] {
  const n2 = dimension ** 2
  const blankRow = Array(n2).fill(0)
  const matrix: F2[][] = Array.from({ length: n2 }, () => blankRow.slice(0))

  for (let i = 0; i < dimension; i++) {
    for (let j = 0; j < dimension; j++) {
      matrix[i * dimension + j][i * dimension + j] = 1

      if (i > 0) matrix[i * dimension + j][(i - 1) * dimension + j] = 1
      if (i < dimension - 1)
        matrix[i * dimension + j][(i + 1) * dimension + j] = 1
      if (j > 0) matrix[i * dimension + j][i * dimension + j - 1] = 1
      if (j < dimension - 1)
        matrix[i * dimension + j][i * dimension + j + 1] = 1
    }
  }

  return matrix
}

function rrefOverF2(matrix: F2[][]) {
  reduceSubmatrix(0, 0)

  function reduceSubmatrix(iFrom: number, jFrom: number) {
    for (let j = jFrom; j < matrix[0].length; j++) {
      for (let i = iFrom; i < matrix.length; i++) {
        if (matrix[i][j] !== 0) {
          const swap = matrix[iFrom]
          matrix[iFrom] = matrix[i]
          matrix[i] = swap
          clearPivotColumn(iFrom, j)
          reduceSubmatrix(iFrom + 1, j + 1)
          return
        }
      }
    }
  }

  function clearPivotColumn(i: number, j: number) {
    for (let iPrime = 0; iPrime < matrix.length; iPrime++) {
      if (iPrime !== i && matrix[iPrime][j]) {
        addRowFromTo(i, iPrime)
      }
    }
  }

  function addRowFromTo(sourceRow: number, targetRow: number) {
    for (let j = 0; j < matrix[0].length; j++) {
      matrix[targetRow][j] = ((matrix[sourceRow][j] + matrix[targetRow][j]) %
        2) as F2
    }
  }
}
