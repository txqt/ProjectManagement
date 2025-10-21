using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models.Domain.Common
{
    public abstract class BaseAuditableEntity : BaseEntity
    {
        public DateTime CreatedAt { get; set; }

        public string? CreatedBy { get; set; }

        [ConcurrencyCheck]
        public DateTime LastModified { get; set; }

        public string? LastModifiedBy { get; set; }
    }
}
