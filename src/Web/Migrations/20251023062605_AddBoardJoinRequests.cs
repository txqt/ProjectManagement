using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddBoardJoinRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BoardJoinRequests",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    BoardId = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false, defaultValue: "pending"),
                    Message = table.Column<string>(type: "text", nullable: true),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RespondedBy = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardJoinRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardJoinRequests_AspNetUsers_RespondedBy",
                        column: x => x.RespondedBy,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BoardJoinRequests_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BoardJoinRequests_Boards_BoardId",
                        column: x => x.BoardId,
                        principalTable: "Boards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BoardJoinRequests_BoardId_UserId_Status",
                table: "BoardJoinRequests",
                columns: new[] { "BoardId", "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_BoardJoinRequests_RespondedBy",
                table: "BoardJoinRequests",
                column: "RespondedBy");

            migrationBuilder.CreateIndex(
                name: "IX_BoardJoinRequests_UserId",
                table: "BoardJoinRequests",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BoardJoinRequests");
        }
    }
}
