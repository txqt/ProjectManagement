import { useBoardStore } from '~/stores/boardStore'

export const useIsTemplateBoard = () => {
  const board = useBoardStore(state => state.board)
  return board?.type === 'template'
}