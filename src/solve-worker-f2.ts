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

function getFreeVariables(rref: F2[][]):number[] {
  const candidates = new Set<number>()
  for (let j = 0; j < rref[0].length-1; j++) {
    candidates.add(j)
  }
  
  for(let i = 0; i < rref.length; i++) {
    for (let j = 0; j < rref[0].length-1; j++) {
      if(rref[i][j] !== 0) {
        candidates.delete(j)
        break
      }
    }
  }

  return [...candidates]
}

function substituteFreeVariables(rref: F2[][], substitutions:[number,F2][]):number[] {
  const clone = structuredClone(rref)

  for(const sub of substitutions) {
    console.log('substituting', sub[1], 'into', sub[0])
    for (let i = 0; i < rref.length; i++) {
      clone[i][sub[0]] = clone[i][sub[0]] && sub[1]
    }
  }

  console.log('after substitution:')
    for(let i  = 0; i < clone.length;i++){
    console.log(i,'\t',clone[i].map(x=>x?'⬜': '⬛').join(''))
  }

  const particularSolution:F2[] = Array(clone.length).fill(0)

  for (let i = 0; i < clone.length; i++) {
    let flips = clone[i][clone[i].length-1]
    for(let j = clone[i].length-2; j >= 0; j--) {
      flips += clone[i][j]
    }
    if(flips === 0) {
      continue
    }
    particularSolution[i]= (flips-1)%2 as F2
    
  }

  console.log('before patch, psol:',particularSolution)
  for(const numf of substitutions) {
    if(numf[1]) {
      particularSolution[numf[0]] = 1
    }
  }
  console.log('after patch, psol:',particularSolution)

  console.log('particular solution:')
  const solution =particularSolution.map((v,i) => v ? i : -1).filter(x=>x!==-1)
  console.log(solution.join(','))

  return solution
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

  // DEBUG
  for(let i = 0; i< matrix.length;i++) {
    console.log(i,'\t',matrix[i].map(x=>x?'🟦': '⬛').join(''))
  }

  const freeVariables = getFreeVariables(matrix)
  console.log('free variable list?', freeVariables)
  for(let v = 0; v < 2 ** freeVariables.length; v++) {
    const substitutions = freeVariables.map((free,i) => [free, v & (1 << i) ? 1:0] as [number,F2])
    console.log(substitutions)
    // next: generate a solution from each free variable selection...
    const outcome = substituteFreeVariables(matrix, substitutions)
    console.log(outcome)
  }
  return solution

  console.log('Possible solution sequence:',solution.map((x,i)=>x ?i : -1).filter(x=>x!==-1))

  const basisMatrix = getLogicMatrix(Math.sqrt(vector.length))
  const filteredMatrix = basisMatrix.filter((_,i) => solution[i]===1)
  // const redundantMatrix = basisMatrix.filter((_,i) => solution[i] === 1)
  for(let i = 0; i < vector.length; i++) {
    if(solution[i]) {
      console.log(basisMatrix[i].map(x=>x?'🟦': '⬛').join(''))
    }
  }
  console.log('Sums to?')
  console.log(vector.map(x=>x?'🟩': '⬛').join(''))

  console.log('Filtered matrix')
  for(let i = 0; i < filteredMatrix.length;i++) {
    console.log(i,'\t',filteredMatrix[i].map(x=>x?'⬜': '⬛').join(''))
  }
  const redundantMatrix =  Array.from({length:filteredMatrix[0].length}, () => Array(filteredMatrix.length))
  console.log('hackjob transpose:')
  for (let i = 0; i < filteredMatrix.length; i++) {
    for (let j = 0; j < filteredMatrix[0].length; j++) {
      redundantMatrix[j][i]=filteredMatrix[i][j]
    }
    
  }
  console.log('Possibly-redundant basis:')
  for(let i = 0; i < redundantMatrix.length; i++) {
    console.log(i,'\t',redundantMatrix[i].map(x=>x?'🟪': '⬛').join(''))
  }

  rrefOverF2(redundantMatrix)
  console.log('After rref:')
  for(let i = 0; i < redundantMatrix.length; i++) {
    console.log(i,'\t', redundantMatrix[i].map(x=>x?'🟧': '⬛').join(''))
  }

  // rrefOverF2(filteredMatrix)
  // console.log('after rref:')
  // for(let i = 0; i < filteredMatrix.length;i++) {
  //   console.log(i,'\t',filteredMatrix[i].map(x=>x?'🟧': '⬛').join(''))
  // }
  // /DEBUG

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
