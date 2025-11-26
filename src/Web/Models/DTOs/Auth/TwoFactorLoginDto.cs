namespace ProjectManagement.Models.DTOs.Auth
{
    public class TwoFactorLoginDto
    {
        public string TempToken { get; set; }
        public string Code { get; set; }
    }
}