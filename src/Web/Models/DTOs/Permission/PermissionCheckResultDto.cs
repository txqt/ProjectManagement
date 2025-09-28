namespace ProjectManagement.Models.DTOs.Permission
{
    public class PermissionCheckResultDto
    {
        public bool HasPermission { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
