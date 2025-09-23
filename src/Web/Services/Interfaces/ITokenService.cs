using ProjectManagement.Models.Domain.Entities;

namespace ProjectManagement.Services.Interfaces
{
    public interface ITokenService
    {
        Task<string> GenerateTokenAsync(ApplicationUser user);
    }
}
