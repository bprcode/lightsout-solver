import { useState } from 'react'
import './App.css'

type BoardSize = 2 | 3 | 4 | 5
type BitBoard = number

function toggleTile(
  board: BitBoard,
  size: BoardSize,
  row: number,
  col: number
): BitBoard {}

function makeBitBoard(board: number[][]): BitBoard {
  let bitstring = 0
  let position = 0
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (board[r][c]) {
        bitstring |= 1 << position
      }
      position++
    }
  }

  return bitstring
}

function LightBoard({
  board,
  size,
  onFlip,
}: {
  board: number
  size: BoardSize
  onFlip: (row: number, col: number) => void
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

  const cells = Array.from({ length: size ** 2 }, (_, i) => {
    const bit = board & (1 << i)
    return (
      <div
        key={i}
        className={`${
          bit
            ? 'bg-emerald-500 hover:bg-emerald-300 active:bg-lime-400'
            : 'bg-stone-800 hover:bg-stone-700 active:bg-stone-400'
        } flex justify-center light-edge`}
        onClick={() => onFlip(Math.floor(i / size), i % size)}
      ></div>
    )
  })

  return (
    <div
      className={`bg-zinc-700 grid ${gridCols} gap-2 w-fit p-2 light-edge auto-rows-[2rem]`}
    >
      {cells}
    </div>
  )
}

function App() {
  const [originalBoard] = useState([
    [0, 1, 0],
    [0, 1, 1],
    [0, 0, 1],
  ])
  const [bitBoard, setBitBoard] = useState<BitBoard>(
    makeBitBoard(originalBoard)
  )
  const [boardSize, setBoardSize] = useState<BoardSize>(
    originalBoard.length as BoardSize
  )

  const [message, setMessage] = useState('Awaiting click...')

  return (
    <div className="max-w-prose mx-auto mt-12 prose bg-zinc-800 text-slate-200 p-4 light-edge">
      <h1 className="text-slate-300 font-bold">LightsOut Solver</h1>
      <h2>{message}</h2>

      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Omnis adipisci
        neque veniam numquam asperiores dolor aut officia quam dolorum est.
      </p>

      <LightBoard
        board={bitBoard}
        size={boardSize}
        onFlip={(r, c) => setMessage(`${r},${c} flipped`)}
      />
      <div className="card">
        {/* <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button> */}
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Expedita
          quod voluptas vitae hic. Consectetur laborum eveniet ipsam aliquam
          labore harum voluptatum dolorum tempora? Tempora facere dolores fugit
          magni porro alias hic possimus natus omnis a id ut non suscipit rem
          obcaecati ratione aspernatur, vero incidunt dolore architecto beatae
          doloribus. Tempora debitis mollitia labore quibusdam, obcaecati
          consectetur inventore, assumenda facere exercitationem eveniet
          temporibus dolore est officia error fugiat ab beatae cum porro. Iste
          saepe vitae maxime inventore architecto officiis deleniti eaque!
        </p>
      </div>
    </div>
  )
}

export default App
