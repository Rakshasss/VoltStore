using Adashop.Services.Background;
using Hangfire;

namespace Adashop.Extensions;

public static class ApplicationExtensions
{
    public static WebApplication ExtendApplication( this WebApplication app )
    {
        app.UseSwagger();
        app.UseSwaggerUI();

        app.UseHangfireDashboard();

        RecurringJob.AddOrUpdate<IEmailJobService>("send-email-to-inactive-users", job => job.SendInactiveEmails(), Cron.Daily);

        app.UseCors("AllowFrontend");
        // Removed UseHttpsRedirection - causes issues in local dev without HTTPS cert
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();

        return app;
    }
}
