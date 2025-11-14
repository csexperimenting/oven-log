namespace OvenLogApi.Models;

public class Event
{
    public int Id { get; set; }
    public int TrakId { get; set; }
    public Trak Trak { get; set; } = null!;
    public int BoxId { get; set; }
    public Box Box { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int? ApplicationId { get; set; }
    public Application? Application { get; set; }
    public int Temperature { get; set; }
    public int Quantity { get; set; }
    public DateTime OvenInTime { get; set; }
    public DateTime? OvenOutTime { get; set; }
    public int PlannedBakeTimeMinutes { get; set; }
    public int? ActualBakeTimeMinutes { get; set; }
    public string? Notes { get; set; }
}
