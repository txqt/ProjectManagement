using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ProjectManagement.Services.Interfaces;

namespace ProjectManagement.Services
{
    public class ActivityLogCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ActivityLogCleanupService> _logger;
        private readonly TimeSpan _interval = TimeSpan.FromDays(1); // Run daily
        private readonly int _daysToKeep = 90; // Keep 90 days of logs

        public ActivityLogCleanupService(
            IServiceProvider serviceProvider,
            ILogger<ActivityLogCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Activity Log Cleanup Service started");

            try
            {
                while (!stoppingToken.IsCancellationRequested)
                {
                    try
                    {
                        await Task.Delay(_interval, stoppingToken);

                        using var scope = _serviceProvider.CreateScope();
                        var activityLogService = scope.ServiceProvider
                            .GetRequiredService<IActivityLogService>();

                        _logger.LogInformation("Starting activity log cleanup...");
                        await activityLogService.DeleteOldActivitiesAsync(_daysToKeep);
                        _logger.LogInformation("Activity log cleanup completed");
                    }
                    catch (TaskCanceledException)
                    {
                        // Container stopping, không cần log lỗi
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error during activity log cleanup");
                    }
                }
            }
            finally
            {
                _logger.LogInformation("Activity Log Cleanup Service stopped");
            }
        }

    }
}