using AutoMapper;
using ProjectManagement.Models.Domain.Entities;
using ProjectManagement.Models.DTOs;
using ProjectManagement.Models.DTOs.Attachment;
using ProjectManagement.Models.DTOs.Board;
using ProjectManagement.Models.DTOs.Card;
using ProjectManagement.Models.DTOs.Column;
using ProjectManagement.Models.DTOs.Comment;

namespace ProjectManagement.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User mappings
            CreateMap<ApplicationUser, UserDto>();

            // Board mappings
            CreateMap<Board, BoardDto>()
                .ForMember(dest => dest.Columns, opt => opt.MapFrom(src =>
                    src.Columns.OrderBy(c => src.ColumnOrderIds.IndexOf(c.Id)).ToList()));

            CreateMap<CreateBoardDto, Board>();
            CreateMap<UpdateBoardDto, Board>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<BoardMember, BoardMemberDto>();

            // Column mappings
            CreateMap<Column, ColumnDto>()
                .ForMember(dest => dest.Cards, opt => opt.MapFrom(src =>
                    src.Cards.OrderBy(c => src.CardOrderIds.IndexOf(c.Id)).ToList()));

            CreateMap<CreateColumnDto, Column>();
            CreateMap<UpdateColumnDto, Column>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Card mappings
            CreateMap<Card, CardDto>()
                .ForMember(dest => dest.Members, opt => opt.MapFrom(src => src.Members.Select(cm => cm.User)))
                .ForMember(dest => dest.Comments, opt => opt.MapFrom(src => src.Comments.OrderBy(c => c.Created)))
                .ForMember(dest => dest.Attachments, opt => opt.MapFrom(src => src.Attachments.OrderBy(a => a.Created)));

            CreateMap<CreateCardDto, Card>();
            CreateMap<UpdateCardDto, Card>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Comment mappings
            CreateMap<Comment, CommentDto>();
            CreateMap<CreateCommentDto, Comment>();
            CreateMap<UpdateCommentDto, Comment>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Attachment mappings
            CreateMap<Attachment, AttachmentDto>();
            CreateMap<CreateAttachmentDto, Attachment>();

            CreateMap<ApplicationUser, UserDto>()
            .ForMember(dest => dest.CreatedAt,
                       opt => opt.MapFrom(src => src.CreatedAt.UtcDateTime));

            CreateMap<UserDto, ApplicationUser>()
                .ForMember(dest => dest.CreatedAt,
                           opt => opt.MapFrom(src => new DateTimeOffset(src.CreatedAt)));
        }
    }
}
