using ProjectManagement.Models.Domain.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectManagement.Models.Domain.Entities
{
    public class Attachment : BaseAuditableEntity
    {
        [Required]
        public string CardId { get; set; } = string.Empty;

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Url { get; set; } = string.Empty;

        public string Type { get; set; } = "file"; // file, image, doc, etc.

        // Navigation properties
        public virtual Card Card { get; set; } = null!;
    }
}
