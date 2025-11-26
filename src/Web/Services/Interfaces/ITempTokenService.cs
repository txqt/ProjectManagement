namespace ProjectManagement.Services.Interfaces
{
    public interface ITempTokenService
    {
        string GenerateTempToken(string userId);
        string ValidateTempToken(string token);
    }
}