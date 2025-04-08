type F2 = 0 | 1

onmessage = e => {
  const boardVector: F2[] = Array(e.data.boardSize ** 2)
  for (let i = 0; i < e.data.boardSize ** 2; i++) {
    boardVector[i] = e.data.bitBoard & (1 << i) ? 1 : 0
  }

  try {
    const solution = solveBoardVector(boardVector)
    postMessage({ solution, originalBitBoard: e.data.bitBoard })
  } catch (error) {
    if (error instanceof Error) {
      postMessage({ error })
      return
    }
    postMessage({ error: 'Unhandled error: ' + error })
  }
}

function solveBoardVector(vector: F2[]) {
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

  const solution: F2[] = Array(vector.length)
  for (let i = 0; i < vector.length; i++) {
    solution[i] = matrix[i][matrix[i].length - 1]
  }

  return solution

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
  arrangePivots()

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[0].length; j++) {
      if (matrix[i][j] !== 0) {
        clearAbove(i, j)
        break
      }
    }
  }

  function addRowFromTo(sourceRow: number, targetRow: number) {
    for (let j = 0; j < matrix[0].length; j++) {
      matrix[targetRow][j] = ((matrix[sourceRow][j] + matrix[targetRow][j]) %
        2) as F2
    }
  }

  function clearBelow(i: number, j: number) {
    for (let iPrime = i + 1; iPrime < matrix.length; iPrime++) {
      if (matrix[iPrime][j] !== 0) {
        addRowFromTo(i, iPrime)
      }
    }
  }

  function clearAbove(i: number, j: number) {
    for (let iPrime = i - 1; iPrime >= 0; iPrime--) {
      if (matrix[iPrime][j] !== 0) {
        addRowFromTo(i, iPrime)
      }
    }
  }

  function arrangePivots(iFrom = 0, jFrom = 0) {
    for (let j = jFrom; j < matrix[0].length; j++) {
      for (let i = iFrom; i < matrix.length; i++) {
        if (matrix[i][j] !== 0) {
          const swap = matrix[iFrom]
          matrix[iFrom] = matrix[i]
          matrix[i] = swap
          clearBelow(iFrom, j)
          arrangePivots(iFrom + 1, j + 1)
          return
        }
      }
    }
  }
}
