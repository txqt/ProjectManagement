using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.DTOs.Column
{
    public class UpdateColumnDto
    {
        [MaxLength(200)]
        public string? Title { get; set; }

        public List<string>? CardOrderIds { get; set; }
    }
}
