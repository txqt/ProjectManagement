namespace ProjectManagement.Models.DTOs.Permission
{
    public class UserPermissionsDto
    {
        public string UserId { get; set; } = string.Empty;
        public List<string> SystemPermissions { get; set; } = new List<string>();
        public Dictionary<string, List<string>> BoardPermissions { get; set; } = new Dictionary<string, List<string>>();
    }
}
