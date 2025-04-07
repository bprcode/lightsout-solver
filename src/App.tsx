import { useEffect, useState } from 'react'
import './App.css'
export type BoardSize = 2 | 3 | 4 | 5
export type BitBoard = number

export function togglePlus(
  board: BitBoard,
  size: BoardSize,
  row: number,
  col: number
): BitBoard {
  let update = board

  update ^= 1 << (row * size + col)
  if (row > 0) update ^= 1 << ((row - 1) * size + col)
  if (row < size - 1) update ^= 1 << ((row + 1) * size + col)
  if (col > 0) update ^= 1 << (row * size + col - 1)
  if (col < size - 1) update ^= 1 << (row * size + col + 1)

  return update
}

export function toggleSingle(
  board: BitBoard,
  size: BoardSize,
  row: number,
  col: number
): BitBoard {
  let update = board

  update ^= 1 << (row * size + col)

  return update
}

function makeRandomBoard(size: BoardSize) {
  let board = 0
  for (let i = 0; i < 7; i++) {
    const position = Math.floor(Math.random() * size ** 2)
    board = togglePlus(
      board,
      size,
      Math.floor(position / size),
      position % size
    )
  }
  return board
}

// function makeBitBoard(board: number[][]): BitBoard {
//   let bitstring = 0
//   let position = 0
//   for (let r = 0; r < board.length; r++) {
//     for (let c = 0; c < board[0].length; c++) {
//       if (board[r][c]) {
//         bitstring |= 1 << position
//       }
//       position++
//     }
//   }

//   return bitstring
// }

const noop = () => {}

function LightBoard({
  board,
  size,
  onFlip = noop,
  className = '',
  tagRow = NaN,
  tagCol = NaN,
  tag = '',
}: {
  board: number
  size: BoardSize
  onFlip?: (row: number, col: number) => void
  className?: string
  tagRow?: number
  tagCol?: number
  tag?: string
}) {
  if (size < 2 || size > 5) {
    throw new Error(`Unsupported board size (${size})`)
  }

  const gridCols = {
    2: 'grid-cols-[repeat(2,2rem)]',
    3: 'grid-cols-[repeat(3,2rem)]',
    4: 'grid-cols-[repeat(4,2rem)]',
    5: 'grid-cols-[repeat(5,2rem)]',
  }[size]

  const tagIndex = tag ? tagCol + tagRow * size : NaN
  const cells = Array.from({ length: size ** 2 }, (_, i) => {
    const bit = board & (1 << i)
    return (
      <div
        key={i}
        className={`${
          bit
            ? 'bg-emerald-500 hover:bg-emerald-300 active:bg-teal-300'
            : 'bg-stone-800 hover:bg-stone-700 active:bg-stone-400'
        } flex justify-center light-edge`}
        onClick={() => onFlip(Math.floor(i / size), i % size)}
      >
        {i === tagIndex && (
          <div
            className={`outline-2 ${
              bit ? 'outline-orange-500' : 'outline-orange-500'
            } ${
              bit ? 'bg-orange-900/90' : 'bg-orange-900/50'
            } w-100 rounded-full flex justify-center`}
          >
            {tag}
          </div>
        )}
      </div>
    )
  })

  return (
    <div
      className={
        `bg-zinc-700 grid ${gridCols} gap-2 w-fit p-2 light-edge auto-rows-[2rem] relative ` +
        className
      }
    >
      {cells}
      {board === 0 && tag && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1 bg-orange-950/80 outline-orange-500 outline-2">
          {tag}
        </div>
      )}
    </div>
  )
}

function stepDiff(
  before: BitBoard,
  after: BitBoard,
  size: BoardSize
): [number, number] {
  const center: [number, number] = [NaN, NaN]
  for (let row = 0; row < size && isNaN(center[0]); row++) {
    let differences = 0
    for (let col = 0; col < size; col++) {
      if (
        (before & (1 << (row * size + col))) !==
        (after & (1 << (row * size + col)))
      ) {
        differences++
        if (differences === 2) {
          center[0] = row
          break
        }
      }
    }
  }

  for (let col = 0; col < size && isNaN(center[1]); col++) {
    let differences = 0
    for (let row = 0; row < size; row++) {
      if (
        (before & (1 << (row * size + col))) !==
        (after & (1 << (row * size + col)))
      ) {
        differences++
        if (differences === 2) {
          center[1] = col
          break
        }
      }
    }
  }

  return center
}

function SolutionSteps({
  solution,
  size,
}: {
  solution: BitBoard[]
  size: BoardSize
}) {
  return (
    <div>
      <h2 className="text-slate-200 mt-4">Solution steps:</h2>
      <div className="flex flex-wrap gap-4">
        {solution.map((s, i) => {
          const diff =
            i < solution.length - 1 &&
            stepDiff(solution[i], solution[i + 1], size)

          return (
            <div key={i}>
              <LightBoard
                key={i}
                board={s}
                size={size}
                className="mb-4"
                tagRow={diff ? diff[0] : undefined}
                tagCol={diff ? diff[1] : undefined}
                tag={diff ? String(i + 1) : s === 0 ? 'Done!' : undefined}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
function App() {
  const [workerThinking, setWorkerThinking] = useState(false)
  const [solution, setSolution] = useState<BitBoard[] | undefined | null>()
  const [solveWorker, setSolveWorker] = useState<Worker | null>(null)
  useEffect(() => {
    const worker = new Worker(new URL('solve-worker.ts', import.meta.url))
    worker.onmessage = e => {
      console.log('Response returned to main thread:', e.data)
      setSolution(e.data.solution)
      setWorkerThinking(false)
    }

    setSolveWorker(worker)

    return () => worker.terminate()
  }, [])

  const [bitBoard, setBitBoard] = useState<BitBoard>(makeRandomBoard(5))
  const [boardSize, setBoardSize] = useState<BoardSize>(5)

  const [inputMode, setInputMode] = useState(() => togglePlus)

  const activeStyle =
    'bg-emerald-900 inset-shadow-sm inset-shadow-zinc-950 text-emerald-100/80 '
  const inactiveStyle =
    'bg-emerald-700 light-edge-shadow hover:bg-emerald-600 active:bg-emerald-950 '
  const baseButtonStyle = 'px-3 py-1 mb-4 rounded-lg font-semibold '

  return (
    <div className="max-w-3xl mx-auto mt-8 prose bg-zinc-800 text-slate-200 p-4 light-edge">
      <h1 className="text-slate-300 font-bold">Lights Out Solver</h1>

      <p>
        <em>Lights Out</em> is a classic puzzle game in which the player tries
        to switch off every light on the board. Whenever one light is changed,
        its neighbors change in tandem.
      </p>
      <p>
        This solver will find an optimal solution for any Lights Out puzzle, if
        it exists (some boards have no solution). Just set up the board, then
        click "solve" to see the solution.
      </p>

      <div className="flex gap-8 mt-8 w-fit">
        <div className="flex flex-col">
          <LightBoard
            className="mb-4"
            board={bitBoard}
            size={boardSize}
            onFlip={(r, c) => {
              if (solution === null) {
                setSolution(undefined)
              }
              setBitBoard(inputMode(bitBoard, boardSize, r, c))
            }}
          />

          <button
            disabled={workerThinking}
            className={
              workerThinking
                ? baseButtonStyle + `h-9  bg-stone-900 dark-edge ` + 'w-full'
                : inactiveStyle + baseButtonStyle + 'w-full'
            }
            onClick={() => {
              setWorkerThinking(true)
              setSolution(undefined)
              solveWorker?.postMessage({ bitBoard, boardSize })
            }}
          >
            {workerThinking ? (
              <svg
                className="animate-spin mx-auto size-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              'Solve'
            )}
          </button>
        </div>
        <div className="flex flex-col w-fit">
          <button
            className={`${
              inputMode === togglePlus ? activeStyle : inactiveStyle
            } ${baseButtonStyle}`}
            onClick={() => {
              setInputMode(() => togglePlus)
            }}
          >
            Toggle linked tiles
          </button>
          <button
            className={`${
              inputMode === toggleSingle ? activeStyle : inactiveStyle
            } ${baseButtonStyle}`}
            onClick={() => setInputMode(() => toggleSingle)}
          >
            Toggle one at a time
          </button>
          <select
            className="bg-zinc-700 px-4 py-2 light-edge mx-1"
            value={boardSize}
            onChange={e => {
              setBoardSize(Number(e.target.value) as BoardSize)
              setBitBoard(makeRandomBoard(Number(e.target.value) as BoardSize))
              setSolution(undefined)
            }}
          >
            <option value="2">2x2</option>
            <option value="3">3x3</option>
            <option value="4">4x4</option>
            <option value="5">5x5</option>
          </select>
        </div>
      </div>

      {solution === null && (
        <h2 className="text-orange-300">This board cannot be solved.</h2>
      )}
      {solution && <SolutionSteps solution={solution} size={boardSize} />}
    </div>
  )
}

export default App

type F2 = 0 | 1
const testMatrix:F2[][] = [
[1,1,0,1,0,0,0,0,0],
[1,1,1,0,1,0,0,0,0],
[0,1,1,0,0,1,0,0,0],
[1,0,0,1,1,0,1,0,0],
[0,1,0,1,1,1,0,1,0],
[0,0,1,0,1,1,0,0,1],
[0,0,0,1,0,0,1,1,0],
[0,0,0,0,1,0,1,1,1],
[0,0,0,0,0,1,0,1,1],
]

function augmentTest(augment:F2[]):F2[][] {
  const augmented = structuredClone(testMatrix)
   for (let k = 0; k < augment.length; k++) {
    augmented[k].push(augment[k])
  }

  return augmented
}

const f2Matrix :F2[][]= [
  [0,0,1,0,0],
  [1,0,1,0,1],
  [1,0,1,1,0],
  [0,0,0,1,1],
] 
function rrefOverF2(matrix: F2[][]) {
  console.log('Initial matrix:')
  show()
  
  arrangePivots()
  console.log('After placing pivots:')
  show()
  
  console.log('matrix is consistent?', checkConsistency())

  for (let i = 0; i < matrix.length; i++) {
    for(let j = 0; j < matrix[0].length; j++) {
      if(matrix[i][j] !== 0) {
        clearAbove(i,j)
        break
      }
    }
  }

  console.log('After clear above:')
  show()

  function show() {
    for(const row of matrix) {
      console.log(row)
    }
  }

  function checkConsistency() {
    for(let i = matrix.length-1; i>=0; i--) {
      for(let j = 0; j < matrix[0].length; j++) {
        if(matrix[i][j] !== 0) {
          if(j === matrix[0].length-1) {
            return false
          }
          break
        }
      }
    }

    return true
  }

  function addRowFromTo(sourceRow:number,targetRow:number) {
    for (let j = 0; j < matrix[0].length; j++) {
      matrix[targetRow][j] = (matrix[sourceRow][j]+matrix[targetRow][j])%2 as F2
    }
  }

  function clearBelow(i:number,j:number) {
    for (let iPrime = i+1; iPrime < matrix.length; iPrime++) {
      if(matrix[iPrime][j] !== 0) {
        console.log(i,'->',iPrime)
        addRowFromTo(i,iPrime)
      }
    }
  }

  function clearAbove(i:number,j:number) {
    for(let iPrime = i-1; iPrime >= 0; iPrime--) {
      if(matrix[iPrime][j] !== 0) {
        console.log(i,'->>',iPrime)
        addRowFromTo(i,iPrime)
      }
    }
  }

  function arrangePivots(iFrom=0,jFrom=0) {
    console.log(iFrom,jFrom,'...')
    for (let j = jFrom; j < matrix[0].length; j++) {
      for(let i = iFrom; i < matrix.length; i++) {
        if(matrix[i][j] !== 0) {
          // console.log('swapping',i,iFrom)
          console.log(i,'<>',iFrom)
          const swap = matrix[iFrom]
          matrix[iFrom] = matrix[i]
          matrix[i] = swap
          // console.log('~')
          // show()
          clearBelow(iFrom,j)
          // return
          show()
          arrangePivots(iFrom+1,j+1)
          return
        }
      }
      
    }
  }
}

console.log('Check')
rrefOverF2(augmentTest([1,1,0,1,0,1,0,0,1]))
