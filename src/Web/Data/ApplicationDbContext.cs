using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Models.Domain.Entities;
using System.Reflection.Emit;
using System.Text.Json;

namespace Infrastructure
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Board> Boards { get; set; }
        public DbSet<Column> Columns { get; set; }
        public DbSet<Card> Cards { get; set; }
        public DbSet<BoardMember> BoardMembers { get; set; }
        public DbSet<CardMember> CardMembers { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<BoardInvite> BoardInvites { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure Board
            builder.Entity<Board>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Type).IsRequired().HasDefaultValue("public");

                entity.HasOne(e => e.Owner)
                    .WithMany(u => u.OwnedBoards)
                    .HasForeignKey(e => e.OwnerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Column
            builder.Entity<Column>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);

                entity.HasOne(e => e.Board)
                    .WithMany(b => b.Columns)
                    .HasForeignKey(e => e.BoardId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Card
            builder.Entity<Card>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);

                entity.HasOne(e => e.Board)
                    .WithMany()
                    .HasForeignKey(e => e.BoardId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Column)
                    .WithMany(c => c.Cards)
                    .HasForeignKey(e => e.ColumnId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure BoardMember
            builder.Entity<BoardMember>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Role).HasDefaultValue("member");

                entity.HasOne(e => e.Board)
                    .WithMany(b => b.Members)
                    .HasForeignKey(e => e.BoardId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.BoardMemberships)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Unique constraint: one user can only have one role per board
                entity.HasIndex(e => new { e.BoardId, e.UserId }).IsUnique();
            });

            // Configure CardMember
            builder.Entity<CardMember>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Card)
                    .WithMany(c => c.Members)
                    .HasForeignKey(e => e.CardId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.CardMemberships)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Unique constraint: one user can only be assigned once per card
                entity.HasIndex(e => new { e.CardId, e.UserId }).IsUnique();
            });

            // Configure Comment
            builder.Entity<Comment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Content).IsRequired();

                entity.HasOne(e => e.Card)
                    .WithMany(c => c.Comments)
                    .HasForeignKey(e => e.CardId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Comments)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Attachment
            builder.Entity<Attachment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
                entity.Property(e => e.Url).IsRequired();
                entity.Property(e => e.Type).HasDefaultValue("file");

                entity.HasOne(e => e.Card)
                    .WithMany(c => c.Attachments)
                    .HasForeignKey(e => e.CardId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure BoardInvite
            builder.Entity<BoardInvite>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.InviteeEmail).IsRequired().HasMaxLength(200);
                entity.Property(e => e.InviteeId).IsRequired();
                entity.Property(e => e.Status).HasDefaultValue("pending");
                entity.HasOne(e => e.Board)
                    .WithMany(b => b.Invites)
                    .HasForeignKey(e => e.BoardId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Notification
            builder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Type).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.IsRead).HasDefaultValue(false);
                entity.HasOne(e => e.User)
                    .WithMany(u => u.Notifications)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity
                    .HasOne(n => n.Board)
                    .WithMany()
                    .HasForeignKey(n => n.BoardId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity
                    .HasOne(n => n.Card)
                    .WithMany()
                    .HasForeignKey(n => n.CardId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity
                    .HasOne(n => n.Invite)
                    .WithMany()
                    .HasForeignKey(n => n.InviteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
