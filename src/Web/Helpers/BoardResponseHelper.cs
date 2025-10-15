using AutoMapper;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Column;

namespace ProjectManagement.Helpers
{
    public static class BoardResponseHelper
    {
        /// <summary>
        /// Format board data cho API response - sort columns by rank
        /// </summary>
        public static BoardDto FormatBoardResponse(Board board, IMapper mapper)
        {
            var boardDto = mapper.Map<BoardDto>(board);
            
            // Sort columns by rank
            if (boardDto.Columns != null)
            {
                boardDto.Columns = boardDto.Columns
                    .OrderBy(c => c.Rank ?? string.Empty)
                    .ToList();

                // Sort cards within each column by rank
                foreach (var column in boardDto.Columns)
                {
                    if (column.Cards != null)
                    {
                        column.Cards = column.Cards
                            .OrderBy(c => c.Rank ?? string.Empty)
                            .ToList();
                    }
                }
            }

            return boardDto;
        }

        /// <summary>
        /// Format column data cho API response - sort cards by rank
        /// </summary>
        public static ColumnDto FormatColumnResponse(Column column, IMapper mapper)
        {
            var columnDto = mapper.Map<ColumnDto>(column);

            if (columnDto.Cards != null)
            {
                columnDto.Cards = columnDto.Cards
                    .OrderBy(c => c.Rank ?? string.Empty)
                    .ToList();
            }

            return columnDto;
        }
    }
}