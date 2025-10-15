using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class NotificationCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<NotificationCleanupService> _logger;
        private readonly TimeSpan _period = TimeSpan.FromHours(6); // Run every 6 hours

        public NotificationCleanupService(
            IServiceProvider serviceProvider,
            ILogger<NotificationCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var inviteService = scope.ServiceProvider.GetRequiredService<IBoardInviteService>();

                    await inviteService.CleanupExpiredInvitesAsync();

                    _logger.LogInformation("Notification cleanup completed at {Time}", DateTime.UtcNow);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during notification cleanup");
                }

                await Task.Delay(_period, stoppingToken);
            }
        }
    }
}
