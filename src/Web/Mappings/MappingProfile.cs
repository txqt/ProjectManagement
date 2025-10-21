using AutoMapper;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs;
using ProjectManagement.Models.DTOs.Attachment;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.BoardInvite;
using ProjectManagement.Models.DTOs.Card;
using ProjectManagement.Models.DTOs.Column;
using ProjectManagement.Models.DTOs.Comment;
using ProjectManagement.Models.DTOs.Notification;
using System.Text.Json;

namespace ProjectManagement.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // ==========================
            // User mappings
            // ==========================
            CreateMap<ApplicationUser, UserDto>()
                .ForMember(dest => dest.CreatedAt,
                    opt => opt.MapFrom(src => src.CreatedAt));

            CreateMap<UserDto, ApplicationUser>()
                .ForMember(dest => dest.CreatedAt,
                    opt => opt.MapFrom(src => src.CreatedAt));

            // ==========================
            // Board mappings
            // ==========================
            CreateMap<Board, BoardDto>();

            CreateMap<CreateBoardDto, Board>();
            CreateMap<UpdateBoardDto, Board>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<BoardMember, BoardMemberDto>();

            // ==========================
            // Column mappings
            // ==========================
            CreateMap<Column, ColumnDto>()
                .AfterMap((src, dest) =>
                {
                    if (dest.Cards != null)
                    {
                        // Sort cards by rank if available, else fallback to order in DB
                        dest.Cards = dest.Cards
                            .OrderBy(c => c.Rank ?? string.Empty)
                            .ToList();
                    }
                });

            CreateMap<CreateColumnDto, Column>();
            CreateMap<UpdateColumnDto, Column>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // ==========================
            // Card mappings
            // ==========================
            CreateMap<Card, CardDto>()
                .ForMember(dest => dest.Members, opt => opt.MapFrom(src => src.Members))
                .ForMember(dest => dest.Comments, opt => opt.MapFrom(src => src.Comments.OrderBy(c => c.CreatedAt)))
                .ForMember(dest => dest.Attachments,
                    opt => opt.MapFrom(src => src.Attachments.OrderBy(a => a.CreatedAt)))
                .AfterMap((src, dest) =>
                {
                    // Optional: ensure cards remain sorted correctly (no additional sorting needed)
                });

            CreateMap<CreateCardDto, Card>();
            CreateMap<UpdateCardDto, Card>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<CardMember, CardMemberDto>()
                .ForMember(dest => dest.User, opt => opt.MapFrom(src => src.User));
            
            CreateMap<CardMemberDto, CardMember>()
                .ForMember(dest => dest.User, opt => opt.Ignore());
            
            // ==========================
            // Comment mappings
            // ==========================
            CreateMap<Comment, CommentDto>();
            CreateMap<CreateCommentDto, Comment>();
            CreateMap<UpdateCommentDto, Comment>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // ==========================
            // Attachment mappings
            // ==========================
            CreateMap<Attachment, AttachmentDto>();
            CreateMap<CreateAttachmentDto, Attachment>();

            // ==========================
            // BoardInvite mappings
            // ==========================
            CreateMap<BoardInvite, BoardInviteDto>();
            CreateMap<CreateBoardInviteDto, BoardInvite>();

            // ==========================
            // Notification mappings
            // ==========================
            CreateMap<Notification, NotificationDto>()
                .ForMember(d => d.Data, opt => opt.MapFrom<NotificationToDtoResolver>());

            CreateMap<CreateNotificationDto, Notification>()
                .ForMember(d => d.Data, opt => opt.MapFrom<CreateNotificationDtoToNotificationResolver>());
        }
    }
}