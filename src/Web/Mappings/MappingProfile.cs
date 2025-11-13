using AutoMapper;
using Newtonsoft.Json;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs;
using ProjectManagement.Models.DTOs.Activity;
using ProjectManagement.Models.DTOs.Attachment;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.BoardInvite;
using ProjectManagement.Models.DTOs.BoardJoinRequest;
using ProjectManagement.Models.DTOs.Card;
using ProjectManagement.Models.DTOs.Checklist;
using ProjectManagement.Models.DTOs.Column;
using ProjectManagement.Models.DTOs.Comment;
using ProjectManagement.Models.DTOs.Label;
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

            CreateMap<BoardJoinRequest, BoardJoinRequestDto>();
            CreateMap<CreateBoardJoinRequestDto, BoardJoinRequest>();

            CreateMap<ActivityLog, ActivityLogDto>()
                .ForMember(dest => dest.Metadata, opt => opt.MapFrom(src =>
                    !string.IsNullOrEmpty(src.Metadata)
                        ? JsonConvert.DeserializeObject<Dictionary<string, object>>(src.Metadata)
                        : null))
                .ForMember(dest => dest.User,
                    opt => opt.MapFrom(src => new UserDto
                    {
                        Id = src.User.Id,
                        UserName = src.User.UserName ?? "",
                        Email = src.User.Email ?? "",
                        Avatar = src.User.Avatar
                    }))
                .ForMember(dest => dest.CardTitle, opt => opt.MapFrom(src =>
                    src.Card != null ? src.Card.Title : null))
                .ForMember(dest => dest.ColumnTitle, opt => opt.MapFrom(src =>
                    src.Column != null ? src.Column.Title : null));

            // Label mappings
            CreateMap<Label, LabelDto>();
            CreateMap<CreateLabelDto, Label>();
            CreateMap<UpdateLabelDto, Label>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<CardLabel, LabelDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Label.Id))
                .ForMember(dest => dest.BoardId, opt => opt.MapFrom(src => src.Label.BoardId))
                .ForMember(dest => dest.Title, opt => opt.MapFrom(src => src.Label.Title))
                .ForMember(dest => dest.Color, opt => opt.MapFrom(src => src.Label.Color))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.Label.CreatedAt));

            // Checklist mappings
            CreateMap<Checklist, ChecklistDto>();
            CreateMap<CreateChecklistDto, Checklist>();
            CreateMap<UpdateChecklistDto, Checklist>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<ChecklistItem, ChecklistItemDto>();
            CreateMap<CreateChecklistItemDto, ChecklistItem>();
            CreateMap<UpdateChecklistItemDto, ChecklistItem>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<Card, CardDto>()
                .ForMember(dest => dest.Members, opt => opt.MapFrom(src => src.Members))
                .ForMember(dest => dest.Comments, opt => opt.MapFrom(src => src.Comments.OrderBy(c => c.CreatedAt)))
                .ForMember(dest => dest.Attachments,
                    opt => opt.MapFrom(src => src.Attachments.OrderBy(a => a.CreatedAt)))
                .ForMember(dest => dest.Labels, opt => opt.MapFrom(src => src.Labels))
                .ForMember(dest => dest.Checklists, opt => opt.MapFrom(src => src.Checklists.OrderBy(c => c.Position)));
        }
    }
}