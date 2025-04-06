// import { togglePlus, BitBoard, BoardSize } from './App'

onmessage = e => {
  console.log('Worker received message:', e.data)
  solve(e.data.bitBoard, e.data.boardSize).then(solution =>
    postMessage({ solution })
  )
  postMessage('worker onmessage returning')
}

console.log('⚠️ Todo: Debug imports from worker code')

type BoardSize = 2 | 3 | 4 | 5
type BitBoard = number

function togglePlus(
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
async function solve(
  board: BitBoard,
  size: BoardSize
): Promise<BitBoard[] | null> {
  const seen = new Set<BitBoard>([board])
  const parent = new Map<BitBoard, BitBoard>([[board, -1]])

  let current: BitBoard[] = []
  let upcoming: BitBoard[] = [board]

  let depth = 0

  console.log('original state:', board, 'with size:', size)
  while (upcoming.length) {
    current = upcoming
    upcoming = []

    console.log('exploring depth', depth++)

    for (const u of current) {
      if (u === 0) {
        console.log('⚠️ Solution found!')
        // console.log(parent)
        // window.parent=parent
        const solution: BitBoard[] = []
        for (let p = u; p !== -1; p = parent.get(p)!) {
          solution.push(p)
        }
        return solution.reverse()
      }

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const move = togglePlus(u, size, r, c)
          if (!seen.has(move)) {
            seen.add(move)
            parent.set(move, u)
            upcoming.push(move)
          }
        }
      }
    }
  }

  console.log('❌ Bailing out')
  return null
}
