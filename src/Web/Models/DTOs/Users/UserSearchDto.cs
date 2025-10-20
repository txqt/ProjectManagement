﻿namespace ProjectManagement.Models.DTOs
{
    public class UserSearchDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Avatar { get; set; } // nếu bạn lưu avatar url
    }
}
