using Microsoft.EntityFrameworkCore;
using OvenLogApi.Models;

namespace OvenLogApi.Data;

public class OvenLogContext : DbContext
{
    public OvenLogContext(DbContextOptions<OvenLogContext> options) : base(options)
    {
    }

    public DbSet<Part> Parts { get; set; }
    public DbSet<Trak> Traks { get; set; }
    public DbSet<BoxType> BoxTypes { get; set; }
    public DbSet<Manufacturer> Manufacturers { get; set; }
    public DbSet<Model> Models { get; set; }
    public DbSet<Location> Locations { get; set; }
    public DbSet<Box> Boxes { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Alias> Aliases { get; set; }
    public DbSet<Application> Applications { get; set; }
    public DbSet<Event> Events { get; set; }
    public DbSet<OnEvent> OnEvents { get; set; }
    public DbSet<StandardTime> StandardTimes { get; set; }
    public DbSet<UserOven> UserOvens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserOven>()
            .HasKey(uo => new { uo.UserId, uo.BoxId });

        modelBuilder.Entity<UserOven>()
            .HasOne(uo => uo.User)
            .WithMany(u => u.UserOvens)
            .HasForeignKey(uo => uo.UserId);

        modelBuilder.Entity<UserOven>()
            .HasOne(uo => uo.Box)
            .WithMany(b => b.UserOvens)
            .HasForeignKey(uo => uo.BoxId);

        modelBuilder.Entity<Trak>()
            .HasIndex(t => t.TrakId)
            .IsUnique();

        modelBuilder.Entity<Event>()
            .HasOne(e => e.Application)
            .WithMany(a => a.Events)
            .HasForeignKey(e => e.ApplicationId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
