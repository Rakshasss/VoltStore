using Adashop.Data;
using Adashop.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ExtendServices(builder.Configuration);

var app = builder.Build();

// Auto-migrate and seed database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DataContext>();
    db.Database.EnsureCreated();
    await DataSeeder.SeedAsync(db);
}

app.ExtendApplication();

app.Run();
