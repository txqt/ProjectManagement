using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagement.Migrations
{
    /// <inheritdoc />
    public partial class board_token : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BoardShareTokens",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    BoardId = table.Column<string>(type: "text", nullable: false),
                    Token = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardShareTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardShareTokens_Boards_BoardId",
                        column: x => x.BoardId,
                        principalTable: "Boards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BoardShareTokens_BoardId_IsActive",
                table: "BoardShareTokens",
                columns: new[] { "BoardId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_BoardShareTokens_Token",
                table: "BoardShareTokens",
                column: "Token",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BoardShareTokens");
        }
    }
}
