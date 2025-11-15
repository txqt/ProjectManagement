// using ProjectManagement.Data;
// using LexoAlgorithm;
// using Microsoft.EntityFrameworkCore;
//
// namespace ProjectManagement.Services
// {
//     public class LexoRankMigrationService
//     {
//         private readonly ApplicationDbContext _context;
//         private readonly ILogger<LexoRankMigrationService> _logger;
//
//         public LexoRankMigrationService(ApplicationDbContext context, ILogger<LexoRankMigrationService> logger)
//         {
//             _context = context;
//             _logger = logger;
//         }
//
//         /// <summary>
//         /// Migrate existing data to use LexoRank
//         /// Run this once after adding Rank column to database
//         /// </summary>
//         public async Task MigrateToLexoRankAsync()
//         {
//             _logger.LogInformation("Starting LexoRank migration...");
//
//             // ======== Migrate Columns ========
//             var boards = await _context.Boards.Include(b => b.Columns).ToListAsync();
//             foreach (var board in boards)
//             {
//                 _logger.LogInformation($"Migrating board: {board.Id}");
//
//                 var columns = board.Columns.OrderBy(c => c.CreatedAt).ToList();
//                 for (int i = 0; i < columns.Count; i++)
//                 {
//                     if (i == 0)
//                     {
//                         columns[i].Rank = LexoRank.Min().ToString();
//                     }
//                     else
//                     {
//                         var prevRank = LexoRank.Parse(columns[i - 1].Rank);
//                         columns[i].Rank = prevRank.GenNext().ToString();
//                     }
//                     _logger.LogInformation($"  Column {columns[i].Id}: {columns[i].Rank}");
//                 }
//             }
//
//             // ======== Migrate Cards ========
//             var columns_all = await _context.Columns
//                 .Include(c => c.Cards)
//                 .ToListAsync();
//
//             foreach (var column in columns_all)
//             {
//                 _logger.LogInformation($"Migrating column: {column.Id}");
//
//                 var cards = column.Cards.OrderBy(c => c.CreatedAt).ToList();
//                 for (int i = 0; i < cards.Count; i++)
//                 {
//                     if (i == 0)
//                     {
//                         cards[i].Rank = LexoRank.Min().ToString();
//                     }
//                     else
//                     {
//                         var prevRank = LexoRank.Parse(cards[i - 1].Rank);
//                         cards[i].Rank = prevRank.GenNext().ToString();
//                     }
//                     _logger.LogInformation($"  Card {cards[i].Id}: {cards[i].Rank}");
//                 }
//             }
//
//             await _context.SaveChangesAsync();
//             _logger.LogInformation("LexoRank migration completed!");
//         }
//     }
// }