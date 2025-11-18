export const isBoardTemplate = (board) => {
  return board?.type === 'template';
};

export const canModifyBoard = (board) => {
  return !isBoardTemplate(board);
};