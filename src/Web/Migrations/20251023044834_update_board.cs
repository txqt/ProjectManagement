using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagement.Migrations
{
    /// <inheritdoc />
    public partial class update_board : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowAttachmentsOnCard",
                table: "Boards",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowCommentsOnCard",
                table: "Boards",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowShareInviteLink",
                table: "Boards",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowAttachmentsOnCard",
                table: "Boards");

            migrationBuilder.DropColumn(
                name: "AllowCommentsOnCard",
                table: "Boards");

            migrationBuilder.DropColumn(
                name: "AllowShareInviteLink",
                table: "Boards");
        }
    }
}
