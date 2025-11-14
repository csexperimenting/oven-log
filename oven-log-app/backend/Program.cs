using Microsoft.EntityFrameworkCore;
using OvenLogApi.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<OvenLogContext>(options =>
    options.UseInMemoryDatabase("OvenLogDb"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<OvenLogContext>();
    SeedData(context);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();

void SeedData(OvenLogContext context)
{
    if (context.BoxTypes.Any())
    {
        return;
    }

    var ovenType = new OvenLogApi.Models.BoxType { Name = "Oven" };
    var freezerType = new OvenLogApi.Models.BoxType { Name = "Freezer" };
    var refrigeratorType = new OvenLogApi.Models.BoxType { Name = "Refrigerator" };
    context.BoxTypes.AddRange(ovenType, freezerType, refrigeratorType);

    var manufacturer1 = new OvenLogApi.Models.Manufacturer { Name = "Despatch" };
    var manufacturer2 = new OvenLogApi.Models.Manufacturer { Name = "Blue M" };
    context.Manufacturers.AddRange(manufacturer1, manufacturer2);

    var model1 = new OvenLogApi.Models.Model { Name = "LBB2-18-1", Manufacturer = manufacturer1 };
    var model2 = new OvenLogApi.Models.Model { Name = "OV-490A-2", Manufacturer = manufacturer2 };
    context.Models.AddRange(model1, model2);

    var location1 = new OvenLogApi.Models.Location { Name = "Production Floor A" };
    var location2 = new OvenLogApi.Models.Location { Name = "Production Floor B" };
    context.Locations.AddRange(location1, location2);

    var box1 = new OvenLogApi.Models.Box
    {
        Type = ovenType,
        Manufacturer = manufacturer1,
        Model = model1,
        ToolNumber = "OVEN-001",
        Location = location1,
        DefaultTemperature = 150,
        WarmUpTimeMinutes = null
    };

    var box2 = new OvenLogApi.Models.Box
    {
        Type = ovenType,
        Manufacturer = manufacturer2,
        Model = model2,
        ToolNumber = "OVEN-002",
        Location = location2,
        DefaultTemperature = 125,
        WarmUpTimeMinutes = 30
    };

    context.Boxes.AddRange(box1, box2);

    var app1 = new OvenLogApi.Models.Application { Name = "Bake", DefaultBakeTimeMinutes = 60 };
    var app2 = new OvenLogApi.Models.Application { Name = "Cure", DefaultBakeTimeMinutes = 120 };
    var app3 = new OvenLogApi.Models.Application { Name = "Dry", DefaultBakeTimeMinutes = 30 };
    context.Applications.AddRange(app1, app2, app3);

    var user1 = new OvenLogApi.Models.User
    {
        Login = "admin",
        Email = "admin@example.com",
        Name = "Administrator",
        BadgeNumber = "001"
    };

    context.Users.Add(user1);

    var standardTime1 = new OvenLogApi.Models.StandardTime { TimeMinutes = 30, Description = "30 minutes" };
    var standardTime2 = new OvenLogApi.Models.StandardTime { TimeMinutes = 60, Description = "1 hour" };
    var standardTime3 = new OvenLogApi.Models.StandardTime { TimeMinutes = 120, Description = "2 hours" };
    var standardTime4 = new OvenLogApi.Models.StandardTime { TimeMinutes = 240, Description = "4 hours" };
    context.StandardTimes.AddRange(standardTime1, standardTime2, standardTime3, standardTime4);

    context.SaveChanges();
}
