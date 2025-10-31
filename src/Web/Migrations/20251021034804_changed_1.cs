using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagement.Migrations
{
    /// <inheritdoc />
    public partial class changed_1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Created",
                table: "Notifications",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "Created",
                table: "Comments",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "Created",
                table: "Columns",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "Created",
                table: "Cards",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "Created",
                table: "Boards",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "Created",
                table: "BoardInvites",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "Created",
                table: "Attachments",
                newName: "CreatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Notifications",
                newName: "Created");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Comments",
                newName: "Created");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Columns",
                newName: "Created");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Cards",
                newName: "Created");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Boards",
                newName: "Created");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "BoardInvites",
                newName: "Created");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Attachments",
                newName: "Created");
        }
    }
}
