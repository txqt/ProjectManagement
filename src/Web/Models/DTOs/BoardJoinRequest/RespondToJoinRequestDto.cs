namespace ProjectManagement.Models.DTOs.BoardJoinRequest
{
    public class RespondToJoinRequestDto
    {
        public string Response { get; set; } = string.Empty; // "approve" or "reject"
        public string? Role { get; set; } = "member"; // Role to assign if approved
    }
}